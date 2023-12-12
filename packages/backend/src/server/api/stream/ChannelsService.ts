/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.ts';
import { HybridTimelineChannelService } from './channels/hybrid-timeline.ts';
import { LocalTimelineChannelService } from './channels/local-timeline.ts';
import { HomeTimelineChannelService } from './channels/home-timeline.ts';
import { GlobalTimelineChannelService } from './channels/global-timeline.ts';
import { MainChannelService } from './channels/main.ts';
import { ChannelChannelService } from './channels/channel.ts';
import { AdminChannelService } from './channels/admin.ts';
import { ServerStatsChannelService } from './channels/server-stats.ts';
import { QueueStatsChannelService } from './channels/queue-stats.ts';
import { UserListChannelService } from './channels/user-list.ts';
import { AntennaChannelService } from './channels/antenna.ts';
import { DriveChannelService } from './channels/drive.ts';
import { HashtagChannelService } from './channels/hashtag.ts';
import { RoleTimelineChannelService } from './channels/role-timeline.ts';

@Injectable()
export class ChannelsService {
	constructor(
		private mainChannelService: MainChannelService,
		private homeTimelineChannelService: HomeTimelineChannelService,
		private localTimelineChannelService: LocalTimelineChannelService,
		private hybridTimelineChannelService: HybridTimelineChannelService,
		private globalTimelineChannelService: GlobalTimelineChannelService,
		private userListChannelService: UserListChannelService,
		private hashtagChannelService: HashtagChannelService,
		private roleTimelineChannelService: RoleTimelineChannelService,
		private antennaChannelService: AntennaChannelService,
		private channelChannelService: ChannelChannelService,
		private driveChannelService: DriveChannelService,
		private serverStatsChannelService: ServerStatsChannelService,
		private queueStatsChannelService: QueueStatsChannelService,
		private adminChannelService: AdminChannelService,
	) {
	}

	@bindThis
	public getChannelService(name: string) {
		switch (name) {
			case 'main': return this.mainChannelService;
			case 'homeTimeline': return this.homeTimelineChannelService;
			case 'localTimeline': return this.localTimelineChannelService;
			case 'hybridTimeline': return this.hybridTimelineChannelService;
			case 'globalTimeline': return this.globalTimelineChannelService;
			case 'userList': return this.userListChannelService;
			case 'hashtag': return this.hashtagChannelService;
			case 'roleTimeline': return this.roleTimelineChannelService;
			case 'antenna': return this.antennaChannelService;
			case 'channel': return this.channelChannelService;
			case 'drive': return this.driveChannelService;
			case 'serverStats': return this.serverStatsChannelService;
			case 'queueStats': return this.queueStatsChannelService;
			case 'admin': return this.adminChannelService;

			default:
				throw new Error(`no such channel: ${name}`);
		}
	}
}
