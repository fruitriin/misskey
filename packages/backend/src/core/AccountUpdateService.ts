/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { UsersRepository } from '@/models/_.ts';
import type { MiUser } from '@/models/User.ts';
import { ApRendererService } from '@/core/activitypub/ApRendererService.ts';
import { RelayService } from '@/core/RelayService.ts';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.ts';
import { UserEntityService } from '@/core/entities/UserEntityService.ts';
import { bindThis } from '@/decorators.ts';

@Injectable()
export class AccountUpdateService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private relayService: RelayService,
	) {
	}

	@bindThis
	public async publishToFollowers(userId: MiUser['id']) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null) throw new Error('user not found');

		// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUpdate(await this.apRendererService.renderPerson(user), user));
			this.apDeliverManagerService.deliverToFollowers(user, content);
			this.relayService.deliverToRelays(user, content);
		}
	}
}
