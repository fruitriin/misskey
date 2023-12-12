/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Schema } from '@/misc/json-schema.ts';
import { RolePolicies } from '@/core/RoleService.ts';

import * as ep___admin_meta from './endpoints/admin/meta.ts';
import * as ep___admin_abuseUserReports from './endpoints/admin/abuse-user-reports.ts';
import * as ep___admin_accounts_create from './endpoints/admin/accounts/create.ts';
import * as ep___admin_accounts_delete from './endpoints/admin/accounts/delete.ts';
import * as ep___admin_accounts_findByEmail from './endpoints/admin/accounts/find-by-email.ts';
import * as ep___admin_ad_create from './endpoints/admin/ad/create.ts';
import * as ep___admin_ad_delete from './endpoints/admin/ad/delete.ts';
import * as ep___admin_ad_list from './endpoints/admin/ad/list.ts';
import * as ep___admin_ad_update from './endpoints/admin/ad/update.ts';
import * as ep___admin_announcements_create from './endpoints/admin/announcements/create.ts';
import * as ep___admin_announcements_delete from './endpoints/admin/announcements/delete.ts';
import * as ep___admin_announcements_list from './endpoints/admin/announcements/list.ts';
import * as ep___admin_announcements_update from './endpoints/admin/announcements/update.ts';
import * as ep___admin_avatarDecorations_create from './endpoints/admin/avatar-decorations/create.ts';
import * as ep___admin_avatarDecorations_delete from './endpoints/admin/avatar-decorations/delete.ts';
import * as ep___admin_avatarDecorations_list from './endpoints/admin/avatar-decorations/list.ts';
import * as ep___admin_avatarDecorations_update from './endpoints/admin/avatar-decorations/update.ts';
import * as ep___admin_deleteAllFilesOfAUser from './endpoints/admin/delete-all-files-of-a-user.ts';
import * as ep___admin_unsetUserAvatar from './endpoints/admin/unset-user-avatar.ts';
import * as ep___admin_unsetUserBanner from './endpoints/admin/unset-user-banner.ts';
import * as ep___admin_drive_cleanRemoteFiles from './endpoints/admin/drive/clean-remote-files.ts';
import * as ep___admin_drive_cleanup from './endpoints/admin/drive/cleanup.ts';
import * as ep___admin_drive_files from './endpoints/admin/drive/files.ts';
import * as ep___admin_drive_showFile from './endpoints/admin/drive/show-file.ts';
import * as ep___admin_emoji_addAliasesBulk from './endpoints/admin/emoji/add-aliases-bulk.ts';
import * as ep___admin_emoji_add from './endpoints/admin/emoji/add.ts';
import * as ep___admin_emoji_copy from './endpoints/admin/emoji/copy.ts';
import * as ep___admin_emoji_deleteBulk from './endpoints/admin/emoji/delete-bulk.ts';
import * as ep___admin_emoji_delete from './endpoints/admin/emoji/delete.ts';
import * as ep___admin_emoji_importZip from './endpoints/admin/emoji/import-zip.ts';
import * as ep___admin_emoji_listRemote from './endpoints/admin/emoji/list-remote.ts';
import * as ep___admin_emoji_list from './endpoints/admin/emoji/list.ts';
import * as ep___admin_emoji_removeAliasesBulk from './endpoints/admin/emoji/remove-aliases-bulk.ts';
import * as ep___admin_emoji_setAliasesBulk from './endpoints/admin/emoji/set-aliases-bulk.ts';
import * as ep___admin_emoji_setCategoryBulk from './endpoints/admin/emoji/set-category-bulk.ts';
import * as ep___admin_emoji_setLicenseBulk from './endpoints/admin/emoji/set-license-bulk.ts';
import * as ep___admin_emoji_update from './endpoints/admin/emoji/update.ts';
import * as ep___admin_federation_deleteAllFiles from './endpoints/admin/federation/delete-all-files.ts';
import * as ep___admin_federation_refreshRemoteInstanceMetadata from './endpoints/admin/federation/refresh-remote-instance-metadata.ts';
import * as ep___admin_federation_removeAllFollowing from './endpoints/admin/federation/remove-all-following.ts';
import * as ep___admin_federation_updateInstance from './endpoints/admin/federation/update-instance.ts';
import * as ep___admin_getIndexStats from './endpoints/admin/get-index-stats.ts';
import * as ep___admin_getTableStats from './endpoints/admin/get-table-stats.ts';
import * as ep___admin_getUserIps from './endpoints/admin/get-user-ips.ts';
import * as ep___admin_invite_create from './endpoints/admin/invite/create.ts';
import * as ep___admin_invite_list from './endpoints/admin/invite/list.ts';
import * as ep___admin_promo_create from './endpoints/admin/promo/create.ts';
import * as ep___admin_queue_clear from './endpoints/admin/queue/clear.ts';
import * as ep___admin_queue_deliverDelayed from './endpoints/admin/queue/deliver-delayed.ts';
import * as ep___admin_queue_inboxDelayed from './endpoints/admin/queue/inbox-delayed.ts';
import * as ep___admin_queue_promote from './endpoints/admin/queue/promote.ts';
import * as ep___admin_queue_stats from './endpoints/admin/queue/stats.ts';
import * as ep___admin_relays_add from './endpoints/admin/relays/add.ts';
import * as ep___admin_relays_list from './endpoints/admin/relays/list.ts';
import * as ep___admin_relays_remove from './endpoints/admin/relays/remove.ts';
import * as ep___admin_resetPassword from './endpoints/admin/reset-password.ts';
import * as ep___admin_resolveAbuseUserReport from './endpoints/admin/resolve-abuse-user-report.ts';
import * as ep___admin_sendEmail from './endpoints/admin/send-email.ts';
import * as ep___admin_serverInfo from './endpoints/admin/server-info.ts';
import * as ep___admin_showModerationLogs from './endpoints/admin/show-moderation-logs.ts';
import * as ep___admin_showUser from './endpoints/admin/show-user.ts';
import * as ep___admin_showUsers from './endpoints/admin/show-users.ts';
import * as ep___admin_suspendUser from './endpoints/admin/suspend-user.ts';
import * as ep___admin_unsuspendUser from './endpoints/admin/unsuspend-user.ts';
import * as ep___admin_updateMeta from './endpoints/admin/update-meta.ts';
import * as ep___admin_deleteAccount from './endpoints/admin/delete-account.ts';
import * as ep___admin_updateUserNote from './endpoints/admin/update-user-note.ts';
import * as ep___admin_roles_create from './endpoints/admin/roles/create.ts';
import * as ep___admin_roles_delete from './endpoints/admin/roles/delete.ts';
import * as ep___admin_roles_list from './endpoints/admin/roles/list.ts';
import * as ep___admin_roles_show from './endpoints/admin/roles/show.ts';
import * as ep___admin_roles_update from './endpoints/admin/roles/update.ts';
import * as ep___admin_roles_assign from './endpoints/admin/roles/assign.ts';
import * as ep___admin_roles_unassign from './endpoints/admin/roles/unassign.ts';
import * as ep___admin_roles_updateDefaultPolicies from './endpoints/admin/roles/update-default-policies.ts';
import * as ep___admin_roles_users from './endpoints/admin/roles/users.ts';
import * as ep___announcements from './endpoints/announcements.ts';
import * as ep___antennas_create from './endpoints/antennas/create.ts';
import * as ep___antennas_delete from './endpoints/antennas/delete.ts';
import * as ep___antennas_list from './endpoints/antennas/list.ts';
import * as ep___antennas_notes from './endpoints/antennas/notes.ts';
import * as ep___antennas_show from './endpoints/antennas/show.ts';
import * as ep___antennas_update from './endpoints/antennas/update.ts';
import * as ep___ap_get from './endpoints/ap/get.ts';
import * as ep___ap_show from './endpoints/ap/show.ts';
import * as ep___app_create from './endpoints/app/create.ts';
import * as ep___app_show from './endpoints/app/show.ts';
import * as ep___auth_accept from './endpoints/auth/accept.ts';
import * as ep___auth_session_generate from './endpoints/auth/session/generate.ts';
import * as ep___auth_session_show from './endpoints/auth/session/show.ts';
import * as ep___auth_session_userkey from './endpoints/auth/session/userkey.ts';
import * as ep___blocking_create from './endpoints/blocking/create.ts';
import * as ep___blocking_delete from './endpoints/blocking/delete.ts';
import * as ep___blocking_list from './endpoints/blocking/list.ts';
import * as ep___channels_create from './endpoints/channels/create.ts';
import * as ep___channels_featured from './endpoints/channels/featured.ts';
import * as ep___channels_follow from './endpoints/channels/follow.ts';
import * as ep___channels_followed from './endpoints/channels/followed.ts';
import * as ep___channels_owned from './endpoints/channels/owned.ts';
import * as ep___channels_show from './endpoints/channels/show.ts';
import * as ep___channels_timeline from './endpoints/channels/timeline.ts';
import * as ep___channels_unfollow from './endpoints/channels/unfollow.ts';
import * as ep___channels_update from './endpoints/channels/update.ts';
import * as ep___channels_favorite from './endpoints/channels/favorite.ts';
import * as ep___channels_unfavorite from './endpoints/channels/unfavorite.ts';
import * as ep___channels_myFavorites from './endpoints/channels/my-favorites.ts';
import * as ep___channels_search from './endpoints/channels/search.ts';
import * as ep___charts_activeUsers from './endpoints/charts/active-users.ts';
import * as ep___charts_apRequest from './endpoints/charts/ap-request.ts';
import * as ep___charts_drive from './endpoints/charts/drive.ts';
import * as ep___charts_federation from './endpoints/charts/federation.ts';
import * as ep___charts_instance from './endpoints/charts/instance.ts';
import * as ep___charts_notes from './endpoints/charts/notes.ts';
import * as ep___charts_user_drive from './endpoints/charts/user/drive.ts';
import * as ep___charts_user_following from './endpoints/charts/user/following.ts';
import * as ep___charts_user_notes from './endpoints/charts/user/notes.ts';
import * as ep___charts_user_pv from './endpoints/charts/user/pv.ts';
import * as ep___charts_user_reactions from './endpoints/charts/user/reactions.ts';
import * as ep___charts_users from './endpoints/charts/users.ts';
import * as ep___clips_addNote from './endpoints/clips/add-note.ts';
import * as ep___clips_removeNote from './endpoints/clips/remove-note.ts';
import * as ep___clips_create from './endpoints/clips/create.ts';
import * as ep___clips_delete from './endpoints/clips/delete.ts';
import * as ep___clips_list from './endpoints/clips/list.ts';
import * as ep___clips_notes from './endpoints/clips/notes.ts';
import * as ep___clips_show from './endpoints/clips/show.ts';
import * as ep___clips_update from './endpoints/clips/update.ts';
import * as ep___clips_favorite from './endpoints/clips/favorite.ts';
import * as ep___clips_unfavorite from './endpoints/clips/unfavorite.ts';
import * as ep___clips_myFavorites from './endpoints/clips/my-favorites.ts';
import * as ep___drive from './endpoints/drive.ts';
import * as ep___drive_files from './endpoints/drive/files.ts';
import * as ep___drive_files_attachedNotes from './endpoints/drive/files/attached-notes.ts';
import * as ep___drive_files_checkExistence from './endpoints/drive/files/check-existence.ts';
import * as ep___drive_files_create from './endpoints/drive/files/create.ts';
import * as ep___drive_files_delete from './endpoints/drive/files/delete.ts';
import * as ep___drive_files_findByHash from './endpoints/drive/files/find-by-hash.ts';
import * as ep___drive_files_find from './endpoints/drive/files/find.ts';
import * as ep___drive_files_show from './endpoints/drive/files/show.ts';
import * as ep___drive_files_update from './endpoints/drive/files/update.ts';
import * as ep___drive_files_uploadFromUrl from './endpoints/drive/files/upload-from-url.ts';
import * as ep___drive_folders from './endpoints/drive/folders.ts';
import * as ep___drive_folders_create from './endpoints/drive/folders/create.ts';
import * as ep___drive_folders_delete from './endpoints/drive/folders/delete.ts';
import * as ep___drive_folders_find from './endpoints/drive/folders/find.ts';
import * as ep___drive_folders_show from './endpoints/drive/folders/show.ts';
import * as ep___drive_folders_update from './endpoints/drive/folders/update.ts';
import * as ep___drive_stream from './endpoints/drive/stream.ts';
import * as ep___emailAddress_available from './endpoints/email-address/available.ts';
import * as ep___endpoint from './endpoints/endpoint.ts';
import * as ep___endpoints from './endpoints/endpoints.ts';
import * as ep___exportCustomEmojis from './endpoints/export-custom-emojis.ts';
import * as ep___federation_followers from './endpoints/federation/followers.ts';
import * as ep___federation_following from './endpoints/federation/following.ts';
import * as ep___federation_instances from './endpoints/federation/instances.ts';
import * as ep___federation_showInstance from './endpoints/federation/show-instance.ts';
import * as ep___federation_updateRemoteUser from './endpoints/federation/update-remote-user.ts';
import * as ep___federation_users from './endpoints/federation/users.ts';
import * as ep___federation_stats from './endpoints/federation/stats.ts';
import * as ep___following_create from './endpoints/following/create.ts';
import * as ep___following_delete from './endpoints/following/delete.ts';
import * as ep___following_update from './endpoints/following/update.ts';
import * as ep___following_update_all from './endpoints/following/update-all.ts';
import * as ep___following_invalidate from './endpoints/following/invalidate.ts';
import * as ep___following_requests_accept from './endpoints/following/requests/accept.ts';
import * as ep___following_requests_cancel from './endpoints/following/requests/cancel.ts';
import * as ep___following_requests_list from './endpoints/following/requests/list.ts';
import * as ep___following_requests_reject from './endpoints/following/requests/reject.ts';
import * as ep___gallery_featured from './endpoints/gallery/featured.ts';
import * as ep___gallery_popular from './endpoints/gallery/popular.ts';
import * as ep___gallery_posts from './endpoints/gallery/posts.ts';
import * as ep___gallery_posts_create from './endpoints/gallery/posts/create.ts';
import * as ep___gallery_posts_delete from './endpoints/gallery/posts/delete.ts';
import * as ep___gallery_posts_like from './endpoints/gallery/posts/like.ts';
import * as ep___gallery_posts_show from './endpoints/gallery/posts/show.ts';
import * as ep___gallery_posts_unlike from './endpoints/gallery/posts/unlike.ts';
import * as ep___gallery_posts_update from './endpoints/gallery/posts/update.ts';
import * as ep___getOnlineUsersCount from './endpoints/get-online-users-count.ts';
import * as ep___getAvatarDecorations from './endpoints/get-avatar-decorations.ts';
import * as ep___hashtags_list from './endpoints/hashtags/list.ts';
import * as ep___hashtags_search from './endpoints/hashtags/search.ts';
import * as ep___hashtags_show from './endpoints/hashtags/show.ts';
import * as ep___hashtags_trend from './endpoints/hashtags/trend.ts';
import * as ep___hashtags_users from './endpoints/hashtags/users.ts';
import * as ep___i from './endpoints/i.ts';
import * as ep___i_2fa_done from './endpoints/i/2fa/done.ts';
import * as ep___i_2fa_keyDone from './endpoints/i/2fa/key-done.ts';
import * as ep___i_2fa_passwordLess from './endpoints/i/2fa/password-less.ts';
import * as ep___i_2fa_registerKey from './endpoints/i/2fa/register-key.ts';
import * as ep___i_2fa_register from './endpoints/i/2fa/register.ts';
import * as ep___i_2fa_updateKey from './endpoints/i/2fa/update-key.ts';
import * as ep___i_2fa_removeKey from './endpoints/i/2fa/remove-key.ts';
import * as ep___i_2fa_unregister from './endpoints/i/2fa/unregister.ts';
import * as ep___i_apps from './endpoints/i/apps.ts';
import * as ep___i_authorizedApps from './endpoints/i/authorized-apps.ts';
import * as ep___i_claimAchievement from './endpoints/i/claim-achievement.ts';
import * as ep___i_changePassword from './endpoints/i/change-password.ts';
import * as ep___i_deleteAccount from './endpoints/i/delete-account.ts';
import * as ep___i_exportBlocking from './endpoints/i/export-blocking.ts';
import * as ep___i_exportFollowing from './endpoints/i/export-following.ts';
import * as ep___i_exportMute from './endpoints/i/export-mute.ts';
import * as ep___i_exportNotes from './endpoints/i/export-notes.ts';
import * as ep___i_exportFavorites from './endpoints/i/export-favorites.ts';
import * as ep___i_exportUserLists from './endpoints/i/export-user-lists.ts';
import * as ep___i_exportAntennas from './endpoints/i/export-antennas.ts';
import * as ep___i_favorites from './endpoints/i/favorites.ts';
import * as ep___i_gallery_likes from './endpoints/i/gallery/likes.ts';
import * as ep___i_gallery_posts from './endpoints/i/gallery/posts.ts';
import * as ep___i_importBlocking from './endpoints/i/import-blocking.ts';
import * as ep___i_importFollowing from './endpoints/i/import-following.ts';
import * as ep___i_importMuting from './endpoints/i/import-muting.ts';
import * as ep___i_importUserLists from './endpoints/i/import-user-lists.ts';
import * as ep___i_importAntennas from './endpoints/i/import-antennas.ts';
import * as ep___i_notifications from './endpoints/i/notifications.ts';
import * as ep___i_notificationsGrouped from './endpoints/i/notifications-grouped.ts';
import * as ep___i_pageLikes from './endpoints/i/page-likes.ts';
import * as ep___i_pages from './endpoints/i/pages.ts';
import * as ep___i_pin from './endpoints/i/pin.ts';
import * as ep___i_readAllUnreadNotes from './endpoints/i/read-all-unread-notes.ts';
import * as ep___i_readAnnouncement from './endpoints/i/read-announcement.ts';
import * as ep___i_regenerateToken from './endpoints/i/regenerate-token.ts';
import * as ep___i_registry_getAll from './endpoints/i/registry/get-all.ts';
import * as ep___i_registry_getDetail from './endpoints/i/registry/get-detail.ts';
import * as ep___i_registry_get from './endpoints/i/registry/get.ts';
import * as ep___i_registry_keysWithType from './endpoints/i/registry/keys-with-type.ts';
import * as ep___i_registry_keys from './endpoints/i/registry/keys.ts';
import * as ep___i_registry_remove from './endpoints/i/registry/remove.ts';
import * as ep___i_registry_scopesWithDomain from './endpoints/i/registry/scopes-with-domain.ts';
import * as ep___i_registry_set from './endpoints/i/registry/set.ts';
import * as ep___i_revokeToken from './endpoints/i/revoke-token.ts';
import * as ep___i_signinHistory from './endpoints/i/signin-history.ts';
import * as ep___i_unpin from './endpoints/i/unpin.ts';
import * as ep___i_updateEmail from './endpoints/i/update-email.ts';
import * as ep___i_update from './endpoints/i/update.ts';
import * as ep___i_move from './endpoints/i/move.ts';
import * as ep___i_webhooks_create from './endpoints/i/webhooks/create.ts';
import * as ep___i_webhooks_show from './endpoints/i/webhooks/show.ts';
import * as ep___i_webhooks_list from './endpoints/i/webhooks/list.ts';
import * as ep___i_webhooks_update from './endpoints/i/webhooks/update.ts';
import * as ep___i_webhooks_delete from './endpoints/i/webhooks/delete.ts';
import * as ep___invite_create from './endpoints/invite/create.ts';
import * as ep___invite_delete from './endpoints/invite/delete.ts';
import * as ep___invite_list from './endpoints/invite/list.ts';
import * as ep___invite_limit from './endpoints/invite/limit.ts';
import * as ep___meta from './endpoints/meta.ts';
import * as ep___emojis from './endpoints/emojis.ts';
import * as ep___emoji from './endpoints/emoji.ts';
import * as ep___miauth_genToken from './endpoints/miauth/gen-token.ts';
import * as ep___mute_create from './endpoints/mute/create.ts';
import * as ep___mute_delete from './endpoints/mute/delete.ts';
import * as ep___mute_list from './endpoints/mute/list.ts';
import * as ep___renoteMute_create from './endpoints/renote-mute/create.ts';
import * as ep___renoteMute_delete from './endpoints/renote-mute/delete.ts';
import * as ep___renoteMute_list from './endpoints/renote-mute/list.ts';
import * as ep___my_apps from './endpoints/my/apps.ts';
import * as ep___notes from './endpoints/notes.ts';
import * as ep___notes_children from './endpoints/notes/children.ts';
import * as ep___notes_clips from './endpoints/notes/clips.ts';
import * as ep___notes_conversation from './endpoints/notes/conversation.ts';
import * as ep___notes_create from './endpoints/notes/create.ts';
import * as ep___notes_delete from './endpoints/notes/delete.ts';
import * as ep___notes_favorites_create from './endpoints/notes/favorites/create.ts';
import * as ep___notes_favorites_delete from './endpoints/notes/favorites/delete.ts';
import * as ep___notes_featured from './endpoints/notes/featured.ts';
import * as ep___notes_globalTimeline from './endpoints/notes/global-timeline.ts';
import * as ep___notes_hybridTimeline from './endpoints/notes/hybrid-timeline.ts';
import * as ep___notes_localTimeline from './endpoints/notes/local-timeline.ts';
import * as ep___notes_mentions from './endpoints/notes/mentions.ts';
import * as ep___notes_polls_recommendation from './endpoints/notes/polls/recommendation.ts';
import * as ep___notes_polls_vote from './endpoints/notes/polls/vote.ts';
import * as ep___notes_reactions from './endpoints/notes/reactions.ts';
import * as ep___notes_reactions_create from './endpoints/notes/reactions/create.ts';
import * as ep___notes_reactions_delete from './endpoints/notes/reactions/delete.ts';
import * as ep___notes_renotes from './endpoints/notes/renotes.ts';
import * as ep___notes_replies from './endpoints/notes/replies.ts';
import * as ep___notes_searchByTag from './endpoints/notes/search-by-tag.ts';
import * as ep___notes_search from './endpoints/notes/search.ts';
import * as ep___notes_show from './endpoints/notes/show.ts';
import * as ep___notes_state from './endpoints/notes/state.ts';
import * as ep___notes_threadMuting_create from './endpoints/notes/thread-muting/create.ts';
import * as ep___notes_threadMuting_delete from './endpoints/notes/thread-muting/delete.ts';
import * as ep___notes_timeline from './endpoints/notes/timeline.ts';
import * as ep___notes_translate from './endpoints/notes/translate.ts';
import * as ep___notes_unrenote from './endpoints/notes/unrenote.ts';
import * as ep___notes_userListTimeline from './endpoints/notes/user-list-timeline.ts';
import * as ep___notifications_create from './endpoints/notifications/create.ts';
import * as ep___notifications_markAllAsRead from './endpoints/notifications/mark-all-as-read.ts';
import * as ep___notifications_testNotification from './endpoints/notifications/test-notification.ts';
import * as ep___pagePush from './endpoints/page-push.ts';
import * as ep___pages_create from './endpoints/pages/create.ts';
import * as ep___pages_delete from './endpoints/pages/delete.ts';
import * as ep___pages_featured from './endpoints/pages/featured.ts';
import * as ep___pages_like from './endpoints/pages/like.ts';
import * as ep___pages_show from './endpoints/pages/show.ts';
import * as ep___pages_unlike from './endpoints/pages/unlike.ts';
import * as ep___pages_update from './endpoints/pages/update.ts';
import * as ep___flash_create from './endpoints/flash/create.ts';
import * as ep___flash_delete from './endpoints/flash/delete.ts';
import * as ep___flash_featured from './endpoints/flash/featured.ts';
import * as ep___flash_like from './endpoints/flash/like.ts';
import * as ep___flash_show from './endpoints/flash/show.ts';
import * as ep___flash_unlike from './endpoints/flash/unlike.ts';
import * as ep___flash_update from './endpoints/flash/update.ts';
import * as ep___flash_my from './endpoints/flash/my.ts';
import * as ep___flash_myLikes from './endpoints/flash/my-likes.ts';
import * as ep___ping from './endpoints/ping.ts';
import * as ep___pinnedUsers from './endpoints/pinned-users.ts';
import * as ep___promo_read from './endpoints/promo/read.ts';
import * as ep___roles_list from './endpoints/roles/list.ts';
import * as ep___roles_show from './endpoints/roles/show.ts';
import * as ep___roles_users from './endpoints/roles/users.ts';
import * as ep___roles_notes from './endpoints/roles/notes.ts';
import * as ep___requestResetPassword from './endpoints/request-reset-password.ts';
import * as ep___resetDb from './endpoints/reset-db.ts';
import * as ep___resetPassword from './endpoints/reset-password.ts';
import * as ep___serverInfo from './endpoints/server-info.ts';
import * as ep___stats from './endpoints/stats.ts';
import * as ep___sw_show_registration from './endpoints/sw/show-registration.ts';
import * as ep___sw_update_registration from './endpoints/sw/update-registration.ts';
import * as ep___sw_register from './endpoints/sw/register.ts';
import * as ep___sw_unregister from './endpoints/sw/unregister.ts';
import * as ep___test from './endpoints/test.ts';
import * as ep___username_available from './endpoints/username/available.ts';
import * as ep___users from './endpoints/users.ts';
import * as ep___users_clips from './endpoints/users/clips.ts';
import * as ep___users_followers from './endpoints/users/followers.ts';
import * as ep___users_following from './endpoints/users/following.ts';
import * as ep___users_gallery_posts from './endpoints/users/gallery/posts.ts';
import * as ep___users_getFrequentlyRepliedUsers from './endpoints/users/get-frequently-replied-users.ts';
import * as ep___users_featuredNotes from './endpoints/users/featured-notes.ts';
import * as ep___users_lists_create from './endpoints/users/lists/create.ts';
import * as ep___users_lists_delete from './endpoints/users/lists/delete.ts';
import * as ep___users_lists_list from './endpoints/users/lists/list.ts';
import * as ep___users_lists_pull from './endpoints/users/lists/pull.ts';
import * as ep___users_lists_push from './endpoints/users/lists/push.ts';
import * as ep___users_lists_show from './endpoints/users/lists/show.ts';
import * as ep___users_lists_favorite from './endpoints/users/lists/favorite.ts';
import * as ep___users_lists_unfavorite from './endpoints/users/lists/unfavorite.ts';
import * as ep___users_lists_createFromPublic from './endpoints/users/lists/create-from-public.ts';
import * as ep___users_lists_update from './endpoints/users/lists/update.ts';
import * as ep___users_lists_updateMembership from './endpoints/users/lists/update-membership.ts';
import * as ep___users_lists_getMemberships from './endpoints/users/lists/get-memberships.ts';
import * as ep___users_notes from './endpoints/users/notes.ts';
import * as ep___users_pages from './endpoints/users/pages.ts';
import * as ep___users_flashs from './endpoints/users/flashs.ts';
import * as ep___users_reactions from './endpoints/users/reactions.ts';
import * as ep___users_recommendation from './endpoints/users/recommendation.ts';
import * as ep___users_relation from './endpoints/users/relation.ts';
import * as ep___users_reportAbuse from './endpoints/users/report-abuse.ts';
import * as ep___users_searchByUsernameAndHost from './endpoints/users/search-by-username-and-host.ts';
import * as ep___users_search from './endpoints/users/search.ts';
import * as ep___users_show from './endpoints/users/show.ts';
import * as ep___users_achievements from './endpoints/users/achievements.ts';
import * as ep___users_updateMemo from './endpoints/users/update-memo.ts';
import * as ep___fetchRss from './endpoints/fetch-rss.ts';
import * as ep___fetchExternalResources from './endpoints/fetch-external-resources.ts';
import * as ep___retention from './endpoints/retention.ts';

