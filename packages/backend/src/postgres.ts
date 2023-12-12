/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://github.com/typeorm/typeorm/issues/2400
import pg from 'pg';
pg.types.setTypeParser(20, Number);

import { DataSource, Logger } from 'typeorm';
import * as highlight from 'cli-highlight';
import { entities as charts } from '@/core/chart/entities.ts';

import { MiAbuseUserReport } from '@/models/AbuseUserReport.ts';
import { MiAccessToken } from '@/models/AccessToken.ts';
import { MiAd } from '@/models/Ad.ts';
import { MiAnnouncement } from '@/models/Announcement.ts';
import { MiAnnouncementRead } from '@/models/AnnouncementRead.ts';
import { MiAntenna } from '@/models/Antenna.ts';
import { MiApp } from '@/models/App.ts';
import { MiAvatarDecoration } from '@/models/AvatarDecoration.ts';
import { MiAuthSession } from '@/models/AuthSession.ts';
import { MiBlocking } from '@/models/Blocking.ts';
import { MiChannelFollowing } from '@/models/ChannelFollowing.ts';
import { MiChannelFavorite } from '@/models/ChannelFavorite.ts';
import { MiClip } from '@/models/Clip.ts';
import { MiClipNote } from '@/models/ClipNote.ts';
import { MiClipFavorite } from '@/models/ClipFavorite.ts';
import { MiDriveFile } from '@/models/DriveFile.ts';
import { MiDriveFolder } from '@/models/DriveFolder.ts';
import { MiEmoji } from '@/models/Emoji.ts';
import { MiFollowing } from '@/models/Following.ts';
import { MiFollowRequest } from '@/models/FollowRequest.ts';
import { MiGalleryLike } from '@/models/GalleryLike.ts';
import { MiGalleryPost } from '@/models/GalleryPost.ts';
import { MiHashtag } from '@/models/Hashtag.ts';
import { MiInstance } from '@/models/Instance.ts';
import { MiMeta } from '@/models/Meta.ts';
import { MiModerationLog } from '@/models/ModerationLog.ts';
import { MiMuting } from '@/models/Muting.ts';
import { MiRenoteMuting } from '@/models/RenoteMuting.ts';
import { MiNote } from '@/models/Note.ts';
import { MiNoteFavorite } from '@/models/NoteFavorite.ts';
import { MiNoteReaction } from '@/models/NoteReaction.ts';
import { MiNoteThreadMuting } from '@/models/NoteThreadMuting.ts';
import { MiNoteUnread } from '@/models/NoteUnread.ts';
import { MiPage } from '@/models/Page.ts';
import { MiPageLike } from '@/models/PageLike.ts';
import { MiPasswordResetRequest } from '@/models/PasswordResetRequest.ts';
import { MiPoll } from '@/models/Poll.ts';
import { MiPollVote } from '@/models/PollVote.ts';
import { MiPromoNote } from '@/models/PromoNote.ts';
import { MiPromoRead } from '@/models/PromoRead.ts';
import { MiRegistrationTicket } from '@/models/RegistrationTicket.ts';
import { MiRegistryItem } from '@/models/RegistryItem.ts';
import { MiRelay } from '@/models/Relay.ts';
import { MiSignin } from '@/models/Signin.ts';
import { MiSwSubscription } from '@/models/SwSubscription.ts';
import { MiUsedUsername } from '@/models/UsedUsername.ts';
import { MiUser } from '@/models/User.ts';
import { MiUserIp } from '@/models/UserIp.ts';
import { MiUserKeypair } from '@/models/UserKeypair.ts';
import { MiUserList } from '@/models/UserList.ts';
import { MiUserListFavorite } from '@/models/UserListFavorite.ts';
import { MiUserListMembership } from '@/models/UserListMembership.ts';
import { MiUserNotePining } from '@/models/UserNotePining.ts';
import { MiUserPending } from '@/models/UserPending.ts';
import { MiUserProfile } from '@/models/UserProfile.ts';
import { MiUserPublickey } from '@/models/UserPublickey.ts';
import { MiUserSecurityKey } from '@/models/UserSecurityKey.ts';
import { MiWebhook } from '@/models/Webhook.ts';
import { MiChannel } from '@/models/Channel.ts';
import { MiRetentionAggregation } from '@/models/RetentionAggregation.ts';
import { MiRole } from '@/models/Role.ts';
import { MiRoleAssignment } from '@/models/RoleAssignment.ts';
import { MiFlash } from '@/models/Flash.ts';
import { MiFlashLike } from '@/models/FlashLike.ts';
import { MiUserMemo } from '@/models/UserMemo.ts';

