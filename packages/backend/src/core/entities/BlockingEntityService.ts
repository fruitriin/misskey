/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { BlockingsRepository } from '@/models/_.ts';
import { awaitAll } from '@/misc/prelude/await-all.ts';
import type { Packed } from '@/misc/json-schema.ts';
import type { MiBlocking } from '@/models/Blocking.ts';
import type { MiUser } from '@/models/User.ts';
import { bindThis } from '@/decorators.ts';
import { IdService } from '@/core/IdService.ts';
import { UserEntityService } from './UserEntityService.ts';

@Injectable()
export class BlockingEntityService {
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiBlocking['id'] | MiBlocking,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'Blocking'>> {
		const blocking = typeof src === 'object' ? src : await this.blockingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: blocking.id,
			createdAt: this.idService.parse(blocking.id).date.toISOString(),
			blockeeId: blocking.blockeeId,
			blockee: this.userEntityService.pack(blocking.blockeeId, me, {
				detail: true,
			}),
		});
	}

	@bindThis
	public packMany(
		blockings: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(blockings.map(x => this.pack(x, me)));
	}
}
