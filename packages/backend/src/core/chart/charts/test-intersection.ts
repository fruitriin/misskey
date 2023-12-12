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
import { name, schema } from './entities/test-intersection.ts';
import type { KVs } from '../core.ts';

/**
 * For testing
 */
@Injectable()
export default class TestIntersectionChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		logger: Logger,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async addA(key: string): Promise<void> {
		await this.commit({
			a: [key],
		});
	}

	@bindThis
	public async addB(key: string): Promise<void> {
		await this.commit({
			b: [key],
		});
	}
}
