/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { DriveFilesRepository } from '@/models/_.ts';
import type { MiDriveFile } from '@/models/DriveFile.ts';
import { AppLockService } from '@/core/AppLockService.ts';
import { DI } from '@/di-symbols.ts';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.ts';
import { bindThis } from '@/decorators.ts';
import Chart from '../core.ts';
import { ChartLoggerService } from '../ChartLoggerService.ts';
import { name, schema } from './entities/per-user-drive.ts';
import type { KVs } from '../core.ts';

/**
 * ユーザーごとのドライブに関するチャート
 */
@Injectable()
export default class PerUserDriveChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private appLockService: AppLockService,
		private driveFileEntityService: DriveFileEntityService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [count, size] = await Promise.all([
			this.driveFilesRepository.countBy({ userId: group }),
			this.driveFileEntityService.calcDriveUsageOf(group),
		]);

		return {
			'totalCount': count,
			'totalSize': size,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async update(file: MiDriveFile, isAdditional: boolean): Promise<void> {
		const fileSizeKb = file.size / 1000;
		await this.commit({
			'totalCount': isAdditional ? 1 : -1,
			'totalSize': isAdditional ? fileSizeKb : -fileSizeKb,
			'incCount': isAdditional ? 1 : 0,
			'incSize': isAdditional ? fileSizeKb : 0,
			'decCount': isAdditional ? 0 : 1,
			'decSize': isAdditional ? 0 : fileSizeKb,
		}, file.userId);
	}
}
