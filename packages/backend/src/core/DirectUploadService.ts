/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import {
	AbortMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	CreateMultipartUploadCommand,
	HeadObjectCommand,
	UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiMeta } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import { bindThis } from '@/decorators.js';
import { S3Service } from '@/core/S3Service.js';
import { IdService } from '@/core/IdService.js';
import { RoleService } from '@/core/RoleService.js';
import { DriveService } from '@/core/DriveService.js';
import { QueueService } from '@/core/QueueService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';

export const DIRECT_UPLOAD_PART_SIZE = 10 * 1024 * 1024;
const DIRECT_UPLOAD_MAX_PARTS = 1000;
const PENDING_DIR = 'direct-upload-pending';
const PRESIGN_EXPIRES_SEC = 60 * 60 * 3;
const STATE_TTL_SEC = 60 * 60 * 24;

export type DirectUploadErrorCode =
	'UNAVAILABLE' | 'NO_SUCH_UPLOAD' | 'INVALID_STATE' | 'SIZE_MISMATCH' |
	'MAX_FILE_SIZE_EXCEEDED' | 'NO_FREE_SPACE' | 'UNALLOWED_FILE_TYPE' | 'INAPPROPRIATE' | 'FAILED';

export type DirectUploadStatus = 'uploading' | 'processing' | 'done' | 'failed';

export class DirectUploadError extends Error {
	constructor(public code: DirectUploadErrorCode) {
		super(`Direct upload error: ${code}`);
	}
}

export type DirectUploadInitArgs = {
	size: number;
	name: string | null;
	folderId: string | null;
	comment: string | null;
	isSensitive: boolean;
	force: boolean;
	requestIp: string | null;
	requestHeaders: Record<string, string> | null;
};

type DirectUploadState = DirectUploadInitArgs & {
	userId: string;
	key: string;
	s3UploadId: string;
	partCount: number;
	status: DirectUploadStatus;
	fileId: string | null;
	errorCode: DirectUploadErrorCode | null;
};

