/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NestFactory } from '@nestjs/core';
import { ChartManagementService } from '@/core/chart/ChartManagementService.ts';
import { QueueProcessorService } from '@/queue/QueueProcessorService.ts';
import { NestLogger } from '@/NestLogger.ts';
import { QueueProcessorModule } from '@/queue/QueueProcessorModule.ts';
import { QueueStatsService } from '@/daemons/QueueStatsService.ts';
import { ServerStatsService } from '@/daemons/ServerStatsService.ts';
import { ServerService } from '@/server/ServerService.ts';
import { MainModule } from '@/MainModule.ts';

export async function server() {
	const app = await NestFactory.createApplicationContext(MainModule, {
		logger: new NestLogger(),
	});

	const serverService = app.get(ServerService);
	await serverService.launch();

	if (process.env.NODE_ENV !== 'test') {
		app.get(ChartManagementService).start();
		app.get(QueueStatsService).start();
		app.get(ServerStatsService).start();
	}

	return app;
}

export async function jobQueue() {
	const jobQueue = await NestFactory.createApplicationContext(QueueProcessorModule, {
		logger: new NestLogger(),
	});

	jobQueue.get(QueueProcessorService).start();
	jobQueue.get(ChartManagementService).start();

	return jobQueue;
}
