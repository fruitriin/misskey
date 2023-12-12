/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { ClipFavoritesRepository, ClipsRepository, MiUser } from '@/models/_.ts';
import { awaitAll } from '@/misc/prelude/await-all.ts';
import type { Packed } from '@/misc/json-schema.ts';
import type { } from '@/models/Blocking.ts';
import type { MiClip } from '@/models/Clip.ts';
import { bindThis } from '@/decorators.ts';
import { IdService } from '@/core/IdService.ts';
import { UserEntityService } from './UserEntityService.ts';

@Injectable()
export class ClipEntityService {
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipFavoritesRepository)
		private clipFavoritesRepository: ClipFavoritesRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiClip['id'] | MiClip,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'Clip'>> {
		const meId = me ? me.id : null;
		const clip = typeof src === 'object' ? src : await this.clipsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: clip.id,
			createdAt: this.idService.parse(clip.id).date.toISOString(),
			lastClippedAt: clip.lastClippedAt ? clip.lastClippedAt.toISOString() : null,
			userId: clip.userId,
			user: this.userEntityService.pack(clip.user ?? clip.userId),
			name: clip.name,
			description: clip.description,
			isPublic: clip.isPublic,
			favoritedCount: await this.clipFavoritesRepository.countBy({ clipId: clip.id }),
			isFavorited: meId ? await this.clipFavoritesRepository.exist({ where: { clipId: clip.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public packMany(
		clips: MiClip[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		return Promise.all(clips.map(x => this.pack(x, me)));
	}
}

