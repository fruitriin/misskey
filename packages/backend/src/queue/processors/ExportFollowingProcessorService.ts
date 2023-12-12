/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { In, MoreThan, Not } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI } from '@/di-symbols.ts';
import type { UsersRepository, FollowingsRepository, MutingsRepository } from '@/models/_.ts';
import type Logger from '@/logger.ts';
import { DriveService } from '@/core/DriveService.ts';
import { createTemp } from '@/misc/create-temp.ts';
import type { MiFollowing } from '@/models/Following.ts';
import { UtilityService } from '@/core/UtilityService.ts';
import { bindThis } from '@/decorators.ts';
import { QueueLoggerService } from '../QueueLoggerService.ts';
import type * as Bull from 'bullmq';
import type { DbExportFollowingData } from '../types.ts';

@Injectable()
export class ExportFollowingProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private utilityService: UtilityService,
		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-following');
	}

	@bindThis
	public async process(job: Bull.Job<DbExportFollowingData>): Promise<void> {
		this.logger.info(`Exporting following of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.logger.info(`Temp file is ${path}`);

		try {
			const stream = fs.createWriteStream(path, { flags: 'a' });

			let cursor: MiFollowing['id'] | null = null;

			const mutings = job.data.excludeMuting ? await this.mutingsRepository.findBy({
				muterId: user.id,
			}) : [];

			while (true) {
				const followings = await this.followingsRepository.find({
					where: {
						followerId: user.id,
						...(mutings.length > 0 ? { followeeId: Not(In(mutings.map(x => x.muteeId))) } : {}),
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 100,
					order: {
						id: 1,
					},
				}) as MiFollowing[];

				if (followings.length === 0) {
					break;
				}

				cursor = followings.at(-1)?.id ?? null;

				for (const following of followings) {
					const u = await this.usersRepository.findOneBy({ id: following.followeeId });
					if (u == null) {
						continue;
					}

					if (job.data.excludeInactive && u.updatedAt && (Date.now() - u.updatedAt.getTime() > 1000 * 60 * 60 * 24 * 90)) {
						continue;
					}

					const content = this.utilityService.getFullApAccount(u.username, u.host);
					await new Promise<void>((res, rej) => {
						stream.write(content + '\n', err => {
							if (err) {
								this.logger.error(err);
								rej(err);
							} else {
								res();
							}
						});
					});
				}
			}

			stream.end();
			this.logger.succ(`Exported to: ${path}`);

			const fileName = 'following-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'csv' });

			this.logger.succ(`Exported to: ${driveFile.id}`);
		} finally {
			cleanup();
		}
	}
}
