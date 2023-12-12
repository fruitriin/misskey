/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { RenoteMutingsRepository } from '@/models/_.ts';
import { awaitAll } from '@/misc/prelude/await-all.ts';
import type { Packed } from '@/misc/json-schema.ts';
import type { } from '@/models/Blocking.ts';
import type { MiUser } from '@/models/User.ts';
import type { MiRenoteMuting } from '@/models/RenoteMuting.ts';
import { bindThis } from '@/decorators.ts';
import { IdService } from '@/core/IdService.ts';
import { UserEntityService } from './UserEntityService.ts';

@Injectable()
export class RenoteMutingEntityService {
	constructor(
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiRenoteMuting['id'] | MiRenoteMuting,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'RenoteMuting'>> {
		const muting = typeof src === 'object' ? src : await this.renoteMutingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: muting.id,
			createdAt: this.idService.parse(muting.id).date.toISOString(),
			muteeId: muting.muteeId,
			mutee: this.userEntityService.pack(muting.muteeId, me, {
				detail: true,
			}),
		});
	}

	@bindThis
	public packMany(
		mutings: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(mutings.map(x => this.pack(x, me)));
	}
}

