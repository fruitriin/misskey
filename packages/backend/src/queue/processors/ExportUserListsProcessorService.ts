/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI } from '@/di-symbols.ts';
import type { UserListMembershipsRepository, UserListsRepository, UsersRepository } from '@/models/_.ts';
import type Logger from '@/logger.ts';
import { DriveService } from '@/core/DriveService.ts';
import { createTemp } from '@/misc/create-temp.ts';
import { UtilityService } from '@/core/UtilityService.ts';
import { bindThis } from '@/decorators.ts';
import { QueueLoggerService } from '../QueueLoggerService.ts';
import type * as Bull from 'bullmq';
import type { DbJobDataWithUser } from '../types.ts';

@Injectable()
export class ExportUserListsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private utilityService: UtilityService,
		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-user-lists');
	}

	@bindThis
	public async process(job: Bull.Job<DbJobDataWithUser>): Promise<void> {
		this.logger.info(`Exporting user lists of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		const lists = await this.userListsRepository.findBy({
			userId: user.id,
		});

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.logger.info(`Temp file is ${path}`);

		try {
			const stream = fs.createWriteStream(path, { flags: 'a' });

			for (const list of lists) {
				const memberships = await this.userListMembershipsRepository.findBy({ userListId: list.id });
				const users = await this.usersRepository.findBy({
					id: In(memberships.map(j => j.userId)),
				});

				for (const u of users) {
					const acct = this.utilityService.getFullApAccount(u.username, u.host);
					const content = `${list.name},${acct}`;
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

			const fileName = 'user-lists-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'csv' });

			this.logger.succ(`Exported to: ${driveFile.id}`);
		} finally {
			cleanup();
		}
	}
}
