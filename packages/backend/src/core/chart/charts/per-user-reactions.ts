/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { MiUser } from '@/models/User.ts';
import type { MiNote } from '@/models/Note.ts';
import { AppLockService } from '@/core/AppLockService.ts';
import { DI } from '@/di-symbols.ts';
import { UserEntityService } from '@/core/entities/UserEntityService.ts';
import { bindThis } from '@/decorators.ts';
import Chart from '../core.ts';
import { ChartLoggerService } from '../ChartLoggerService.ts';
import { name, schema } from './entities/per-user-reactions.ts';
import type { KVs } from '../core.ts';

/**
 * ユーザーごとのリアクションに関するチャート
 */
@Injectable()
export default class PerUserReactionsChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		private userEntityService: UserEntityService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async update(user: { id: MiUser['id'], host: MiUser['host'] }, note: MiNote): Promise<void> {
		const prefix = this.userEntityService.isLocalUser(user) ? 'local' : 'remote';
		this.commit({
			[`${prefix}.count`]: 1,
		}, note.userId);
	}
}
