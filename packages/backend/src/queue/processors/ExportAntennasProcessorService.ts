/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { format as DateFormat } from 'date-fns';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.ts';
import type { AntennasRepository, UsersRepository, UserListMembershipsRepository, MiUser } from '@/models/_.ts';
import Logger from '@/logger.ts';
import { DriveService } from '@/core/DriveService.ts';
import { bindThis } from '@/decorators.ts';
import { createTemp } from '@/misc/create-temp.ts';
import { UtilityService } from '@/core/UtilityService.ts';
import { QueueLoggerService } from '../QueueLoggerService.ts';
import type { DBExportAntennasData } from '../types.ts';
import type * as Bull from 'bullmq';

@Injectable()
export class ExportAntennasProcessorService {
	private logger: Logger;

	constructor (
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.antennasRepository)
		private antennsRepository: AntennasRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private driveService: DriveService,
		private utilityService: UtilityService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-antennas');
	}

	@bindThis
	public async process(job: Bull.Job<DBExportAntennasData>): Promise<void> {
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}
		const [path, cleanup] = await createTemp();
		const stream = fs.createWriteStream(path, { flags: 'a' });
		const write = (input: string): Promise<void> => {
			return new Promise((resolve, reject) => {
				stream.write(input, err => {
					if (err) {
						this.logger.error(err);
						reject();
					} else {
						resolve();
					}
				});
			});
		};
		try {
			const antennas = await this.antennsRepository.findBy({ userId: job.data.user.id });
			write('[');
			for (const [index, antenna] of antennas.entries()) {
				let users: MiUser[] | undefined;
				if (antenna.userListId !== null) {
					const memberships = await this.userListMembershipsRepository.findBy({ userListId: antenna.userListId });
					users = await this.usersRepository.findBy({
						id: In(memberships.map(j => j.userId)),
					});
				}
				write(JSON.stringify({
					name: antenna.name,
					src: antenna.src,
					keywords: antenna.keywords,
					excludeKeywords: antenna.excludeKeywords,
					users: antenna.users,
					userListAccts: typeof users !== 'undefined' ? users.map((u) => {
						return this.utilityService.getFullApAccount(u.username, u.host); // acct
					}) : null,
					caseSensitive: antenna.caseSensitive,
					localOnly: antenna.localOnly,
					withReplies: antenna.withReplies,
					withFile: antenna.withFile,
					notify: antenna.notify,
				}));
				if (antennas.length - 1 !== index) {
					write(', ');
				}
			}
			write(']');
			stream.end();

			const fileName = 'antennas-' + DateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.json';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'json' });
			this.logger.succ('Exported to: ' + driveFile.id);
		} finally {
			cleanup();
		}
	}
}

