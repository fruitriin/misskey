/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.ts';
import type { UsersRepository, DriveFilesRepository } from '@/models/_.ts';
import type Logger from '@/logger.ts';
import * as Acct from '@/misc/acct.ts';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.ts';
import { DownloadService } from '@/core/DownloadService.ts';
import { UtilityService } from '@/core/UtilityService.ts';
import { bindThis } from '@/decorators.ts';
import { QueueService } from '@/core/QueueService.ts';
import { QueueLoggerService } from '../QueueLoggerService.ts';
import type * as Bull from 'bullmq';
import type { DbUserImportJobData, DbUserImportToDbJobData } from '../types.ts';

@Injectable()
export class ImportFollowingProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private queueService: QueueService,
		private utilityService: UtilityService,
		private remoteUserResolveService: RemoteUserResolveService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-following');
	}

	@bindThis
	public async process(job: Bull.Job<DbUserImportJobData>): Promise<void> {
		this.logger.info(`Importing following of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
			return;
		}

		const csv = await this.downloadService.downloadTextFile(file.url);
		const targets = csv.trim().split('\n');
		this.queueService.createImportFollowingToDbJob({ id: user.id }, targets, job.data.withReplies);

		this.logger.succ('Import jobs created');
	}

	@bindThis
	public async processDb(job: Bull.Job<DbUserImportToDbJobData>): Promise<void> {
		const line = job.data.target;
		const user = job.data.user;

		try {
			const acct = line.split(',')[0].trim();
			const { username, host } = Acct.parse(acct);

			if (!host) return;

			let target = this.utilityService.isSelfHost(host) ? await this.usersRepository.findOneBy({
				host: IsNull(),
				usernameLower: username.toLowerCase(),
			}) : await this.usersRepository.findOneBy({
				host: this.utilityService.toPuny(host),
				usernameLower: username.toLowerCase(),
			});

			if (host == null && target == null) return;

			if (target == null) {
				target = await this.remoteUserResolveService.resolveUser(username, host);
			}

			if (target == null) {
				throw new Error(`Unable to resolve user: @${username}@${host}`);
			}

			// skip myself
			if (target.id === job.data.user.id) return;

			this.logger.info(`Follow ${target.id} ${job.data.withReplies ? 'with replies' : 'without replies'} ...`);

			this.queueService.createFollowJob([{ from: user, to: { id: target.id }, silent: true, withReplies: job.data.withReplies }]);
		} catch (e) {
			this.logger.warn(`Error: ${e}`);
		}
	}
}
