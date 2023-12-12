/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
import { MiUserListMembership } from '@/models/UserListMembership.ts';
import { MiUserNotePining } from '@/models/UserNotePining.ts';
import { MiUserPending } from '@/models/UserPending.ts';
import { MiUserProfile } from '@/models/UserProfile.ts';
import { MiUserPublickey } from '@/models/UserPublickey.ts';
import { MiUserSecurityKey } from '@/models/UserSecurityKey.ts';
import { MiUserMemo } from '@/models/UserMemo.ts';
import { MiWebhook } from '@/models/Webhook.ts';
import { MiChannel } from '@/models/Channel.ts';
import { MiRetentionAggregation } from '@/models/RetentionAggregation.ts';
import { MiRole } from '@/models/Role.ts';
import { MiRoleAssignment } from '@/models/RoleAssignment.ts';
import { MiFlash } from '@/models/Flash.ts';
import { MiFlashLike } from '@/models/FlashLike.ts';
import { MiUserListFavorite } from '@/models/UserListFavorite.ts';
import type { Repository } from 'typeorm';

export {
	MiAbuseUserReport,
	MiAccessToken,
	MiAd,
	MiAnnouncement,
	MiAnnouncementRead,
	MiAntenna,
	MiApp,
	MiAvatarDecoration,
	MiAuthSession,
	MiBlocking,
	MiChannelFollowing,
	MiChannelFavorite,
	MiClip,
	MiClipNote,
	MiClipFavorite,
	MiDriveFile,
	MiDriveFolder,
	MiEmoji,
	MiFollowing,
	MiFollowRequest,
	MiGalleryLike,
	MiGalleryPost,
	MiHashtag,
	MiInstance,
	MiMeta,
	MiModerationLog,
	MiMuting,
	MiRenoteMuting,
	MiNote,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiNoteUnread,
	MiPage,
	MiPageLike,
	MiPasswordResetRequest,
	MiPoll,
	MiPollVote,
	MiPromoNote,
	MiPromoRead,
	MiRegistrationTicket,
	MiRegistryItem,
	MiRelay,
	MiSignin,
	MiSwSubscription,
	MiUsedUsername,
	MiUser,
	MiUserIp,
	MiUserKeypair,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserNotePining,
	MiUserPending,
	MiUserProfile,
	MiUserPublickey,
	MiUserSecurityKey,
	MiWebhook,
	MiChannel,
	MiRetentionAggregation,
	MiRole,
	MiRoleAssignment,
	MiFlash,
	MiFlashLike,
	MiUserMemo,
};

export type AbuseUserReportsRepository = Repository<MiAbuseUserReport>;
export type AccessTokensRepository = Repository<MiAccessToken>;
export type AdsRepository = Repository<MiAd>;
export type AnnouncementsRepository = Repository<MiAnnouncement>;
export type AnnouncementReadsRepository = Repository<MiAnnouncementRead>;
export type AntennasRepository = Repository<MiAntenna>;
export type AppsRepository = Repository<MiApp>;
export type AvatarDecorationsRepository = Repository<MiAvatarDecoration>;
export type AuthSessionsRepository = Repository<MiAuthSession>;
export type BlockingsRepository = Repository<MiBlocking>;
export type ChannelFollowingsRepository = Repository<MiChannelFollowing>;
export type ChannelFavoritesRepository = Repository<MiChannelFavorite>;
export type ClipsRepository = Repository<MiClip>;
export type ClipNotesRepository = Repository<MiClipNote>;
export type ClipFavoritesRepository = Repository<MiClipFavorite>;
export type DriveFilesRepository = Repository<MiDriveFile>;
export type DriveFoldersRepository = Repository<MiDriveFolder>;
export type EmojisRepository = Repository<MiEmoji>;
export type FollowingsRepository = Repository<MiFollowing>;
export type FollowRequestsRepository = Repository<MiFollowRequest>;
export type GalleryLikesRepository = Repository<MiGalleryLike>;
export type GalleryPostsRepository = Repository<MiGalleryPost>;
export type HashtagsRepository = Repository<MiHashtag>;
export type InstancesRepository = Repository<MiInstance>;
export type MetasRepository = Repository<MiMeta>;
export type ModerationLogsRepository = Repository<MiModerationLog>;
export type MutingsRepository = Repository<MiMuting>;
export type RenoteMutingsRepository = Repository<MiRenoteMuting>;
export type NotesRepository = Repository<MiNote>;
export type NoteFavoritesRepository = Repository<MiNoteFavorite>;
export type NoteReactionsRepository = Repository<MiNoteReaction>;
export type NoteThreadMutingsRepository = Repository<MiNoteThreadMuting>;
export type NoteUnreadsRepository = Repository<MiNoteUnread>;
export type PagesRepository = Repository<MiPage>;
export type PageLikesRepository = Repository<MiPageLike>;
export type PasswordResetRequestsRepository = Repository<MiPasswordResetRequest>;
export type PollsRepository = Repository<MiPoll>;
export type PollVotesRepository = Repository<MiPollVote>;
export type PromoNotesRepository = Repository<MiPromoNote>;
export type PromoReadsRepository = Repository<MiPromoRead>;
export type RegistrationTicketsRepository = Repository<MiRegistrationTicket>;
export type RegistryItemsRepository = Repository<MiRegistryItem>;
export type RelaysRepository = Repository<MiRelay>;
export type SigninsRepository = Repository<MiSignin>;
export type SwSubscriptionsRepository = Repository<MiSwSubscription>;
export type UsedUsernamesRepository = Repository<MiUsedUsername>;
export type UsersRepository = Repository<MiUser>;
export type UserIpsRepository = Repository<MiUserIp>;
export type UserKeypairsRepository = Repository<MiUserKeypair>;
export type UserListsRepository = Repository<MiUserList>;
export type UserListFavoritesRepository = Repository<MiUserListFavorite>;
export type UserListMembershipsRepository = Repository<MiUserListMembership>;
export type UserNotePiningsRepository = Repository<MiUserNotePining>;
export type UserPendingsRepository = Repository<MiUserPending>;
export type UserProfilesRepository = Repository<MiUserProfile>;
export type UserPublickeysRepository = Repository<MiUserPublickey>;
export type UserSecurityKeysRepository = Repository<MiUserSecurityKey>;
export type WebhooksRepository = Repository<MiWebhook>;
export type ChannelsRepository = Repository<MiChannel>;
export type RetentionAggregationsRepository = Repository<MiRetentionAggregation>;
export type RolesRepository = Repository<MiRole>;
export type RoleAssignmentsRepository = Repository<MiRoleAssignment>;
export type FlashsRepository = Repository<MiFlash>;
export type FlashLikesRepository = Repository<MiFlashLike>;
export type UserMemoRepository = Repository<MiUserMemo>;
