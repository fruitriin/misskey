/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/CoreModule.ts';
import { GlobalModule } from '@/GlobalModule.ts';
import { QueueStatsService } from './QueueStatsService.ts';
import { ServerStatsService } from './ServerStatsService.ts';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
	],
	providers: [
		QueueStatsService,
		ServerStatsService,
	],
	exports: [
		QueueStatsService,
		ServerStatsService,
	],
})
export class DaemonModule {}
