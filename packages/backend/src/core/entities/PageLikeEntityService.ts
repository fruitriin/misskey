/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { PageLikesRepository } from '@/models/_.ts';
import type { } from '@/models/Blocking.ts';
import type { MiUser } from '@/models/User.ts';
import type { MiPageLike } from '@/models/PageLike.ts';
import { bindThis } from '@/decorators.ts';
import { PageEntityService } from './PageEntityService.ts';

@Injectable()
export class PageLikeEntityService {
	constructor(
		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		private pageEntityService: PageEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiPageLike['id'] | MiPageLike,
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const like = typeof src === 'object' ? src : await this.pageLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			page: await this.pageEntityService.pack(like.page ?? like.pageId, me),
		};
	}

	@bindThis
	public packMany(
		likes: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}

