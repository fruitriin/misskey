/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.ts';
import type { InstancesRepository } from '@/models/_.ts';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.ts';
import { UtilityService } from '@/core/UtilityService.ts';
import { DI } from '@/di-symbols.ts';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: true,
		ref: 'FederationInstance',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
	},
	required: ['host'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private instanceEntityService: InstanceEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.instancesRepository
				.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			return instance ? await this.instanceEntityService.pack(instance) : null;
		});
	}
}