import { Config } from '@/config.ts';
import MisskeyLogger from '@/logger.ts';
import { bindThis } from '@/decorators.ts';

export const dbLogger = new MisskeyLogger('db');

const sqlLogger = dbLogger.createSubLogger('sql', 'gray', false);

class MyCustomLogger implements Logger {
	@bindThis
	private highlight(sql: string) {
		return highlight.highlight(sql, {
			language: 'sql', ignoreIllegals: true,
		});
	}

	@bindThis
	public logQuery(query: string, parameters?: any[]) {
		sqlLogger.info(this.highlight(query).substring(0, 100));
	}

	@bindThis
	public logQueryError(error: string, query: string, parameters?: any[]) {
		sqlLogger.error(this.highlight(query));
	}

	@bindThis
	public logQuerySlow(time: number, query: string, parameters?: any[]) {
		sqlLogger.warn(this.highlight(query));
	}

	@bindThis
	public logSchemaBuild(message: string) {
		sqlLogger.info(message);
	}

	@bindThis
	public log(message: string) {
		sqlLogger.info(message);
	}

	@bindThis
	public logMigration(message: string) {
		sqlLogger.info(message);
	}
}

export const entities = [
	MiAnnouncement,
	MiAnnouncementRead,
	MiMeta,
	MiInstance,
	MiApp,
	MiAvatarDecoration,
	MiAuthSession,
	MiAccessToken,
	MiUser,
	MiUserProfile,
	MiUserKeypair,
	MiUserPublickey,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserNotePining,
	MiUserSecurityKey,
	MiUsedUsername,
	MiFollowing,
	MiFollowRequest,
	MiMuting,
	MiRenoteMuting,
	MiBlocking,
	MiNote,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiNoteUnread,
	MiPage,
	MiPageLike,
	MiGalleryPost,
	MiGalleryLike,
	MiDriveFile,
	MiDriveFolder,
	MiPoll,
	MiPollVote,
	MiEmoji,
	MiHashtag,
	MiSwSubscription,
	MiAbuseUserReport,
	MiRegistrationTicket,
	MiSignin,
	MiModerationLog,
	MiClip,
	MiClipNote,
	MiClipFavorite,
	MiAntenna,
	MiPromoNote,
	MiPromoRead,
	MiRelay,
	MiChannel,
	MiChannelFollowing,
	MiChannelFavorite,
	MiRegistryItem,
	MiAd,
	MiPasswordResetRequest,
	MiUserPending,
	MiWebhook,
	MiUserIp,
	MiRetentionAggregation,
	MiRole,
	MiRoleAssignment,
	MiFlash,
	MiFlashLike,
	MiUserMemo,
	...charts,
];

const log = process.env.NODE_ENV !== 'production';

export function createPostgresDataSource(config: Config) {
	return new DataSource({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		extra: {
			statement_timeout: 1000 * 10,
			...config.db.extra,
		},
		replication: config.dbReplications ? {
			master: {
				host: config.db.host,
				port: config.db.port,
				username: config.db.user,
				password: config.db.pass,
				database: config.db.db,
			},
			slaves: config.dbSlaves!.map(rep => ({
				host: rep.host,
				port: rep.port,
				username: rep.user,
				password: rep.pass,
				database: rep.db,
			})),
		} : undefined,
		synchronize: process.env.NODE_ENV === 'test',
		dropSchema: process.env.NODE_ENV === 'test',
		cache: !config.db.disableCache && process.env.NODE_ENV !== 'test' ? { // dbをcloseしても何故かredisのコネクションが内部的に残り続けるようで、テストの際に支障が出るため無効にする(キャッシュも含めてテストしたいため本当は有効にしたいが...)
			type: 'ioredis',
			options: {
				host: config.redis.host,
				port: config.redis.port,
				family: config.redis.family ?? 0,
				password: config.redis.pass,
				keyPrefix: `${config.redis.prefix}:query:`,
				db: config.redis.db ?? 0,
			},
		} : false,
		logging: log,
		logger: log ? new MyCustomLogger() : undefined,
		maxQueryExecutionTime: 300,
		entities: entities,
		migrations: ['../../migration/*.ts'],
	});
}
