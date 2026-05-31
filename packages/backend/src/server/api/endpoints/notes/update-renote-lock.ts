/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'a6e9e7bc-bce4-4e1e-b0c8-12fac4e5bde1',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '1d3e9f1a-3c4d-4e5f-a6b7-8c9d0e1f2a3b',
		},

		cannotSetAdminLock: {
			message: 'Only moderators can set admin lock.',
			code: 'CANNOT_SET_ADMIN_LOCK',
			id: '2e4f6a8c-0b2d-4e6f-8a0c-2e4f6a8c0b2d',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		lock: { type: 'string', enum: ['none', 'self', 'admin'] },
		renoteWindowDuration: { type: 'integer', minimum: 0, maximum: 10080, nullable: true },
	},
	required: ['noteId', 'lock'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private getterService: GetterService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			const isModerator = await this.roleService.isModerator(me);

			if (!isModerator && note.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			if (ps.lock === 'admin' && !isModerator) {
				throw new ApiError(meta.errors.cannotSetAdminLock);
			}

			await this.notesRepository.update(note.id, {
				renoteLock: ps.lock as 'none' | 'self' | 'admin',
				renoteWindowDuration: ps.lock === 'self' ? (ps.renoteWindowDuration ?? null) : null,
			});
		});
	}
}
