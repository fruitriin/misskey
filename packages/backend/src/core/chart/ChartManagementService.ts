/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { bindThis } from '@/decorators.ts';
import FederationChart from './charts/federation.ts';
import NotesChart from './charts/notes.ts';
import UsersChart from './charts/users.ts';
import ActiveUsersChart from './charts/active-users.ts';
import InstanceChart from './charts/instance.ts';
import PerUserNotesChart from './charts/per-user-notes.ts';
import PerUserPvChart from './charts/per-user-pv.ts';
import DriveChart from './charts/drive.ts';
import PerUserReactionsChart from './charts/per-user-reactions.ts';
import PerUserFollowingChart from './charts/per-user-following.ts';
import PerUserDriveChart from './charts/per-user-drive.ts';
import ApRequestChart from './charts/ap-request.ts';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class ChartManagementService implements OnApplicationShutdown {
	private charts;
	private saveIntervalId: NodeJS.Timeout;

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
	) {
		this.charts = [
			this.federationChart,
			this.notesChart,
			this.usersChart,
			this.activeUsersChart,
			this.instanceChart,
			this.perUserNotesChart,
			this.perUserPvChart,
			this.driveChart,
			this.perUserReactionsChart,
			this.perUserFollowingChart,
			this.perUserDriveChart,
			this.apRequestChart,
		];
	}

	@bindThis
	public async start() {
		// 20分おきにメモリ情報をDBに書き込み
		this.saveIntervalId = setInterval(() => {
			for (const chart of this.charts) {
				chart.save();
			}
		}, 1000 * 60 * 20);
	}

	@bindThis
	public async dispose(): Promise<void> {
		clearInterval(this.saveIntervalId);
		if (process.env.NODE_ENV !== 'test') {
			await Promise.all(
				this.charts.map(chart => chart.save()),
			);
		}
	}

	@bindThis
	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
