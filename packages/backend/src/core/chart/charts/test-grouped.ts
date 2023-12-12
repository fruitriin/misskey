/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppLockService } from '@/core/AppLockService.ts';
import { DI } from '@/di-symbols.ts';
import Logger from '@/logger.ts';
import { bindThis } from '@/decorators.ts';
import Chart from '../core.ts';
import { name, schema } from './entities/test-grouped.ts';
import type { KVs } from '../core.ts';

/**
 * For testing
 */
@Injectable()
export default class TestGroupedChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	private total = {} as Record<string, number>;

	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		logger: Logger,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		return {
			'foo.total': this.total[group],
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async increment(group: string): Promise<void> {
		if (this.total[group] == null) this.total[group] = 0;

		this.total[group]++;

		await this.commit({
			'foo.total': 1,
			'foo.inc': 1,
		}, group);
	}
}
