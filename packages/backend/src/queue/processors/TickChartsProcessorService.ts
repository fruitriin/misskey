/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.ts';
import FederationChart from '@/core/chart/charts/federation.ts';
import NotesChart from '@/core/chart/charts/notes.ts';
import UsersChart from '@/core/chart/charts/users.ts';
import ActiveUsersChart from '@/core/chart/charts/active-users.ts';
import InstanceChart from '@/core/chart/charts/instance.ts';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.ts';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.ts';
import DriveChart from '@/core/chart/charts/drive.ts';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.ts';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.ts';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.ts';
import ApRequestChart from '@/core/chart/charts/ap-request.ts';
import { bindThis } from '@/decorators.ts';
import { QueueLoggerService } from '../QueueLoggerService.ts';
import type * as Bull from 'bullmq';

@Injectable()
export class TickChartsProcessorService {
	private logger: Logger;

	constructor(
		private federationChart: FederationChart,
		private notesChart: NotesChart,
		private usersChart: UsersChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
		private perUserNotesChart: PerUserNotesChart,
		private perUserPvChart: PerUserPvChart,
		private driveChart: DriveChart,
		private perUserReactionsChart: PerUserReactionsChart,
		private perUserFollowingChart: PerUserFollowingChart,
		private perUserDriveChart: PerUserDriveChart,
		private apRequestChart: ApRequestChart,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('tick-charts');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Tick charts...');

		await Promise.all([
			this.federationChart.tick(false),
			this.notesChart.tick(false),
			this.usersChart.tick(false),
			this.activeUsersChart.tick(false),
			this.instanceChart.tick(false),
			this.perUserNotesChart.tick(false),
			this.perUserPvChart.tick(false),
			this.driveChart.tick(false),
			this.perUserReactionsChart.tick(false),
			this.perUserFollowingChart.tick(false),
			this.perUserDriveChart.tick(false),
			this.apRequestChart.tick(false),
		]);

		this.logger.succ('All charts successfully ticked.');
	}
}
