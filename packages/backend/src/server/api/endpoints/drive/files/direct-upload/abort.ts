/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DirectUploadError, DirectUploadService } from '@/core/DirectUploadService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	description: 'Abort a direct upload.',

	errors: {
		noSuchUpload: {
			message: 'No such upload.',
			code: 'NO_SUCH_UPLOAD',
			id: '4f0133c2-467e-4ef1-80db-99e473a47d5c',
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
		private directUploadService: DirectUploadService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.directUploadService.abort(me, ps.uploadId);
			} catch (err) {
				if (err instanceof DirectUploadError && err.code === 'NO_SUCH_UPLOAD') throw new ApiError(meta.errors.noSuchUpload);
				throw err;
			}
		});
	}
}
