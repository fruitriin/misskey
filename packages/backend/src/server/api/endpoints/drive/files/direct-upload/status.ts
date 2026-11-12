/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DirectUploadError, DirectUploadService } from '@/core/DirectUploadService.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	limit: {
		duration: ms('1minute'),
		max: 120,
	},

	description: 'Get the state of a direct upload.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			status: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['uploading', 'processing', 'done', 'failed'],
			},
			file: {
				type: 'object',
				optional: false, nullable: true,
				ref: 'DriveFile',
			},
			errorCode: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},

	errors: {
		noSuchUpload: {
			message: 'No such upload.',
			code: 'NO_SUCH_UPLOAD',
			id: 'c4541465-9d20-46e7-9400-8dfbf78ab15b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uploadId: { type: 'string', format: 'misskey:id' },
	},
	required: ['uploadId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private directUploadService: DirectUploadService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				const s = await this.directUploadService.getStatus(me, ps.uploadId);
				const file = s.fileId ? await this.driveFilesRepository.findOneBy({ id: s.fileId }) : null;
				return {
					status: s.status,
					file: file ? await this.driveFileEntityService.pack(file, { self: true }) : null,
					errorCode: s.errorCode,
				};
			} catch (err) {
				if (err instanceof DirectUploadError && err.code === 'NO_SUCH_UPLOAD') throw new ApiError(meta.errors.noSuchUpload);
				throw err;
			}
		});
	}
}
