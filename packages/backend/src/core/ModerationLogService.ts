/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { ModerationLogsRepository } from '@/models/_.ts';
import type { MiUser } from '@/models/User.ts';
import { IdService } from '@/core/IdService.ts';
import { bindThis } from '@/decorators.ts';
import { ModerationLogPayloads, moderationLogTypes } from '@/types.ts';

@Injectable()
export class ModerationLogService {
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private idService: IdService,
	) {
	}

	@bindThis
	public async log<T extends typeof moderationLogTypes[number]>(moderator: { id: MiUser['id'] }, type: T, info?: ModerationLogPayloads[T]) {
		await this.moderationLogsRepository.insert({
			id: this.idService.gen(),
			userId: moderator.id,
			type: type,
			info: (info as any) ?? {},
		});
	}
}