const eps = [
	['admin/meta', ep___admin_meta],
	['admin/abuse-user-reports', ep___admin_abuseUserReports],
	['admin/accounts/create', ep___admin_accounts_create],
	['admin/accounts/delete', ep___admin_accounts_delete],
	['admin/accounts/find-by-email', ep___admin_accounts_findByEmail],
	['admin/ad/create', ep___admin_ad_create],
	['admin/ad/delete', ep___admin_ad_delete],
	['admin/ad/list', ep___admin_ad_list],
	['admin/ad/update', ep___admin_ad_update],
	['admin/announcements/create', ep___admin_announcements_create],
	['admin/announcements/delete', ep___admin_announcements_delete],
	['admin/announcements/list', ep___admin_announcements_list],
	['admin/announcements/update', ep___admin_announcements_update],
	['admin/avatar-decorations/create', ep___admin_avatarDecorations_create],
	['admin/avatar-decorations/delete', ep___admin_avatarDecorations_delete],
	['admin/avatar-decorations/list', ep___admin_avatarDecorations_list],
	['admin/avatar-decorations/update', ep___admin_avatarDecorations_update],
	['admin/delete-all-files-of-a-user', ep___admin_deleteAllFilesOfAUser],
	['admin/unset-user-avatar', ep___admin_unsetUserAvatar],
	['admin/unset-user-banner', ep___admin_unsetUserBanner],
	['admin/drive/clean-remote-files', ep___admin_drive_cleanRemoteFiles],
	['admin/drive/cleanup', ep___admin_drive_cleanup],
	['admin/drive/files', ep___admin_drive_files],
	['admin/drive/show-file', ep___admin_drive_showFile],
	['admin/emoji/add-aliases-bulk', ep___admin_emoji_addAliasesBulk],
	['admin/emoji/add', ep___admin_emoji_add],
	['admin/emoji/copy', ep___admin_emoji_copy],
	['admin/emoji/delete-bulk', ep___admin_emoji_deleteBulk],
	['admin/emoji/delete', ep___admin_emoji_delete],
	['admin/emoji/import-zip', ep___admin_emoji_importZip],
	['admin/emoji/list-remote', ep___admin_emoji_listRemote],
	['admin/emoji/list', ep___admin_emoji_list],
	['admin/emoji/remove-aliases-bulk', ep___admin_emoji_removeAliasesBulk],
	['admin/emoji/set-aliases-bulk', ep___admin_emoji_setAliasesBulk],
	['admin/emoji/set-category-bulk', ep___admin_emoji_setCategoryBulk],
	['admin/emoji/set-license-bulk', ep___admin_emoji_setLicenseBulk],
	['admin/emoji/update', ep___admin_emoji_update],
	['admin/federation/delete-all-files', ep___admin_federation_deleteAllFiles],
	['admin/federation/refresh-remote-instance-metadata', ep___admin_federation_refreshRemoteInstanceMetadata],
	['admin/federation/remove-all-following', ep___admin_federation_removeAllFollowing],
	['admin/federation/update-instance', ep___admin_federation_updateInstance],
	['admin/get-index-stats', ep___admin_getIndexStats],
	['admin/get-table-stats', ep___admin_getTableStats],
	['admin/get-user-ips', ep___admin_getUserIps],
	['admin/invite/create', ep___admin_invite_create],
	['admin/invite/list', ep___admin_invite_list],
	['admin/promo/create', ep___admin_promo_create],
	['admin/queue/clear', ep___admin_queue_clear],
	['admin/queue/deliver-delayed', ep___admin_queue_deliverDelayed],
	['admin/queue/inbox-delayed', ep___admin_queue_inboxDelayed],
	['admin/queue/promote', ep___admin_queue_promote],
	['admin/queue/stats', ep___admin_queue_stats],
	['admin/relays/add', ep___admin_relays_add],
	['admin/relays/list', ep___admin_relays_list],
	['admin/relays/remove', ep___admin_relays_remove],
	['admin/reset-password', ep___admin_resetPassword],
	['admin/resolve-abuse-user-report', ep___admin_resolveAbuseUserReport],
	['admin/send-email', ep___admin_sendEmail],
	['admin/server-info', ep___admin_serverInfo],
	['admin/show-moderation-logs', ep___admin_showModerationLogs],
	['admin/show-user', ep___admin_showUser],
	['admin/show-users', ep___admin_showUsers],
	['admin/suspend-user', ep___admin_suspendUser],
	['admin/unsuspend-user', ep___admin_unsuspendUser],
	['admin/update-meta', ep___admin_updateMeta],
	['admin/delete-account', ep___admin_deleteAccount],
	['admin/update-user-note', ep___admin_updateUserNote],
	['admin/roles/create', ep___admin_roles_create],
	['admin/roles/delete', ep___admin_roles_delete],
	['admin/roles/list', ep___admin_roles_list],
	['admin/roles/show', ep___admin_roles_show],
	['admin/roles/update', ep___admin_roles_update],
	['admin/roles/assign', ep___admin_roles_assign],
	['admin/roles/unassign', ep___admin_roles_unassign],
	['admin/roles/update-default-policies', ep___admin_roles_updateDefaultPolicies],
	['admin/roles/users', ep___admin_roles_users],
	['announcements', ep___announcements],
	['antennas/create', ep___antennas_create],
	['antennas/delete', ep___antennas_delete],
	['antennas/list', ep___antennas_list],
	['antennas/notes', ep___antennas_notes],
	['antennas/show', ep___antennas_show],
	['antennas/update', ep___antennas_update],
	['ap/get', ep___ap_get],
	['ap/show', ep___ap_show],
	['app/create', ep___app_create],
	['app/show', ep___app_show],
	['auth/accept', ep___auth_accept],
	['auth/session/generate', ep___auth_session_generate],
	['auth/session/show', ep___auth_session_show],
	['auth/session/userkey', ep___auth_session_userkey],
	['blocking/create', ep___blocking_create],
	['blocking/delete', ep___blocking_delete],
	['blocking/list', ep___blocking_list],
	['channels/create', ep___channels_create],
	['channels/featured', ep___channels_featured],
	['channels/follow', ep___channels_follow],
	['channels/followed', ep___channels_followed],
	['channels/owned', ep___channels_owned],
	['channels/show', ep___channels_show],
	['channels/timeline', ep___channels_timeline],
	['channels/unfollow', ep___channels_unfollow],
	['channels/update', ep___channels_update],
	['channels/favorite', ep___channels_favorite],
	['channels/unfavorite', ep___channels_unfavorite],
	['channels/my-favorites', ep___channels_myFavorites],
	['channels/search', ep___channels_search],
	['charts/active-users', ep___charts_activeUsers],
	['charts/ap-request', ep___charts_apRequest],
	['charts/drive', ep___charts_drive],
	['charts/federation', ep___charts_federation],
	['charts/instance', ep___charts_instance],
	['charts/notes', ep___charts_notes],
	['charts/user/drive', ep___charts_user_drive],
	['charts/user/following', ep___charts_user_following],
	['charts/user/notes', ep___charts_user_notes],
	['charts/user/pv', ep___charts_user_pv],
	['charts/user/reactions', ep___charts_user_reactions],
	['charts/users', ep___charts_users],
	['clips/add-note', ep___clips_addNote],
	['clips/remove-note', ep___clips_removeNote],
	['clips/create', ep___clips_create],
	['clips/delete', ep___clips_delete],
	['clips/list', ep___clips_list],
	['clips/notes', ep___clips_notes],
	['clips/show', ep___clips_show],
	['clips/update', ep___clips_update],
	['clips/favorite', ep___clips_favorite],
	['clips/unfavorite', ep___clips_unfavorite],
	['clips/my-favorites', ep___clips_myFavorites],
	['drive', ep___drive],
	['drive/files', ep___drive_files],
	['drive/files/attached-notes', ep___drive_files_attachedNotes],
	['drive/files/check-existence', ep___drive_files_checkExistence],
	['drive/files/create', ep___drive_files_create],
	['drive/files/delete', ep___drive_files_delete],
	['drive/files/find-by-hash', ep___drive_files_findByHash],
	['drive/files/find', ep___drive_files_find],
	['drive/files/show', ep___drive_files_show],
	['drive/files/update', ep___drive_files_update],
	['drive/files/upload-from-url', ep___drive_files_uploadFromUrl],
	['drive/folders', ep___drive_folders],
	['drive/folders/create', ep___drive_folders_create],
	['drive/folders/delete', ep___drive_folders_delete],
	['drive/folders/find', ep___drive_folders_find],
	['drive/folders/show', ep___drive_folders_show],
	['drive/folders/update', ep___drive_folders_update],
	['drive/stream', ep___drive_stream],
	['email-address/available', ep___emailAddress_available],
	['endpoint', ep___endpoint],
	['endpoints', ep___endpoints],
	['export-custom-emojis', ep___exportCustomEmojis],
	['federation/followers', ep___federation_followers],
	['federation/following', ep___federation_following],
	['federation/instances', ep___federation_instances],
	['federation/show-instance', ep___federation_showInstance],
	['federation/update-remote-user', ep___federation_updateRemoteUser],
	['federation/users', ep___federation_users],
	['federation/stats', ep___federation_stats],
	['following/create', ep___following_create],
	['following/delete', ep___following_delete],
	['following/update', ep___following_update],
	['following/update-all', ep___following_update_all],
	['following/invalidate', ep___following_invalidate],
	['following/requests/accept', ep___following_requests_accept],
	['following/requests/cancel', ep___following_requests_cancel],
	['following/requests/list', ep___following_requests_list],
	['following/requests/reject', ep___following_requests_reject],
	['gallery/featured', ep___gallery_featured],
	['gallery/popular', ep___gallery_popular],
	['gallery/posts', ep___gallery_posts],
	['gallery/posts/create', ep___gallery_posts_create],
	['gallery/posts/delete', ep___gallery_posts_delete],
	['gallery/posts/like', ep___gallery_posts_like],
	['gallery/posts/show', ep___gallery_posts_show],
	['gallery/posts/unlike', ep___gallery_posts_unlike],
	['gallery/posts/update', ep___gallery_posts_update],
	['get-online-users-count', ep___getOnlineUsersCount],
	['get-avatar-decorations', ep___getAvatarDecorations],
	['hashtags/list', ep___hashtags_list],
	['hashtags/search', ep___hashtags_search],
	['hashtags/show', ep___hashtags_show],
	['hashtags/trend', ep___hashtags_trend],
	['hashtags/users', ep___hashtags_users],
	['i', ep___i],
	['i/2fa/done', ep___i_2fa_done],
	['i/2fa/key-done', ep___i_2fa_keyDone],
	['i/2fa/password-less', ep___i_2fa_passwordLess],
	['i/2fa/register-key', ep___i_2fa_registerKey],
	['i/2fa/register', ep___i_2fa_register],
	['i/2fa/update-key', ep___i_2fa_updateKey],
	['i/2fa/remove-key', ep___i_2fa_removeKey],
	['i/2fa/unregister', ep___i_2fa_unregister],
	['i/apps', ep___i_apps],
	['i/authorized-apps', ep___i_authorizedApps],
	['i/claim-achievement', ep___i_claimAchievement],
	['i/change-password', ep___i_changePassword],
	['i/delete-account', ep___i_deleteAccount],
	['i/export-blocking', ep___i_exportBlocking],
	['i/export-following', ep___i_exportFollowing],
	['i/export-mute', ep___i_exportMute],
	['i/export-notes', ep___i_exportNotes],
	['i/export-favorites', ep___i_exportFavorites],
	['i/export-user-lists', ep___i_exportUserLists],
	['i/export-antennas', ep___i_exportAntennas],
	['i/favorites', ep___i_favorites],
	['i/gallery/likes', ep___i_gallery_likes],
	['i/gallery/posts', ep___i_gallery_posts],
	['i/import-blocking', ep___i_importBlocking],
	['i/import-following', ep___i_importFollowing],
	['i/import-muting', ep___i_importMuting],
	['i/import-user-lists', ep___i_importUserLists],
	['i/import-antennas', ep___i_importAntennas],
	['i/notifications', ep___i_notifications],
	['i/notifications-grouped', ep___i_notificationsGrouped],
	['i/page-likes', ep___i_pageLikes],
	['i/pages', ep___i_pages],
	['i/pin', ep___i_pin],
	['i/read-all-unread-notes', ep___i_readAllUnreadNotes],
	['i/read-announcement', ep___i_readAnnouncement],
	['i/regenerate-token', ep___i_regenerateToken],
	['i/registry/get-all', ep___i_registry_getAll],
	['i/registry/get-detail', ep___i_registry_getDetail],
	['i/registry/get', ep___i_registry_get],
	['i/registry/keys-with-type', ep___i_registry_keysWithType],
	['i/registry/keys', ep___i_registry_keys],
	['i/registry/remove', ep___i_registry_remove],
	['i/registry/scopes-with-domain', ep___i_registry_scopesWithDomain],
	['i/registry/set', ep___i_registry_set],
	['i/revoke-token', ep___i_revokeToken],
	['i/signin-history', ep___i_signinHistory],
	['i/unpin', ep___i_unpin],
	['i/update-email', ep___i_updateEmail],
	['i/update', ep___i_update],
	['i/move', ep___i_move],
	['i/webhooks/create', ep___i_webhooks_create],
	['i/webhooks/list', ep___i_webhooks_list],
	['i/webhooks/show', ep___i_webhooks_show],
	['i/webhooks/update', ep___i_webhooks_update],
	['i/webhooks/delete', ep___i_webhooks_delete],
	['invite/create', ep___invite_create],
	['invite/delete', ep___invite_delete],
	['invite/list', ep___invite_list],
	['invite/limit', ep___invite_limit],
	['meta', ep___meta],
	['emojis', ep___emojis],
	['emoji', ep___emoji],
	['miauth/gen-token', ep___miauth_genToken],
	['mute/create', ep___mute_create],
	['mute/delete', ep___mute_delete],
	['mute/list', ep___mute_list],
	['renote-mute/create', ep___renoteMute_create],
	['renote-mute/delete', ep___renoteMute_delete],
	['renote-mute/list', ep___renoteMute_list],
	['my/apps', ep___my_apps],
	['notes', ep___notes],
	['notes/children', ep___notes_children],
	['notes/clips', ep___notes_clips],
	['notes/conversation', ep___notes_conversation],
	['notes/create', ep___notes_create],
	['notes/delete', ep___notes_delete],
	['notes/favorites/create', ep___notes_favorites_create],
	['notes/favorites/delete', ep___notes_favorites_delete],
	['notes/featured', ep___notes_featured],
	['notes/global-timeline', ep___notes_globalTimeline],
	['notes/hybrid-timeline', ep___notes_hybridTimeline],
	['notes/local-timeline', ep___notes_localTimeline],
	['notes/mentions', ep___notes_mentions],
	['notes/polls/recommendation', ep___notes_polls_recommendation],
	['notes/polls/vote', ep___notes_polls_vote],
	['notes/reactions', ep___notes_reactions],
	['notes/reactions/create', ep___notes_reactions_create],
	['notes/reactions/delete', ep___notes_reactions_delete],
	['notes/renotes', ep___notes_renotes],
	['notes/replies', ep___notes_replies],
	['notes/search-by-tag', ep___notes_searchByTag],
	['notes/search', ep___notes_search],
	['notes/show', ep___notes_show],
	['notes/state', ep___notes_state],
	['notes/thread-muting/create', ep___notes_threadMuting_create],
	['notes/thread-muting/delete', ep___notes_threadMuting_delete],
	['notes/timeline', ep___notes_timeline],
	['notes/translate', ep___notes_translate],
	['notes/unrenote', ep___notes_unrenote],
	['notes/user-list-timeline', ep___notes_userListTimeline],
	['notifications/create', ep___notifications_create],
	['notifications/mark-all-as-read', ep___notifications_markAllAsRead],
	['notifications/test-notification', ep___notifications_testNotification],
	['page-push', ep___pagePush],
	['pages/create', ep___pages_create],
	['pages/delete', ep___pages_delete],
	['pages/featured', ep___pages_featured],
	['pages/like', ep___pages_like],
	['pages/show', ep___pages_show],
	['pages/unlike', ep___pages_unlike],
	['pages/update', ep___pages_update],
	['flash/create', ep___flash_create],
	['flash/delete', ep___flash_delete],
	['flash/featured', ep___flash_featured],
	['flash/like', ep___flash_like],
	['flash/show', ep___flash_show],
	['flash/unlike', ep___flash_unlike],
	['flash/update', ep___flash_update],
	['flash/my', ep___flash_my],
	['flash/my-likes', ep___flash_myLikes],
	['ping', ep___ping],
	['pinned-users', ep___pinnedUsers],
	['promo/read', ep___promo_read],
	['roles/list', ep___roles_list],
	['roles/show', ep___roles_show],
	['roles/users', ep___roles_users],
	['roles/notes', ep___roles_notes],
	['request-reset-password', ep___requestResetPassword],
	['reset-db', ep___resetDb],
	['reset-password', ep___resetPassword],
	['server-info', ep___serverInfo],
	['stats', ep___stats],
	['sw/show-registration', ep___sw_show_registration],
	['sw/update-registration', ep___sw_update_registration],
	['sw/register', ep___sw_register],
	['sw/unregister', ep___sw_unregister],
	['test', ep___test],
	['username/available', ep___username_available],
	['users', ep___users],
	['users/clips', ep___users_clips],
	['users/followers', ep___users_followers],
	['users/following', ep___users_following],
	['users/gallery/posts', ep___users_gallery_posts],
	['users/get-frequently-replied-users', ep___users_getFrequentlyRepliedUsers],
	['users/featured-notes', ep___users_featuredNotes],
	['users/lists/create', ep___users_lists_create],
	['users/lists/delete', ep___users_lists_delete],
	['users/lists/list', ep___users_lists_list],
	['users/lists/pull', ep___users_lists_pull],
	['users/lists/push', ep___users_lists_push],
	['users/lists/show', ep___users_lists_show],
	['users/lists/favorite', ep___users_lists_favorite],
	['users/lists/unfavorite', ep___users_lists_unfavorite],
	['users/lists/update', ep___users_lists_update],
	['users/lists/create-from-public', ep___users_lists_createFromPublic],
	['users/lists/update-membership', ep___users_lists_updateMembership],
	['users/lists/get-memberships', ep___users_lists_getMemberships],
	['users/notes', ep___users_notes],
	['users/pages', ep___users_pages],
	['users/flashs', ep___users_flashs],
	['users/reactions', ep___users_reactions],
	['users/recommendation', ep___users_recommendation],
	['users/relation', ep___users_relation],
	['users/report-abuse', ep___users_reportAbuse],
	['users/search-by-username-and-host', ep___users_searchByUsernameAndHost],
	['users/search', ep___users_search],
	['users/show', ep___users_show],
	['users/achievements', ep___users_achievements],
	['users/update-memo', ep___users_updateMemo],
	['fetch-rss', ep___fetchRss],
	['fetch-external-resources', ep___fetchExternalResources],
	['retention', ep___retention],
];

