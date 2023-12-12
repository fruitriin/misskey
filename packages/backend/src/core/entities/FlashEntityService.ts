/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { FlashsRepository, FlashLikesRepository } from '@/models/_.ts';
import { awaitAll } from '@/misc/prelude/await-all.ts';
import type { Packed } from '@/misc/json-schema.ts';
import type { } from '@/models/Blocking.ts';
import type { MiUser } from '@/models/User.ts';
import type { MiFlash } from '@/models/Flash.ts';
import { bindThis } from '@/decorators.ts';
import { IdService } from '@/core/IdService.ts';
import { UserEntityService } from './UserEntityService.ts';

@Injectable()
export class FlashEntityService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiFlash['id'] | MiFlash,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'Flash'>> {
		const meId = me ? me.id : null;
		const flash = typeof src === 'object' ? src : await this.flashsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: flash.id,
			createdAt: this.idService.parse(flash.id).date.toISOString(),
			updatedAt: flash.updatedAt.toISOString(),
			userId: flash.userId,
			user: this.userEntityService.pack(flash.user ?? flash.userId, me), // { detail: true } すると無限ループするので注意
			title: flash.title,
			summary: flash.summary,
			script: flash.script,
			likedCount: flash.likedCount,
			isLiked: meId ? await this.flashLikesRepository.exist({ where: { flashId: flash.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public packMany(
		flashs: MiFlash[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		return Promise.all(flashs.map(x => this.pack(x, me)));
	}
}

