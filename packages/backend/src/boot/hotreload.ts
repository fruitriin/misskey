import * as chokidar from 'chokidar';
import { INestApplication, Logger } from '@nestjs/common';
import * as path from 'path';
import { masterMain } from "./master.js";


console.log(import.meta.url)

const SRC_PATH = path.resolve(import.meta.url);

class HMR {
	private app: INestApplication;
	private logger = new Logger('HMR');

	constructor() {
		chokidar.watch(`${SRC_PATH}/**/*.ts`).on('change', (path) => {
			this.logger.log(`Detected changes in file: ${path}`);
			this.reload();
		});

		// naive error handling - source maps should work
		process.on('unhandledRejection', (reason) => this.logger.error(reason));
	}

	async reload() {
		this.logger.log('Starting HMR cycle');

		await this.executeAndLogWithDuration('Finished HMR cycle', async () => {
			// delete all require caches for SRC_PATH
			// // TODO: check how to handle node_modules
			// for (const key in require.cache)
			// 	if (key.includes(SRC_PATH)) delete require.cache[key];
			//
			// // get fresh instance of main
			// const { bootstrap } = await import(MAIN_PATH);
			// // close server if running
			// if (this.app) {
			// 	await this.executeAndLogWithDuration('Closed server', this.app.close);
			// }

			// reinitialize server
		});
		await this.executeAndLogWithDuration(
			'Started Server',
			async () => await masterMain().catch((err: any) => console.log(err))
		);
	}

	async executeAndLogWithDuration(msg: string, cb: () => Promise<any>) {
		const start = performance.now();
		await cb();

		const duration = Number(performance.now() - start).toFixed(0);
		this.logger.log(`${msg} +${duration}ms`);
	}
}

const hmr = new HMR();
await hmr.reload();