@Injectable()
export class DirectUploadService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private s3Service: S3Service,
		private idService: IdService,
		private roleService: RoleService,
		private driveService: DriveService,
		private driveFileEntityService: DriveFileEntityService,
		private queueService: QueueService,
	) {
	}

	@bindThis
	public isAvailable(): boolean {
		return this.config.enableDirectUpload && this.meta.useObjectStorage && this.meta.objectStorageBucket != null;
	}

	@bindThis
	public async init(user: MiLocalUser, args: DirectUploadInitArgs): Promise<{ uploadId: string; partSize: number; urls: string[] }> {
		if (!this.isAvailable()) throw new DirectUploadError('UNAVAILABLE');

		const partCount = Math.max(1, Math.ceil(args.size / DIRECT_UPLOAD_PART_SIZE));
		if (args.size > this.config.maxFileSize || partCount > DIRECT_UPLOAD_MAX_PARTS) {
			throw new DirectUploadError('MAX_FILE_SIZE_EXCEEDED');
		}

		// addFile でも同じ検査をするが、数百 MB を送らせる前に弾く
		if (!await this.roleService.isModerator(user)) {
			const policies = await this.roleService.getUserPolicies(user.id);
			if (args.size > policies.maxFileSizeMb * 1024 * 1024) throw new DirectUploadError('MAX_FILE_SIZE_EXCEEDED');
			const usage = await this.driveFileEntityService.calcDriveUsageOf(user);
			if (usage + args.size > policies.driveCapacityMb * 1024 * 1024) throw new DirectUploadError('NO_FREE_SPACE');
		}

		const uploadId = this.idService.gen();
		const prefix = this.meta.objectStoragePrefix ? `${this.meta.objectStoragePrefix}/` : '';
		const key = `${prefix}${PENDING_DIR}/${uploadId}`;
		const bucket = this.meta.objectStorageBucket!;
		const client = this.s3Service.getS3Client(this.meta);

		const created = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }));
		if (created.UploadId == null) throw new DirectUploadError('FAILED');
		const s3UploadId = created.UploadId;

		const urls = await Promise.all(Array.from({ length: partCount }, (_, i) => {
			const partNumber = i + 1;
			const contentLength = partNumber < partCount
				? DIRECT_UPLOAD_PART_SIZE
				: args.size - DIRECT_UPLOAD_PART_SIZE * (partCount - 1);
			// content-length を署名に含め、申告と異なるサイズのパートをストレージ側で拒否させる
			return getSignedUrl(client, new UploadPartCommand({
				Bucket: bucket,
				Key: key,
				UploadId: s3UploadId,
				PartNumber: partNumber,
				ContentLength: contentLength,
			}), {
				expiresIn: PRESIGN_EXPIRES_SEC,
				signableHeaders: new Set(['content-length']),
			});
		}));

		await this.saveState(uploadId, {
			...args,
			userId: user.id,
			key,
			s3UploadId,
			partCount,
			status: 'uploading',
			fileId: null,
			errorCode: null,
		});

		return { uploadId, partSize: DIRECT_UPLOAD_PART_SIZE, urls };
	}

	@bindThis
	public async complete(user: MiLocalUser, uploadId: string, parts: { partNumber: number; etag: string }[]): Promise<void> {
		const state = await this.getOwnState(user, uploadId);
		if (state.status !== 'uploading') throw new DirectUploadError('INVALID_STATE');

		const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
		if (sorted.length !== state.partCount || sorted.some((p, i) => p.partNumber !== i + 1)) {
			throw new DirectUploadError('INVALID_STATE');
		}

		// 二重 complete を防ぐ
		const locked = await this.redisClient.set(`${this.stateKey(uploadId)}:completing`, '1', 'EX', STATE_TTL_SEC, 'NX');
		if (locked !== 'OK') throw new DirectUploadError('INVALID_STATE');

		const bucket = this.meta.objectStorageBucket!;
		const client = this.s3Service.getS3Client(this.meta);

		try {
			await client.send(new CompleteMultipartUploadCommand({
				Bucket: bucket,
				Key: state.key,
				UploadId: state.s3UploadId,
				MultipartUpload: { Parts: sorted.map(p => ({ PartNumber: p.partNumber, ETag: p.etag })) },
			}));
		} catch {
			await client.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: state.key, UploadId: state.s3UploadId })).catch(() => {});
			await this.saveState(uploadId, { ...state, status: 'failed', errorCode: 'FAILED' });
			throw new DirectUploadError('FAILED');
		}

		const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: state.key }));
		if (head.ContentLength !== state.size) {
			await this.driveService.deleteObjectStorageFile(state.key);
			await this.saveState(uploadId, { ...state, status: 'failed', errorCode: 'SIZE_MISMATCH' });
			throw new DirectUploadError('SIZE_MISMATCH');
		}

		await this.saveState(uploadId, { ...state, status: 'processing' });
		await this.queueService.createFinalizeDirectUploadJob(uploadId);
	}

	@bindThis
	public async abort(user: MiLocalUser, uploadId: string): Promise<void> {
		const state = await this.getOwnState(user, uploadId);
		if (state.status === 'uploading') {
			await this.s3Service.getS3Client(this.meta).send(new AbortMultipartUploadCommand({
				Bucket: this.meta.objectStorageBucket!,
				Key: state.key,
				UploadId: state.s3UploadId,
			})).catch(() => {});
		}
		await this.redisClient.del(this.stateKey(uploadId));
	}

	@bindThis
	public async getStatus(user: MiLocalUser, uploadId: string): Promise<{ status: DirectUploadStatus; fileId: string | null; errorCode: DirectUploadErrorCode | null }> {
		const state = await this.getOwnState(user, uploadId);
		return { status: state.status, fileId: state.fileId, errorCode: state.errorCode };
	}

	@bindThis
	public async finalize(uploadId: string): Promise<void> {
		// 次の段階で実装する
		throw new Error(`not implemented: ${uploadId}`);
	}

	private stateKey(uploadId: string): string {
		return `directUpload:${uploadId}`;
	}

	@bindThis
	private async loadState(uploadId: string): Promise<DirectUploadState | null> {
		const raw = await this.redisClient.get(this.stateKey(uploadId));
		return raw == null ? null : JSON.parse(raw) as DirectUploadState;
	}

	@bindThis
	private async getOwnState(user: MiLocalUser, uploadId: string): Promise<DirectUploadState> {
		const state = await this.loadState(uploadId);
		if (state == null || state.userId !== user.id) throw new DirectUploadError('NO_SUCH_UPLOAD');
		return state;
	}

	@bindThis
	private async saveState(uploadId: string, state: DirectUploadState): Promise<void> {
		await this.redisClient.set(this.stateKey(uploadId), JSON.stringify(state), 'EX', STATE_TTL_SEC);
	}
}
