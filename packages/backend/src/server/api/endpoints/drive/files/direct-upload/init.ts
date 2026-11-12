/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/const.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DirectUploadError, DirectUploadService } from '@/core/DirectUploadService.js';
import { MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	prohibitMoved: true,

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	kind: 'write:drive',

	description: 'Start a direct upload to object storage. Returns a presigned URL for each part.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			uploadId: { type: 'string', optional: false, nullable: false },
			partSize: { type: 'integer', optional: false, nullable: false },
			urls: {
				type: 'array',
				optional: false, nullable: false,
				items: { type: 'string', optional: false, nullable: false },
			},
		},
	},

	errors: {
		unavailable: {
			message: 'Direct upload is not available on this server.',
			code: 'DIRECT_UPLOAD_UNAVAILABLE',
			id: '16f5f99d-1e4f-456d-b8da-27e8acb8502c',
		},

		maxFileSizeExceeded: {
			message: 'Cannot upload the file because it exceeds the maximum file size.',
			code: 'MAX_FILE_SIZE_EXCEEDED',
			id: '7d493beb-a5be-40a1-9861-004d6dc863e7',
			httpStatusCode: 413,
		},

		noFreeSpace: {
			message: 'Cannot upload the file because you have no free space of drive.',
			code: 'NO_FREE_SPACE',
			id: '1221e3c5-b57d-4bb4-a2db-fdc17c459612',
		},

		invalidFileName: {
			message: 'Invalid file name.',
			code: 'INVALID_FILE_NAME',
			id: '3d908334-684c-4fb3-9fba-6eae8c9d84db',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		size: { type: 'integer', minimum: 1 },
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		name: { type: 'string', nullable: true, default: null },
		comment: { type: 'string', nullable: true, maxLength: DB_MAX_IMAGE_COMMENT_LENGTH, default: null },
		isSensitive: { type: 'boolean', default: false },
		force: { type: 'boolean', default: false },
	},
	required: ['size'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private driveFileEntityService: DriveFileEntityService,
		private directUploadService: DirectUploadService,
	) {
		super(meta, paramDef, async (ps, me, _token, _file, _cleanup, ip, headers) => {
			let name = ps.name?.trim() ?? null;
			if (name === '' || name === 'blob') name = null;
			if (name != null && !this.driveFileEntityService.validateFileName(name)) {
				throw new ApiError(meta.errors.invalidFileName);
			}

			try {
				return await this.directUploadService.init(me, {
					size: ps.size,
					name,
					folderId: ps.folderId,
					comment: ps.comment,
					isSensitive: ps.isSensitive,
					force: ps.force,
					requestIp: this.serverSettings.enableIpLogging ? (ip ?? null) : null,
					requestHeaders: this.serverSettings.enableIpLogging ? (headers ?? null) : null,
				});
			} catch (err) {
				if (err instanceof DirectUploadError) {
					if (err.code === 'UNAVAILABLE') throw new ApiError(meta.errors.unavailable);
					if (err.code === 'MAX_FILE_SIZE_EXCEEDED') throw new ApiError(meta.errors.maxFileSizeExceeded);
					if (err.code === 'NO_FREE_SPACE') throw new ApiError(meta.errors.noFreeSpace);
				}
				throw err;
			}
		});
	}
}
