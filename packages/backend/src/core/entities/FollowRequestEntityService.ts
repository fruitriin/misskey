/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { FollowRequestsRepository } from '@/models/_.ts';
import type { } from '@/models/Blocking.ts';
import type { MiUser } from '@/models/User.ts';
import type { MiFollowRequest } from '@/models/FollowRequest.ts';
import { bindThis } from '@/decorators.ts';
import { UserEntityService } from './UserEntityService.ts';

@Injectable()
export class FollowRequestEntityService {
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiFollowRequest['id'] | MiFollowRequest,
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const request = typeof src === 'object' ? src : await this.followRequestsRepository.findOneByOrFail({ id: src });

		return {
			id: request.id,
			follower: await this.userEntityService.pack(request.followerId, me),
			followee: await this.userEntityService.pack(request.followeeId, me),
		};
	}
}

