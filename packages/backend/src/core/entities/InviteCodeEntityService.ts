/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { RegistrationTicketsRepository } from '@/models/_.ts';
import { awaitAll } from '@/misc/prelude/await-all.ts';
import type { Packed } from '@/misc/json-schema.ts';
import type { MiUser } from '@/models/User.ts';
import type { MiRegistrationTicket } from '@/models/RegistrationTicket.ts';
import { bindThis } from '@/decorators.ts';
import { IdService } from '@/core/IdService.ts';
import { UserEntityService } from './UserEntityService.ts';

@Injectable()
export class InviteCodeEntityService {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiRegistrationTicket['id'] | MiRegistrationTicket,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'InviteCode'>> {
		const target = typeof src === 'object' ? src : await this.registrationTicketsRepository.findOneOrFail({
			where: {
				id: src,
			},
			relations: ['createdBy', 'usedBy'],
		});

		return await awaitAll({
			id: target.id,
			code: target.code,
			expiresAt: target.expiresAt ? target.expiresAt.toISOString() : null,
			createdAt: this.idService.parse(target.id).date.toISOString(),
			createdBy: target.createdBy ? await this.userEntityService.pack(target.createdBy, me) : null,
			usedBy: target.usedBy ? await this.userEntityService.pack(target.usedBy, me) : null,
			usedAt: target.usedAt ? target.usedAt.toISOString() : null,
			used: !!target.usedAt,
		});
	}

	@bindThis
	public packMany(
		targets: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(targets.map(x => this.pack(x, me)));
	}
}
