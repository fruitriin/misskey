/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { EndpointsModule } from '@/server/api/EndpointsModule.ts';
import { CoreModule } from '@/core/CoreModule.ts';
import { ApiCallService } from './api/ApiCallService.ts';
import { FileServerService } from './FileServerService.ts';
import { NodeinfoServerService } from './NodeinfoServerService.ts';
import { ServerService } from './ServerService.ts';
import { WellKnownServerService } from './WellKnownServerService.ts';
import { GetterService } from './api/GetterService.ts';
import { ChannelsService } from './api/stream/ChannelsService.ts';
import { ActivityPubServerService } from './ActivityPubServerService.ts';
import { ApiLoggerService } from './api/ApiLoggerService.ts';
import { ApiServerService } from './api/ApiServerService.ts';
import { AuthenticateService } from './api/AuthenticateService.ts';
import { RateLimiterService } from './api/RateLimiterService.ts';
import { SigninApiService } from './api/SigninApiService.ts';
import { SigninService } from './api/SigninService.ts';
import { SignupApiService } from './api/SignupApiService.ts';
import { StreamingApiServerService } from './api/StreamingApiServerService.ts';
import { ClientServerService } from './web/ClientServerService.ts';
import { FeedService } from './web/FeedService.ts';
import { UrlPreviewService } from './web/UrlPreviewService.ts';
import { MainChannelService } from './api/stream/channels/main.ts';
import { AdminChannelService } from './api/stream/channels/admin.ts';
import { AntennaChannelService } from './api/stream/channels/antenna.ts';
import { ChannelChannelService } from './api/stream/channels/channel.ts';
import { DriveChannelService } from './api/stream/channels/drive.ts';
import { GlobalTimelineChannelService } from './api/stream/channels/global-timeline.ts';
import { HashtagChannelService } from './api/stream/channels/hashtag.ts';
import { HomeTimelineChannelService } from './api/stream/channels/home-timeline.ts';
import { HybridTimelineChannelService } from './api/stream/channels/hybrid-timeline.ts';
import { LocalTimelineChannelService } from './api/stream/channels/local-timeline.ts';
import { QueueStatsChannelService } from './api/stream/channels/queue-stats.ts';
import { ServerStatsChannelService } from './api/stream/channels/server-stats.ts';
import { UserListChannelService } from './api/stream/channels/user-list.ts';
import { OpenApiServerService } from './api/openapi/OpenApiServerService.ts';
import { ClientLoggerService } from './web/ClientLoggerService.ts';
import { RoleTimelineChannelService } from './api/stream/channels/role-timeline.ts';
import { OAuth2ProviderService } from './oauth/OAuth2ProviderService.ts';

@Module({
	imports: [
		EndpointsModule,
		CoreModule,
	],
	providers: [
		ClientServerService,
		ClientLoggerService,
		FeedService,
		UrlPreviewService,
		ActivityPubServerService,
		FileServerService,
		NodeinfoServerService,
		ServerService,
		WellKnownServerService,
		GetterService,
		ChannelsService,
		ApiCallService,
		ApiLoggerService,
		ApiServerService,
		AuthenticateService,
		RateLimiterService,
		SigninApiService,
		SigninService,
		SignupApiService,
		StreamingApiServerService,
		MainChannelService,
		AdminChannelService,
		AntennaChannelService,
		ChannelChannelService,
		DriveChannelService,
		GlobalTimelineChannelService,
		HashtagChannelService,
		RoleTimelineChannelService,
		HomeTimelineChannelService,
		HybridTimelineChannelService,
		LocalTimelineChannelService,
		QueueStatsChannelService,
		ServerStatsChannelService,
		UserListChannelService,
		OpenApiServerService,
		OAuth2ProviderService,
	],
	exports: [
		ServerService,
	],
})
export class ServerModule {}
