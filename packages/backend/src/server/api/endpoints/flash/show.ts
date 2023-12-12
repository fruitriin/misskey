/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@/models/_.ts';
import { Endpoint } from '@/server/api/endpoint-base.ts';
import { FlashEntityService } from '@/core/entities/FlashEntityService.ts';
import { DI } from '@/di-symbols.ts';
import { ApiError } from '../../error.ts';

export const meta = {
	tags: ['flashs'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Flash',
	},

	errors: {
		noSuchFlash: {
			message: 'No such flash.',
			code: 'NO_SUCH_FLASH',
			id: 'f0d34a1a-d29a-401d-90ba-1982122b5630',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		flashId: { type: 'string', format: 'misskey:id' },
	},
	required: ['flashId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });

			if (flash == null) {
				throw new ApiError(meta.errors.noSuchFlash);
			}

			return await this.flashEntityService.pack(flash, me);
		});
	}
}
