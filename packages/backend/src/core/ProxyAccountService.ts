/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.ts';
import type { MiLocalUser } from '@/models/User.ts';
import { DI } from '@/di-symbols.ts';
import { MetaService } from '@/core/MetaService.ts';
import { bindThis } from '@/decorators.ts';

@Injectable()
export class ProxyAccountService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private metaService: MetaService,
	) {
	}

	@bindThis
	public async fetch(): Promise<MiLocalUser | null> {
		const meta = await this.metaService.fetch();
		if (meta.proxyAccountId == null) return null;
		return await this.usersRepository.findOneByOrFail({ id: meta.proxyAccountId }) as MiLocalUser;
	}
}
