/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { ModerationLogsRepository } from '@/models/_.ts';
import { awaitAll } from '@/misc/prelude/await-all.ts';
import type { } from '@/models/Blocking.ts';
import type { MiModerationLog } from '@/models/ModerationLog.ts';
import { bindThis } from '@/decorators.ts';
import { IdService } from '@/core/IdService.ts';
import { UserEntityService } from './UserEntityService.ts';

@Injectable()
export class ModerationLogEntityService {
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiModerationLog['id'] | MiModerationLog,
	) {
		const log = typeof src === 'object' ? src : await this.moderationLogsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: log.id,
			createdAt: this.idService.parse(log.id).date.toISOString(),
			type: log.type,
			info: log.info,
			userId: log.userId,
			user: this.userEntityService.pack(log.user ?? log.userId, null, {
				detail: true,
			}),
		});
	}

	@bindThis
	public packMany(
		reports: any[],
	) {
		return Promise.all(reports.map(x => this.pack(x)));
	}
}