export interface IEndpointMeta {
	readonly stability?: 'deprecated' | 'experimental' | 'stable';

	readonly tags?: ReadonlyArray<string>;

	readonly errors?: {
		readonly [key: string]: {
			readonly message: string;
			readonly code: string;
			readonly id: string;
		};
	};

	readonly res?: Schema;

	/**
	 * このエンドポイントにリクエストするのにユーザー情報が必須か否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireCredential?: boolean;

	/**
	 * isModeratorなロールを必要とするか
	 */
	readonly requireModerator?: boolean;

	/**
	 * isAdministratorなロールを必要とするか
	 */
	readonly requireAdmin?: boolean;

	readonly requireRolePolicy?: keyof RolePolicies;

	/**
	 * 引っ越し済みのユーザーによるリクエストを禁止するか
	 * 省略した場合は false として解釈されます。
	 */
	readonly prohibitMoved?: boolean;

	/**
	 * エンドポイントのリミテーションに関するやつ
	 * 省略した場合はリミテーションは無いものとして解釈されます。
	 */
	readonly limit?: {

		/**
		 * 複数のエンドポイントでリミットを共有したい場合に指定するキー
		 */
		readonly key?: string;

		/**
		 * リミットを適用する期間(ms)
		 * このプロパティを設定する場合、max プロパティも設定する必要があります。
		 */
		readonly duration?: number;

		/**
		 * durationで指定した期間内にいくつまでリクエストできるのか
		 * このプロパティを設定する場合、duration プロパティも設定する必要があります。
		 */
		readonly max?: number;

		/**
		 * 最低でもどれくらいの間隔を開けてリクエストしなければならないか(ms)
		 */
		readonly minInterval?: number;
	};

	/**
	 * ファイルの添付を必要とするか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireFile?: boolean;

	/**
	 * サードパーティアプリからはリクエストすることができないか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly secure?: boolean;

	/**
	 * エンドポイントの種類
	 * パーミッションの実現に利用されます。
	 */
	readonly kind?: string;

	readonly description?: string;

	/**
	 * GETでのリクエストを許容するか否か
	 */
	readonly allowGet?: boolean;

	/**
	 * 正常応答をキャッシュ (Cache-Control: public) する秒数
	 */
	readonly cacheSec?: number;
}

export interface IEndpoint {
	name: string;
	meta: IEndpointMeta;
	params: Schema;
}

const endpoints: IEndpoint[] = (eps as [string, any]).map(([name, ep]) => {
	return {
		name: name,
		get meta() { return ep.meta ?? {}; },
		get params() { return ep.paramDef; },
	};
});

// eslint-disable-next-line import/no-default-export
export default endpoints;
