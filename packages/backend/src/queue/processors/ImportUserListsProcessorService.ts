/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.ts';
import type { UsersRepository, DriveFilesRepository, UserListMembershipsRepository, UserListsRepository } from '@/models/_.ts';
import type Logger from '@/logger.ts';
import * as Acct from '@/misc/acct.ts';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.ts';
import { DownloadService } from '@/core/DownloadService.ts';
import { UserListService } from '@/core/UserListService.ts';
import { IdService } from '@/core/IdService.ts';
import { UtilityService } from '@/core/UtilityService.ts';
import { bindThis } from '@/decorators.ts';
import { QueueLoggerService } from '../QueueLoggerService.ts';
import type * as Bull from 'bullmq';
import type { DbUserImportJobData } from '../types.ts';

@Injectable()
export class ImportUserListsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private utilityService: UtilityService,
		private idService: IdService,
		private userListService: UserListService,
		private remoteUserResolveService: RemoteUserResolveService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-user-lists');
	}

	@bindThis
	public async process(job: Bull.Job<DbUserImportJobData>): Promise<void> {
		this.logger.info(`Importing user lists of ${job.data.user.id} ...`);

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

		let linenum = 0;

		for (const line of csv.trim().split('\n')) {
			linenum++;

			try {
				const listName = line.split(',')[0].trim();
				const { username, host } = Acct.parse(line.split(',')[1].trim());

				let list = await this.userListsRepository.findOneBy({
					userId: user.id,
					name: listName,
				});

				if (list == null) {
					list = await this.userListsRepository.insert({
						id: this.idService.gen(),
						userId: user.id,
						name: listName,
					}).then(x => this.userListsRepository.findOneByOrFail(x.identifiers[0]));
				}

				let target = this.utilityService.isSelfHost(host!) ? await this.usersRepository.findOneBy({
					host: IsNull(),
					usernameLower: username.toLowerCase(),
				}) : await this.usersRepository.findOneBy({
					host: this.utilityService.toPuny(host!),
					usernameLower: username.toLowerCase(),
				});

				if (target == null) {
					target = await this.remoteUserResolveService.resolveUser(username, host);
				}

				if (await this.userListMembershipsRepository.findOneBy({ userListId: list!.id, userId: target.id }) != null) continue;

				this.userListService.addMember(target, list!, user);
			} catch (e) {
				this.logger.warn(`Error in line:${linenum} ${e}`);
			}
		}

		this.logger.succ('Imported');
	}
}
