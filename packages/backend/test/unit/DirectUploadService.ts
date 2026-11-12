/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { Readable } from 'node:stream';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
	AbortMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	CreateMultipartUploadCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { DirectUploadError, DirectUploadService, DIRECT_UPLOAD_PART_SIZE } from '@/core/DirectUploadService.js';
import { DriveService } from '@/core/DriveService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { RoleService } from '@/core/RoleService.js';
import { QueueService } from '@/core/QueueService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiLocalUser } from '@/models/User.js';
import type { MiMeta, UsersRepository } from '@/models/_.js';
import type { TestingModule } from '@nestjs/testing';

const alice = { id: 'alice0000000', host: null } as MiLocalUser;
const bob = { id: 'bob000000000', host: null } as MiLocalUser;
const MB = 1024 * 1024;

describe('DirectUploadService', () => {
	let app: TestingModule;
	let service: DirectUploadService;
	let meta: MiMeta;
	let config: Config;
	let savedMeta: Partial<MiMeta>;
	let savedEnable: boolean;
	const s3Mock = mockClient(S3Client);

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		}).compile();
		app.enableShutdownHooks();
		service = app.get(DirectUploadService);
		meta = app.get<MiMeta>(DI.meta);
		config = app.get<Config>(DI.config);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		s3Mock.reset();
		savedMeta = { ...meta };
		savedEnable = config.enableDirectUpload;
		config.enableDirectUpload = true;
		Object.assign(meta, {
			useObjectStorage: true,
			objectStorageBucket: 'test-bucket',
			objectStoragePrefix: 'files',
			objectStorageEndpoint: 'example.r2.cloudflarestorage.com',
			objectStorageRegion: 'auto',
			objectStorageAccessKey: 'ak',
			objectStorageSecretKey: 'sk',
			objectStorageUseSSL: true,
		});
		vi.spyOn(app.get(RoleService), 'isModerator').mockResolvedValue(false);
		vi.spyOn(app.get(RoleService), 'getUserPolicies').mockResolvedValue({ maxFileSizeMb: 500, driveCapacityMb: 10240 } as never);
		vi.spyOn(app.get(DriveFileEntityService), 'calcDriveUsageOf').mockResolvedValue(0);
		vi.spyOn(app.get(QueueService), 'createFinalizeDirectUploadJob').mockResolvedValue({} as never);
		s3Mock.on(CreateMultipartUploadCommand).resolves({ UploadId: 's3-upload-1' });
		s3Mock.on(CompleteMultipartUploadCommand).resolves({});
		s3Mock.on(DeleteObjectCommand).resolves({});
		s3Mock.on(AbortMultipartUploadCommand).resolves({});
	});

	afterEach(() => {
		Object.assign(meta, savedMeta);
		config.enableDirectUpload = savedEnable;
		vi.restoreAllMocks();
	});

	const initArgs = (size: number) => ({
		size, name: 'movie.mp4', folderId: null, comment: null, isSensitive: false, force: true, requestIp: null, requestHeaders: null,
	});
	const partsFor = (n: number) => Array.from({ length: n }, (_, i) => ({ partNumber: i + 1, etag: `"etag${i + 1}"` }));

	describe('init', () => {
		test('rejects when disabled in config', async () => {
			config.enableDirectUpload = false;
			await expect(service.init(alice, initArgs(100 * MB))).rejects.toMatchObject({ code: 'UNAVAILABLE' });
		});

		test('rejects when object storage is off', async () => {
			meta.useObjectStorage = false;
			await expect(service.init(alice, initArgs(100 * MB))).rejects.toMatchObject({ code: 'UNAVAILABLE' });
		});

		test('rejects a size over the role policy before touching S3', async () => {
			await expect(service.init(alice, initArgs(501 * MB))).rejects.toMatchObject({ code: 'MAX_FILE_SIZE_EXCEEDED' });
			expect(s3Mock.commandCalls(CreateMultipartUploadCommand)).toHaveLength(0);
		});

		test('rejects when drive capacity would overflow', async () => {
			vi.spyOn(app.get(DriveFileEntityService), 'calcDriveUsageOf').mockResolvedValue(10240 * MB - 1);
			await expect(service.init(alice, initArgs(100 * MB))).rejects.toMatchObject({ code: 'NO_FREE_SPACE' });
		});

		test('returns one presigned URL per part with content-length signed', async () => {
			const size = 2 * DIRECT_UPLOAD_PART_SIZE + 123;
			const res = await service.init(alice, initArgs(size));

			expect(res.partSize).toBe(DIRECT_UPLOAD_PART_SIZE);
			expect(res.urls).toHaveLength(3);
			res.urls.forEach((u, i) => {
				const url = new URL(u);
				expect(url.pathname).toBe(`/test-bucket/files/direct-upload-pending/${res.uploadId}`);
				expect(url.searchParams.get('partNumber')).toBe(String(i + 1));
				expect(url.searchParams.get('uploadId')).toBe('s3-upload-1');
				expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain('content-length');
			});
			expect((await service.getStatus(alice, res.uploadId)).status).toBe('uploading');
		});
	});

	describe('complete', () => {
		test('completes, verifies size and enqueues finalize', async () => {
			const size = 2 * DIRECT_UPLOAD_PART_SIZE + 123;
			const { uploadId } = await service.init(alice, initArgs(size));
			s3Mock.on(HeadObjectCommand).resolves({ ContentLength: size });

			await service.complete(alice, uploadId, partsFor(3));

			expect(s3Mock.commandCalls(CompleteMultipartUploadCommand)[0].args[0].input.MultipartUpload?.Parts).toEqual([
				{ PartNumber: 1, ETag: '"etag1"' }, { PartNumber: 2, ETag: '"etag2"' }, { PartNumber: 3, ETag: '"etag3"' },
			]);
			expect(app.get(QueueService).createFinalizeDirectUploadJob).toHaveBeenCalledWith(uploadId);
			expect((await service.getStatus(alice, uploadId)).status).toBe('processing');
		});

		test('hides uploads of other users', async () => {
			const { uploadId } = await service.init(alice, initArgs(100 * MB));
			await expect(service.complete(bob, uploadId, partsFor(10))).rejects.toMatchObject({ code: 'NO_SUCH_UPLOAD' });
			await expect(service.getStatus(bob, uploadId)).rejects.toMatchObject({ code: 'NO_SUCH_UPLOAD' });
		});

		test('rejects a missing part', async () => {
			const { uploadId } = await service.init(alice, initArgs(3 * DIRECT_UPLOAD_PART_SIZE));
			await expect(service.complete(alice, uploadId, partsFor(2))).rejects.toMatchObject({ code: 'INVALID_STATE' });
			expect((await service.getStatus(alice, uploadId)).status).toBe('uploading');
		});

		test('rejects the second complete and enqueues only once', async () => {
			const size = 3 * DIRECT_UPLOAD_PART_SIZE;
			const { uploadId } = await service.init(alice, initArgs(size));
			s3Mock.on(HeadObjectCommand).resolves({ ContentLength: size });

			await service.complete(alice, uploadId, partsFor(3));
			await expect(service.complete(alice, uploadId, partsFor(3))).rejects.toMatchObject({ code: 'INVALID_STATE' });
			expect(app.get(QueueService).createFinalizeDirectUploadJob).toHaveBeenCalledTimes(1);
		});

		test('deletes the object and fails on size mismatch', async () => {
			const size = 3 * DIRECT_UPLOAD_PART_SIZE;
			const { uploadId } = await service.init(alice, initArgs(size));
			s3Mock.on(HeadObjectCommand).resolves({ ContentLength: size + 1 });

			await expect(service.complete(alice, uploadId, partsFor(3))).rejects.toMatchObject({ code: 'SIZE_MISMATCH' });
			expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
			expect(await service.getStatus(alice, uploadId)).toMatchObject({ status: 'failed', errorCode: 'SIZE_MISMATCH' });
		});
	});

	describe('abort', () => {
		test('aborts the multipart upload and forgets the state', async () => {
			const { uploadId } = await service.init(alice, initArgs(100 * MB));
			await service.abort(alice, uploadId);
			expect(s3Mock.commandCalls(AbortMultipartUploadCommand)).toHaveLength(1);
			await expect(service.getStatus(alice, uploadId)).rejects.toBeInstanceOf(DirectUploadError);
		});
	});

	describe('finalize', () => {
		const prepare = async () => {
			const size = 3 * DIRECT_UPLOAD_PART_SIZE;
			const { uploadId } = await service.init(alice, initArgs(size));
			s3Mock.on(HeadObjectCommand).resolves({ ContentLength: size });
			await service.complete(alice, uploadId, partsFor(3));
			s3Mock.on(GetObjectCommand).resolves({ Body: Readable.from([Buffer.from('dummy')]) as never });
			vi.spyOn(app.get<UsersRepository>(DI.usersRepository), 'findOneByOrFail').mockResolvedValue(alice as never);
			return uploadId;
		};

		test('passes the pending key to addFile and deletes the pending object', async () => {
			const uploadId = await prepare();
			const addFile = vi.spyOn(app.get(DriveService), 'addFile').mockResolvedValue({ id: 'file00000001' } as never);

			await service.finalize(uploadId);

			expect(addFile).toHaveBeenCalledWith(expect.objectContaining({
				user: alice,
				name: 'movie.mp4',
				force: true,
				preUploadedKey: `files/direct-upload-pending/${uploadId}`,
			}));
			expect(await service.getStatus(alice, uploadId)).toMatchObject({ status: 'done', fileId: 'file00000001' });
			expect(s3Mock.commandCalls(DeleteObjectCommand).map(c => c.args[0].input.Key)).toContain(`files/direct-upload-pending/${uploadId}`);
		});

		test('keeps the existing file on hash match and still deletes the pending object', async () => {
			const uploadId = await prepare();
			// force: false で同一ハッシュがあると addFile は既存ファイルを返す
			vi.spyOn(app.get(DriveService), 'addFile').mockResolvedValue({ id: 'existing0001' } as never);

			await service.finalize(uploadId);

			expect(await service.getStatus(alice, uploadId)).toMatchObject({ status: 'done', fileId: 'existing0001' });
			expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
		});

		test('maps addFile errors to error codes', async () => {
			const uploadId = await prepare();
			vi.spyOn(app.get(DriveService), 'addFile').mockRejectedValue(
				new IdentifiableError('bd71c601-f9b0-4808-9137-a330647ced9b', 'Unallowed file type'),
			);

			await service.finalize(uploadId);

			expect(await service.getStatus(alice, uploadId)).toMatchObject({ status: 'failed', errorCode: 'UNALLOWED_FILE_TYPE' });
			expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
		});

		test('ignores an upload that is not processing', async () => {
			const { uploadId } = await service.init(alice, initArgs(100 * MB));
			const addFile = vi.spyOn(app.get(DriveService), 'addFile');
			await service.finalize(uploadId);
			expect(addFile).not.toHaveBeenCalled();
		});
	});
});
