/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Misskey Entry Point!
 */
import cluster from 'node:cluster';
import { EventEmitter } from 'node:events';
import chalk from 'chalk';
import Xev from 'xev';
import Logger from '@/logger.ts';


import { envOption } from '../env.ts';
import { masterMain } from './master.ts';
import { workerMain } from './worker.ts';

import 'reflect-metadata';


Error.stackTraceLimit = Infinity;
EventEmitter.defaultMaxListeners = 128;

const logger = new Logger('core', 'cyan');
const clusterLogger = logger.createSubLogger('cluster', 'orange', false);
const ev = new Xev();

//#region Events

// Listen new workers
cluster.on('fork', worker => {
	clusterLogger.debug(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLogger.debug(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLogger.error(chalk.red(`[${worker.id}] died :(`));
	cluster.fork();
});

// Display detail of unhandled promise rejection
if (!envOption.quiet) {
	process.on('unhandledRejection', console.dir);
}

// Display detail of uncaught exception
process.on('uncaughtException', err => {
	try {
		logger.error(err);
		console.trace(err);
	} catch { }
});

// Dying away...
process.on('exit', code => {
	logger.info(`The process is going to exit with code ${code}`);
});

//#endregion

if (cluster.isPrimary || envOption.disableClustering) {
	await masterMain();

	if (cluster.isPrimary) {
		ev.mount();
	}
}

if (cluster.isWorker || envOption.disableClustering) {
	await workerMain();
}

// ユニットテスト時にMisskeyが子プロセスで起動された時のため
// それ以外のときは process.send は使えないので弾く
if (process.send) {
	process.send('ok');
}




