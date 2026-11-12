/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DirectUploadError, DirectUploadService } from '@/core/DirectUploadService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:drive',

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	description: 'Finish a direct upload. The file is processed in the background; poll drive/files/direct-upload/status.',

	errors: {
		noSuchUpload: {
			message: 'No such upload.',
			code: 'NO_SUCH_UPLOAD',
			id: 'aaed40b7-d385-464c-8c03-eec177086155',
		},

		invalidState: {
			message: 'The upload is not in a state that can be completed.',
			code: 'INVALID_STATE',
			id: '9c764f53-632a-4127-8147-cb7ad1138b70',
		},

		sizeMismatch: {
			message: 'Uploaded size does not match the declared size.',
			code: 'SIZE_MISMATCH',
			id: 'a9363514-1ce0-4576-a329-604075823dde',
		},

		uploadFailed: {
			message: 'Failed to complete the upload on object storage.',
			code: 'UPLOAD_FAILED',
			id: '354bfa97-24b3-4c22-9f8b-8ce779132525',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uploadId: { type: 'string', format: 'misskey:id' },
		parts: {
			type: 'array',
			minItems: 1,
			maxItems: 1000,
			items: {
				type: 'object',
				properties: {
					partNumber: { type: 'integer', minimum: 1 },
					etag: { type: 'string', minLength: 1 },
				},
				required: ['partNumber', 'etag'],
			},
		},
	},
	required: ['uploadId', 'parts'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private directUploadService: DirectUploadService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.directUploadService.complete(me, ps.uploadId, ps.parts);
			} catch (err) {
				if (err instanceof DirectUploadError) {
					if (err.code === 'NO_SUCH_UPLOAD') throw new ApiError(meta.errors.noSuchUpload);
					if (err.code === 'INVALID_STATE') throw new ApiError(meta.errors.invalidState);
					if (err.code === 'SIZE_MISMATCH') throw new ApiError(meta.errors.sizeMismatch);
					if (err.code === 'FAILED') throw new ApiError(meta.errors.uploadFailed);
				}
				throw err;
			}
		});
	}
}
