/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';

import { CoreModule } from '@/core/CoreModule.ts';
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
import * as ep___users_lists_update from './endpoints/users/lists/update.ts';
import * as ep___users_lists_favorite from './endpoints/users/lists/favorite.ts';
import * as ep___users_lists_unfavorite from './endpoints/users/lists/unfavorite.ts';
import * as ep___users_lists_createFromPublic from './endpoints/users/lists/create-from-public.ts';
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
import { GetterService } from './GetterService.ts';
import { ApiLoggerService } from './ApiLoggerService.ts';
import type { Provider } from '@nestjs/common';

const $admin_meta: Provider = { provide: 'ep:admin/meta', useClass: ep___admin_meta.default };
const $admin_abuseUserReports: Provider = { provide: 'ep:admin/abuse-user-reports', useClass: ep___admin_abuseUserReports.default };
const $admin_accounts_create: Provider = { provide: 'ep:admin/accounts/create', useClass: ep___admin_accounts_create.default };
const $admin_accounts_delete: Provider = { provide: 'ep:admin/accounts/delete', useClass: ep___admin_accounts_delete.default };
const $admin_accounts_findByEmail: Provider = { provide: 'ep:admin/accounts/find-by-email', useClass: ep___admin_accounts_findByEmail.default };
const $admin_ad_create: Provider = { provide: 'ep:admin/ad/create', useClass: ep___admin_ad_create.default };
const $admin_ad_delete: Provider = { provide: 'ep:admin/ad/delete', useClass: ep___admin_ad_delete.default };
const $admin_ad_list: Provider = { provide: 'ep:admin/ad/list', useClass: ep___admin_ad_list.default };
const $admin_ad_update: Provider = { provide: 'ep:admin/ad/update', useClass: ep___admin_ad_update.default };
const $admin_announcements_create: Provider = { provide: 'ep:admin/announcements/create', useClass: ep___admin_announcements_create.default };
const $admin_announcements_delete: Provider = { provide: 'ep:admin/announcements/delete', useClass: ep___admin_announcements_delete.default };
const $admin_announcements_list: Provider = { provide: 'ep:admin/announcements/list', useClass: ep___admin_announcements_list.default };
const $admin_announcements_update: Provider = { provide: 'ep:admin/announcements/update', useClass: ep___admin_announcements_update.default };
const $admin_avatarDecorations_create: Provider = { provide: 'ep:admin/avatar-decorations/create', useClass: ep___admin_avatarDecorations_create.default };
const $admin_avatarDecorations_delete: Provider = { provide: 'ep:admin/avatar-decorations/delete', useClass: ep___admin_avatarDecorations_delete.default };
const $admin_avatarDecorations_list: Provider = { provide: 'ep:admin/avatar-decorations/list', useClass: ep___admin_avatarDecorations_list.default };
const $admin_avatarDecorations_update: Provider = { provide: 'ep:admin/avatar-decorations/update', useClass: ep___admin_avatarDecorations_update.default };
const $admin_deleteAllFilesOfAUser: Provider = { provide: 'ep:admin/delete-all-files-of-a-user', useClass: ep___admin_deleteAllFilesOfAUser.default };
const $admin_unsetUserAvatar: Provider = { provide: 'ep:admin/unset-user-avatar', useClass: ep___admin_unsetUserAvatar.default };
const $admin_unsetUserBanner: Provider = { provide: 'ep:admin/unset-user-banner', useClass: ep___admin_unsetUserBanner.default };
const $admin_drive_cleanRemoteFiles: Provider = { provide: 'ep:admin/drive/clean-remote-files', useClass: ep___admin_drive_cleanRemoteFiles.default };
const $admin_drive_cleanup: Provider = { provide: 'ep:admin/drive/cleanup', useClass: ep___admin_drive_cleanup.default };
const $admin_drive_files: Provider = { provide: 'ep:admin/drive/files', useClass: ep___admin_drive_files.default };
const $admin_drive_showFile: Provider = { provide: 'ep:admin/drive/show-file', useClass: ep___admin_drive_showFile.default };
const $admin_emoji_addAliasesBulk: Provider = { provide: 'ep:admin/emoji/add-aliases-bulk', useClass: ep___admin_emoji_addAliasesBulk.default };
const $admin_emoji_add: Provider = { provide: 'ep:admin/emoji/add', useClass: ep___admin_emoji_add.default };
const $admin_emoji_copy: Provider = { provide: 'ep:admin/emoji/copy', useClass: ep___admin_emoji_copy.default };
const $admin_emoji_deleteBulk: Provider = { provide: 'ep:admin/emoji/delete-bulk', useClass: ep___admin_emoji_deleteBulk.default };
const $admin_emoji_delete: Provider = { provide: 'ep:admin/emoji/delete', useClass: ep___admin_emoji_delete.default };
const $admin_emoji_importZip: Provider = { provide: 'ep:admin/emoji/import-zip', useClass: ep___admin_emoji_importZip.default };
const $admin_emoji_listRemote: Provider = { provide: 'ep:admin/emoji/list-remote', useClass: ep___admin_emoji_listRemote.default };
const $admin_emoji_list: Provider = { provide: 'ep:admin/emoji/list', useClass: ep___admin_emoji_list.default };
const $admin_emoji_removeAliasesBulk: Provider = { provide: 'ep:admin/emoji/remove-aliases-bulk', useClass: ep___admin_emoji_removeAliasesBulk.default };
const $admin_emoji_setAliasesBulk: Provider = { provide: 'ep:admin/emoji/set-aliases-bulk', useClass: ep___admin_emoji_setAliasesBulk.default };
const $admin_emoji_setCategoryBulk: Provider = { provide: 'ep:admin/emoji/set-category-bulk', useClass: ep___admin_emoji_setCategoryBulk.default };
const $admin_emoji_setLicenseBulk: Provider = { provide: 'ep:admin/emoji/set-license-bulk', useClass: ep___admin_emoji_setLicenseBulk.default };
const $admin_emoji_update: Provider = { provide: 'ep:admin/emoji/update', useClass: ep___admin_emoji_update.default };
const $admin_federation_deleteAllFiles: Provider = { provide: 'ep:admin/federation/delete-all-files', useClass: ep___admin_federation_deleteAllFiles.default };
const $admin_federation_refreshRemoteInstanceMetadata: Provider = { provide: 'ep:admin/federation/refresh-remote-instance-metadata', useClass: ep___admin_federation_refreshRemoteInstanceMetadata.default };
const $admin_federation_removeAllFollowing: Provider = { provide: 'ep:admin/federation/remove-all-following', useClass: ep___admin_federation_removeAllFollowing.default };
const $admin_federation_updateInstance: Provider = { provide: 'ep:admin/federation/update-instance', useClass: ep___admin_federation_updateInstance.default };
const $admin_getIndexStats: Provider = { provide: 'ep:admin/get-index-stats', useClass: ep___admin_getIndexStats.default };
const $admin_getTableStats: Provider = { provide: 'ep:admin/get-table-stats', useClass: ep___admin_getTableStats.default };
const $admin_getUserIps: Provider = { provide: 'ep:admin/get-user-ips', useClass: ep___admin_getUserIps.default };
const $admin_invite_create: Provider = { provide: 'ep:admin/invite/create', useClass: ep___admin_invite_create.default };
const $admin_invite_list: Provider = { provide: 'ep:admin/invite/list', useClass: ep___admin_invite_list.default };
const $admin_promo_create: Provider = { provide: 'ep:admin/promo/create', useClass: ep___admin_promo_create.default };
const $admin_queue_clear: Provider = { provide: 'ep:admin/queue/clear', useClass: ep___admin_queue_clear.default };
const $admin_queue_deliverDelayed: Provider = { provide: 'ep:admin/queue/deliver-delayed', useClass: ep___admin_queue_deliverDelayed.default };
const $admin_queue_inboxDelayed: Provider = { provide: 'ep:admin/queue/inbox-delayed', useClass: ep___admin_queue_inboxDelayed.default };
const $admin_queue_promote: Provider = { provide: 'ep:admin/queue/promote', useClass: ep___admin_queue_promote.default };
const $admin_queue_stats: Provider = { provide: 'ep:admin/queue/stats', useClass: ep___admin_queue_stats.default };
const $admin_relays_add: Provider = { provide: 'ep:admin/relays/add', useClass: ep___admin_relays_add.default };
const $admin_relays_list: Provider = { provide: 'ep:admin/relays/list', useClass: ep___admin_relays_list.default };
const $admin_relays_remove: Provider = { provide: 'ep:admin/relays/remove', useClass: ep___admin_relays_remove.default };
const $admin_resetPassword: Provider = { provide: 'ep:admin/reset-password', useClass: ep___admin_resetPassword.default };
const $admin_resolveAbuseUserReport: Provider = { provide: 'ep:admin/resolve-abuse-user-report', useClass: ep___admin_resolveAbuseUserReport.default };
const $admin_sendEmail: Provider = { provide: 'ep:admin/send-email', useClass: ep___admin_sendEmail.default };
const $admin_serverInfo: Provider = { provide: 'ep:admin/server-info', useClass: ep___admin_serverInfo.default };
const $admin_showModerationLogs: Provider = { provide: 'ep:admin/show-moderation-logs', useClass: ep___admin_showModerationLogs.default };
const $admin_showUser: Provider = { provide: 'ep:admin/show-user', useClass: ep___admin_showUser.default };
const $admin_showUsers: Provider = { provide: 'ep:admin/show-users', useClass: ep___admin_showUsers.default };
const $admin_suspendUser: Provider = { provide: 'ep:admin/suspend-user', useClass: ep___admin_suspendUser.default };
const $admin_unsuspendUser: Provider = { provide: 'ep:admin/unsuspend-user', useClass: ep___admin_unsuspendUser.default };
const $admin_updateMeta: Provider = { provide: 'ep:admin/update-meta', useClass: ep___admin_updateMeta.default };
const $admin_deleteAccount: Provider = { provide: 'ep:admin/delete-account', useClass: ep___admin_deleteAccount.default };
const $admin_updateUserNote: Provider = { provide: 'ep:admin/update-user-note', useClass: ep___admin_updateUserNote.default };
const $admin_roles_create: Provider = { provide: 'ep:admin/roles/create', useClass: ep___admin_roles_create.default };
const $admin_roles_delete: Provider = { provide: 'ep:admin/roles/delete', useClass: ep___admin_roles_delete.default };
const $admin_roles_list: Provider = { provide: 'ep:admin/roles/list', useClass: ep___admin_roles_list.default };
const $admin_roles_show: Provider = { provide: 'ep:admin/roles/show', useClass: ep___admin_roles_show.default };
const $admin_roles_update: Provider = { provide: 'ep:admin/roles/update', useClass: ep___admin_roles_update.default };
const $admin_roles_assign: Provider = { provide: 'ep:admin/roles/assign', useClass: ep___admin_roles_assign.default };
const $admin_roles_unassign: Provider = { provide: 'ep:admin/roles/unassign', useClass: ep___admin_roles_unassign.default };
const $admin_roles_updateDefaultPolicies: Provider = { provide: 'ep:admin/roles/update-default-policies', useClass: ep___admin_roles_updateDefaultPolicies.default };
const $admin_roles_users: Provider = { provide: 'ep:admin/roles/users', useClass: ep___admin_roles_users.default };
const $announcements: Provider = { provide: 'ep:announcements', useClass: ep___announcements.default };
const $antennas_create: Provider = { provide: 'ep:antennas/create', useClass: ep___antennas_create.default };
const $antennas_delete: Provider = { provide: 'ep:antennas/delete', useClass: ep___antennas_delete.default };
const $antennas_list: Provider = { provide: 'ep:antennas/list', useClass: ep___antennas_list.default };
const $antennas_notes: Provider = { provide: 'ep:antennas/notes', useClass: ep___antennas_notes.default };
const $antennas_show: Provider = { provide: 'ep:antennas/show', useClass: ep___antennas_show.default };
const $antennas_update: Provider = { provide: 'ep:antennas/update', useClass: ep___antennas_update.default };
const $ap_get: Provider = { provide: 'ep:ap/get', useClass: ep___ap_get.default };
const $ap_show: Provider = { provide: 'ep:ap/show', useClass: ep___ap_show.default };
const $app_create: Provider = { provide: 'ep:app/create', useClass: ep___app_create.default };
const $app_show: Provider = { provide: 'ep:app/show', useClass: ep___app_show.default };
const $auth_accept: Provider = { provide: 'ep:auth/accept', useClass: ep___auth_accept.default };
const $auth_session_generate: Provider = { provide: 'ep:auth/session/generate', useClass: ep___auth_session_generate.default };
const $auth_session_show: Provider = { provide: 'ep:auth/session/show', useClass: ep___auth_session_show.default };
const $auth_session_userkey: Provider = { provide: 'ep:auth/session/userkey', useClass: ep___auth_session_userkey.default };
const $blocking_create: Provider = { provide: 'ep:blocking/create', useClass: ep___blocking_create.default };
const $blocking_delete: Provider = { provide: 'ep:blocking/delete', useClass: ep___blocking_delete.default };
const $blocking_list: Provider = { provide: 'ep:blocking/list', useClass: ep___blocking_list.default };
const $channels_create: Provider = { provide: 'ep:channels/create', useClass: ep___channels_create.default };
const $channels_featured: Provider = { provide: 'ep:channels/featured', useClass: ep___channels_featured.default };
const $channels_follow: Provider = { provide: 'ep:channels/follow', useClass: ep___channels_follow.default };
const $channels_followed: Provider = { provide: 'ep:channels/followed', useClass: ep___channels_followed.default };
const $channels_owned: Provider = { provide: 'ep:channels/owned', useClass: ep___channels_owned.default };
const $channels_show: Provider = { provide: 'ep:channels/show', useClass: ep___channels_show.default };
const $channels_timeline: Provider = { provide: 'ep:channels/timeline', useClass: ep___channels_timeline.default };
const $channels_unfollow: Provider = { provide: 'ep:channels/unfollow', useClass: ep___channels_unfollow.default };
const $channels_update: Provider = { provide: 'ep:channels/update', useClass: ep___channels_update.default };
const $channels_favorite: Provider = { provide: 'ep:channels/favorite', useClass: ep___channels_favorite.default };
const $channels_unfavorite: Provider = { provide: 'ep:channels/unfavorite', useClass: ep___channels_unfavorite.default };
const $channels_myFavorites: Provider = { provide: 'ep:channels/my-favorites', useClass: ep___channels_myFavorites.default };
const $channels_search: Provider = { provide: 'ep:channels/search', useClass: ep___channels_search.default };
const $charts_activeUsers: Provider = { provide: 'ep:charts/active-users', useClass: ep___charts_activeUsers.default };
const $charts_apRequest: Provider = { provide: 'ep:charts/ap-request', useClass: ep___charts_apRequest.default };
const $charts_drive: Provider = { provide: 'ep:charts/drive', useClass: ep___charts_drive.default };
const $charts_federation: Provider = { provide: 'ep:charts/federation', useClass: ep___charts_federation.default };
const $charts_instance: Provider = { provide: 'ep:charts/instance', useClass: ep___charts_instance.default };
const $charts_notes: Provider = { provide: 'ep:charts/notes', useClass: ep___charts_notes.default };
const $charts_user_drive: Provider = { provide: 'ep:charts/user/drive', useClass: ep___charts_user_drive.default };
const $charts_user_following: Provider = { provide: 'ep:charts/user/following', useClass: ep___charts_user_following.default };
const $charts_user_notes: Provider = { provide: 'ep:charts/user/notes', useClass: ep___charts_user_notes.default };
const $charts_user_pv: Provider = { provide: 'ep:charts/user/pv', useClass: ep___charts_user_pv.default };
const $charts_user_reactions: Provider = { provide: 'ep:charts/user/reactions', useClass: ep___charts_user_reactions.default };
const $charts_users: Provider = { provide: 'ep:charts/users', useClass: ep___charts_users.default };
const $clips_addNote: Provider = { provide: 'ep:clips/add-note', useClass: ep___clips_addNote.default };
const $clips_removeNote: Provider = { provide: 'ep:clips/remove-note', useClass: ep___clips_removeNote.default };
const $clips_create: Provider = { provide: 'ep:clips/create', useClass: ep___clips_create.default };
const $clips_delete: Provider = { provide: 'ep:clips/delete', useClass: ep___clips_delete.default };
const $clips_list: Provider = { provide: 'ep:clips/list', useClass: ep___clips_list.default };
const $clips_notes: Provider = { provide: 'ep:clips/notes', useClass: ep___clips_notes.default };
const $clips_show: Provider = { provide: 'ep:clips/show', useClass: ep___clips_show.default };
const $clips_update: Provider = { provide: 'ep:clips/update', useClass: ep___clips_update.default };
const $clips_favorite: Provider = { provide: 'ep:clips/favorite', useClass: ep___clips_favorite.default };
const $clips_unfavorite: Provider = { provide: 'ep:clips/unfavorite', useClass: ep___clips_unfavorite.default };
const $clips_myFavorites: Provider = { provide: 'ep:clips/my-favorites', useClass: ep___clips_myFavorites.default };
const $drive: Provider = { provide: 'ep:drive', useClass: ep___drive.default };
const $drive_files: Provider = { provide: 'ep:drive/files', useClass: ep___drive_files.default };
const $drive_files_attachedNotes: Provider = { provide: 'ep:drive/files/attached-notes', useClass: ep___drive_files_attachedNotes.default };
const $drive_files_checkExistence: Provider = { provide: 'ep:drive/files/check-existence', useClass: ep___drive_files_checkExistence.default };
const $drive_files_create: Provider = { provide: 'ep:drive/files/create', useClass: ep___drive_files_create.default };
const $drive_files_delete: Provider = { provide: 'ep:drive/files/delete', useClass: ep___drive_files_delete.default };
const $drive_files_findByHash: Provider = { provide: 'ep:drive/files/find-by-hash', useClass: ep___drive_files_findByHash.default };
const $drive_files_find: Provider = { provide: 'ep:drive/files/find', useClass: ep___drive_files_find.default };
const $drive_files_show: Provider = { provide: 'ep:drive/files/show', useClass: ep___drive_files_show.default };
const $drive_files_update: Provider = { provide: 'ep:drive/files/update', useClass: ep___drive_files_update.default };
const $drive_files_uploadFromUrl: Provider = { provide: 'ep:drive/files/upload-from-url', useClass: ep___drive_files_uploadFromUrl.default };
const $drive_folders: Provider = { provide: 'ep:drive/folders', useClass: ep___drive_folders.default };
const $drive_folders_create: Provider = { provide: 'ep:drive/folders/create', useClass: ep___drive_folders_create.default };
const $drive_folders_delete: Provider = { provide: 'ep:drive/folders/delete', useClass: ep___drive_folders_delete.default };
const $drive_folders_find: Provider = { provide: 'ep:drive/folders/find', useClass: ep___drive_folders_find.default };
const $drive_folders_show: Provider = { provide: 'ep:drive/folders/show', useClass: ep___drive_folders_show.default };
const $drive_folders_update: Provider = { provide: 'ep:drive/folders/update', useClass: ep___drive_folders_update.default };
const $drive_stream: Provider = { provide: 'ep:drive/stream', useClass: ep___drive_stream.default };
const $emailAddress_available: Provider = { provide: 'ep:email-address/available', useClass: ep___emailAddress_available.default };
const $endpoint: Provider = { provide: 'ep:endpoint', useClass: ep___endpoint.default };
const $endpoints: Provider = { provide: 'ep:endpoints', useClass: ep___endpoints.default };
const $exportCustomEmojis: Provider = { provide: 'ep:export-custom-emojis', useClass: ep___exportCustomEmojis.default };
const $federation_followers: Provider = { provide: 'ep:federation/followers', useClass: ep___federation_followers.default };
const $federation_following: Provider = { provide: 'ep:federation/following', useClass: ep___federation_following.default };
const $federation_instances: Provider = { provide: 'ep:federation/instances', useClass: ep___federation_instances.default };
const $federation_showInstance: Provider = { provide: 'ep:federation/show-instance', useClass: ep___federation_showInstance.default };
const $federation_updateRemoteUser: Provider = { provide: 'ep:federation/update-remote-user', useClass: ep___federation_updateRemoteUser.default };
const $federation_users: Provider = { provide: 'ep:federation/users', useClass: ep___federation_users.default };
const $federation_stats: Provider = { provide: 'ep:federation/stats', useClass: ep___federation_stats.default };
const $following_create: Provider = { provide: 'ep:following/create', useClass: ep___following_create.default };
const $following_delete: Provider = { provide: 'ep:following/delete', useClass: ep___following_delete.default };
const $following_update: Provider = { provide: 'ep:following/update', useClass: ep___following_update.default };
const $following_update_all: Provider = { provide: 'ep:following/update-all', useClass: ep___following_update_all.default };
const $following_invalidate: Provider = { provide: 'ep:following/invalidate', useClass: ep___following_invalidate.default };
const $following_requests_accept: Provider = { provide: 'ep:following/requests/accept', useClass: ep___following_requests_accept.default };
const $following_requests_cancel: Provider = { provide: 'ep:following/requests/cancel', useClass: ep___following_requests_cancel.default };
const $following_requests_list: Provider = { provide: 'ep:following/requests/list', useClass: ep___following_requests_list.default };
const $following_requests_reject: Provider = { provide: 'ep:following/requests/reject', useClass: ep___following_requests_reject.default };
const $gallery_featured: Provider = { provide: 'ep:gallery/featured', useClass: ep___gallery_featured.default };
const $gallery_popular: Provider = { provide: 'ep:gallery/popular', useClass: ep___gallery_popular.default };
const $gallery_posts: Provider = { provide: 'ep:gallery/posts', useClass: ep___gallery_posts.default };
const $gallery_posts_create: Provider = { provide: 'ep:gallery/posts/create', useClass: ep___gallery_posts_create.default };
const $gallery_posts_delete: Provider = { provide: 'ep:gallery/posts/delete', useClass: ep___gallery_posts_delete.default };
const $gallery_posts_like: Provider = { provide: 'ep:gallery/posts/like', useClass: ep___gallery_posts_like.default };
const $gallery_posts_show: Provider = { provide: 'ep:gallery/posts/show', useClass: ep___gallery_posts_show.default };
const $gallery_posts_unlike: Provider = { provide: 'ep:gallery/posts/unlike', useClass: ep___gallery_posts_unlike.default };
const $gallery_posts_update: Provider = { provide: 'ep:gallery/posts/update', useClass: ep___gallery_posts_update.default };
const $getOnlineUsersCount: Provider = { provide: 'ep:get-online-users-count', useClass: ep___getOnlineUsersCount.default };
const $getAvatarDecorations: Provider = { provide: 'ep:get-avatar-decorations', useClass: ep___getAvatarDecorations.default };
const $hashtags_list: Provider = { provide: 'ep:hashtags/list', useClass: ep___hashtags_list.default };
const $hashtags_search: Provider = { provide: 'ep:hashtags/search', useClass: ep___hashtags_search.default };
const $hashtags_show: Provider = { provide: 'ep:hashtags/show', useClass: ep___hashtags_show.default };
const $hashtags_trend: Provider = { provide: 'ep:hashtags/trend', useClass: ep___hashtags_trend.default };
const $hashtags_users: Provider = { provide: 'ep:hashtags/users', useClass: ep___hashtags_users.default };
const $i: Provider = { provide: 'ep:i', useClass: ep___i.default };
const $i_2fa_done: Provider = { provide: 'ep:i/2fa/done', useClass: ep___i_2fa_done.default };
const $i_2fa_keyDone: Provider = { provide: 'ep:i/2fa/key-done', useClass: ep___i_2fa_keyDone.default };
const $i_2fa_passwordLess: Provider = { provide: 'ep:i/2fa/password-less', useClass: ep___i_2fa_passwordLess.default };
const $i_2fa_registerKey: Provider = { provide: 'ep:i/2fa/register-key', useClass: ep___i_2fa_registerKey.default };
const $i_2fa_register: Provider = { provide: 'ep:i/2fa/register', useClass: ep___i_2fa_register.default };
const $i_2fa_updateKey: Provider = { provide: 'ep:i/2fa/update-key', useClass: ep___i_2fa_updateKey.default };
const $i_2fa_removeKey: Provider = { provide: 'ep:i/2fa/remove-key', useClass: ep___i_2fa_removeKey.default };
const $i_2fa_unregister: Provider = { provide: 'ep:i/2fa/unregister', useClass: ep___i_2fa_unregister.default };
const $i_apps: Provider = { provide: 'ep:i/apps', useClass: ep___i_apps.default };
const $i_authorizedApps: Provider = { provide: 'ep:i/authorized-apps', useClass: ep___i_authorizedApps.default };
const $i_claimAchievement: Provider = { provide: 'ep:i/claim-achievement', useClass: ep___i_claimAchievement.default };
const $i_changePassword: Provider = { provide: 'ep:i/change-password', useClass: ep___i_changePassword.default };
const $i_deleteAccount: Provider = { provide: 'ep:i/delete-account', useClass: ep___i_deleteAccount.default };
const $i_exportBlocking: Provider = { provide: 'ep:i/export-blocking', useClass: ep___i_exportBlocking.default };
const $i_exportFollowing: Provider = { provide: 'ep:i/export-following', useClass: ep___i_exportFollowing.default };
const $i_exportMute: Provider = { provide: 'ep:i/export-mute', useClass: ep___i_exportMute.default };
const $i_exportNotes: Provider = { provide: 'ep:i/export-notes', useClass: ep___i_exportNotes.default };
const $i_exportFavorites: Provider = { provide: 'ep:i/export-favorites', useClass: ep___i_exportFavorites.default };
const $i_exportUserLists: Provider = { provide: 'ep:i/export-user-lists', useClass: ep___i_exportUserLists.default };
const $i_exportAntennas: Provider = { provide: 'ep:i/export-antennas', useClass: ep___i_exportAntennas.default };
const $i_favorites: Provider = { provide: 'ep:i/favorites', useClass: ep___i_favorites.default };
const $i_gallery_likes: Provider = { provide: 'ep:i/gallery/likes', useClass: ep___i_gallery_likes.default };
const $i_gallery_posts: Provider = { provide: 'ep:i/gallery/posts', useClass: ep___i_gallery_posts.default };
const $i_importBlocking: Provider = { provide: 'ep:i/import-blocking', useClass: ep___i_importBlocking.default };
const $i_importFollowing: Provider = { provide: 'ep:i/import-following', useClass: ep___i_importFollowing.default };
const $i_importMuting: Provider = { provide: 'ep:i/import-muting', useClass: ep___i_importMuting.default };
const $i_importUserLists: Provider = { provide: 'ep:i/import-user-lists', useClass: ep___i_importUserLists.default };
const $i_importAntennas: Provider = { provide: 'ep:i/import-antennas', useClass: ep___i_importAntennas.default };
const $i_notifications: Provider = { provide: 'ep:i/notifications', useClass: ep___i_notifications.default };
const $i_notificationsGrouped: Provider = { provide: 'ep:i/notifications-grouped', useClass: ep___i_notificationsGrouped.default };
const $i_pageLikes: Provider = { provide: 'ep:i/page-likes', useClass: ep___i_pageLikes.default };
const $i_pages: Provider = { provide: 'ep:i/pages', useClass: ep___i_pages.default };
const $i_pin: Provider = { provide: 'ep:i/pin', useClass: ep___i_pin.default };
const $i_readAllUnreadNotes: Provider = { provide: 'ep:i/read-all-unread-notes', useClass: ep___i_readAllUnreadNotes.default };
const $i_readAnnouncement: Provider = { provide: 'ep:i/read-announcement', useClass: ep___i_readAnnouncement.default };
const $i_regenerateToken: Provider = { provide: 'ep:i/regenerate-token', useClass: ep___i_regenerateToken.default };
const $i_registry_getAll: Provider = { provide: 'ep:i/registry/get-all', useClass: ep___i_registry_getAll.default };
const $i_registry_getDetail: Provider = { provide: 'ep:i/registry/get-detail', useClass: ep___i_registry_getDetail.default };
const $i_registry_get: Provider = { provide: 'ep:i/registry/get', useClass: ep___i_registry_get.default };
const $i_registry_keysWithType: Provider = { provide: 'ep:i/registry/keys-with-type', useClass: ep___i_registry_keysWithType.default };
const $i_registry_keys: Provider = { provide: 'ep:i/registry/keys', useClass: ep___i_registry_keys.default };
const $i_registry_remove: Provider = { provide: 'ep:i/registry/remove', useClass: ep___i_registry_remove.default };
const $i_registry_scopesWithDomain: Provider = { provide: 'ep:i/registry/scopes-with-domain', useClass: ep___i_registry_scopesWithDomain.default };
const $i_registry_set: Provider = { provide: 'ep:i/registry/set', useClass: ep___i_registry_set.default };
const $i_revokeToken: Provider = { provide: 'ep:i/revoke-token', useClass: ep___i_revokeToken.default };
const $i_signinHistory: Provider = { provide: 'ep:i/signin-history', useClass: ep___i_signinHistory.default };
const $i_unpin: Provider = { provide: 'ep:i/unpin', useClass: ep___i_unpin.default };
const $i_updateEmail: Provider = { provide: 'ep:i/update-email', useClass: ep___i_updateEmail.default };
const $i_update: Provider = { provide: 'ep:i/update', useClass: ep___i_update.default };
const $i_move: Provider = { provide: 'ep:i/move', useClass: ep___i_move.default };
const $i_webhooks_create: Provider = { provide: 'ep:i/webhooks/create', useClass: ep___i_webhooks_create.default };
const $i_webhooks_list: Provider = { provide: 'ep:i/webhooks/list', useClass: ep___i_webhooks_list.default };
const $i_webhooks_show: Provider = { provide: 'ep:i/webhooks/show', useClass: ep___i_webhooks_show.default };
const $i_webhooks_update: Provider = { provide: 'ep:i/webhooks/update', useClass: ep___i_webhooks_update.default };
const $i_webhooks_delete: Provider = { provide: 'ep:i/webhooks/delete', useClass: ep___i_webhooks_delete.default };
const $invite_create: Provider = { provide: 'ep:invite/create', useClass: ep___invite_create.default };
const $invite_delete: Provider = { provide: 'ep:invite/delete', useClass: ep___invite_delete.default };
const $invite_list: Provider = { provide: 'ep:invite/list', useClass: ep___invite_list.default };
const $invite_limit: Provider = { provide: 'ep:invite/limit', useClass: ep___invite_limit.default };
const $meta: Provider = { provide: 'ep:meta', useClass: ep___meta.default };
const $emojis: Provider = { provide: 'ep:emojis', useClass: ep___emojis.default };
const $emoji: Provider = { provide: 'ep:emoji', useClass: ep___emoji.default };
const $miauth_genToken: Provider = { provide: 'ep:miauth/gen-token', useClass: ep___miauth_genToken.default };
const $mute_create: Provider = { provide: 'ep:mute/create', useClass: ep___mute_create.default };
const $mute_delete: Provider = { provide: 'ep:mute/delete', useClass: ep___mute_delete.default };
const $mute_list: Provider = { provide: 'ep:mute/list', useClass: ep___mute_list.default };
const $renoteMute_create: Provider = { provide: 'ep:renote-mute/create', useClass: ep___renoteMute_create.default };
const $renoteMute_delete: Provider = { provide: 'ep:renote-mute/delete', useClass: ep___renoteMute_delete.default };
const $renoteMute_list: Provider = { provide: 'ep:renote-mute/list', useClass: ep___renoteMute_list.default };
const $my_apps: Provider = { provide: 'ep:my/apps', useClass: ep___my_apps.default };
const $notes: Provider = { provide: 'ep:notes', useClass: ep___notes.default };
const $notes_children: Provider = { provide: 'ep:notes/children', useClass: ep___notes_children.default };
const $notes_clips: Provider = { provide: 'ep:notes/clips', useClass: ep___notes_clips.default };
const $notes_conversation: Provider = { provide: 'ep:notes/conversation', useClass: ep___notes_conversation.default };
const $notes_create: Provider = { provide: 'ep:notes/create', useClass: ep___notes_create.default };
const $notes_delete: Provider = { provide: 'ep:notes/delete', useClass: ep___notes_delete.default };
const $notes_favorites_create: Provider = { provide: 'ep:notes/favorites/create', useClass: ep___notes_favorites_create.default };
const $notes_favorites_delete: Provider = { provide: 'ep:notes/favorites/delete', useClass: ep___notes_favorites_delete.default };
const $notes_featured: Provider = { provide: 'ep:notes/featured', useClass: ep___notes_featured.default };
const $notes_globalTimeline: Provider = { provide: 'ep:notes/global-timeline', useClass: ep___notes_globalTimeline.default };
const $notes_hybridTimeline: Provider = { provide: 'ep:notes/hybrid-timeline', useClass: ep___notes_hybridTimeline.default };
const $notes_localTimeline: Provider = { provide: 'ep:notes/local-timeline', useClass: ep___notes_localTimeline.default };
const $notes_mentions: Provider = { provide: 'ep:notes/mentions', useClass: ep___notes_mentions.default };
const $notes_polls_recommendation: Provider = { provide: 'ep:notes/polls/recommendation', useClass: ep___notes_polls_recommendation.default };
const $notes_polls_vote: Provider = { provide: 'ep:notes/polls/vote', useClass: ep___notes_polls_vote.default };
const $notes_reactions: Provider = { provide: 'ep:notes/reactions', useClass: ep___notes_reactions.default };
const $notes_reactions_create: Provider = { provide: 'ep:notes/reactions/create', useClass: ep___notes_reactions_create.default };
const $notes_reactions_delete: Provider = { provide: 'ep:notes/reactions/delete', useClass: ep___notes_reactions_delete.default };
const $notes_renotes: Provider = { provide: 'ep:notes/renotes', useClass: ep___notes_renotes.default };
const $notes_replies: Provider = { provide: 'ep:notes/replies', useClass: ep___notes_replies.default };
const $notes_searchByTag: Provider = { provide: 'ep:notes/search-by-tag', useClass: ep___notes_searchByTag.default };
const $notes_search: Provider = { provide: 'ep:notes/search', useClass: ep___notes_search.default };
const $notes_show: Provider = { provide: 'ep:notes/show', useClass: ep___notes_show.default };
const $notes_state: Provider = { provide: 'ep:notes/state', useClass: ep___notes_state.default };
const $notes_threadMuting_create: Provider = { provide: 'ep:notes/thread-muting/create', useClass: ep___notes_threadMuting_create.default };
const $notes_threadMuting_delete: Provider = { provide: 'ep:notes/thread-muting/delete', useClass: ep___notes_threadMuting_delete.default };
const $notes_timeline: Provider = { provide: 'ep:notes/timeline', useClass: ep___notes_timeline.default };
const $notes_translate: Provider = { provide: 'ep:notes/translate', useClass: ep___notes_translate.default };
const $notes_unrenote: Provider = { provide: 'ep:notes/unrenote', useClass: ep___notes_unrenote.default };
const $notes_userListTimeline: Provider = { provide: 'ep:notes/user-list-timeline', useClass: ep___notes_userListTimeline.default };
const $notifications_create: Provider = { provide: 'ep:notifications/create', useClass: ep___notifications_create.default };
const $notifications_markAllAsRead: Provider = { provide: 'ep:notifications/mark-all-as-read', useClass: ep___notifications_markAllAsRead.default };
const $notifications_testNotification: Provider = { provide: 'ep:notifications/test-notification', useClass: ep___notifications_testNotification.default };
const $pagePush: Provider = { provide: 'ep:page-push', useClass: ep___pagePush.default };
const $pages_create: Provider = { provide: 'ep:pages/create', useClass: ep___pages_create.default };
const $pages_delete: Provider = { provide: 'ep:pages/delete', useClass: ep___pages_delete.default };
const $pages_featured: Provider = { provide: 'ep:pages/featured', useClass: ep___pages_featured.default };
const $pages_like: Provider = { provide: 'ep:pages/like', useClass: ep___pages_like.default };
const $pages_show: Provider = { provide: 'ep:pages/show', useClass: ep___pages_show.default };
const $pages_unlike: Provider = { provide: 'ep:pages/unlike', useClass: ep___pages_unlike.default };
const $pages_update: Provider = { provide: 'ep:pages/update', useClass: ep___pages_update.default };
const $flash_create: Provider = { provide: 'ep:flash/create', useClass: ep___flash_create.default };
const $flash_delete: Provider = { provide: 'ep:flash/delete', useClass: ep___flash_delete.default };
const $flash_featured: Provider = { provide: 'ep:flash/featured', useClass: ep___flash_featured.default };
const $flash_like: Provider = { provide: 'ep:flash/like', useClass: ep___flash_like.default };
const $flash_show: Provider = { provide: 'ep:flash/show', useClass: ep___flash_show.default };
const $flash_unlike: Provider = { provide: 'ep:flash/unlike', useClass: ep___flash_unlike.default };
const $flash_update: Provider = { provide: 'ep:flash/update', useClass: ep___flash_update.default };
const $flash_my: Provider = { provide: 'ep:flash/my', useClass: ep___flash_my.default };
const $flash_myLikes: Provider = { provide: 'ep:flash/my-likes', useClass: ep___flash_myLikes.default };
const $ping: Provider = { provide: 'ep:ping', useClass: ep___ping.default };
const $pinnedUsers: Provider = { provide: 'ep:pinned-users', useClass: ep___pinnedUsers.default };
const $promo_read: Provider = { provide: 'ep:promo/read', useClass: ep___promo_read.default };
const $roles_list: Provider = { provide: 'ep:roles/list', useClass: ep___roles_list.default };
const $roles_show: Provider = { provide: 'ep:roles/show', useClass: ep___roles_show.default };
const $roles_users: Provider = { provide: 'ep:roles/users', useClass: ep___roles_users.default };
const $roles_notes: Provider = { provide: 'ep:roles/notes', useClass: ep___roles_notes.default };
const $requestResetPassword: Provider = { provide: 'ep:request-reset-password', useClass: ep___requestResetPassword.default };
const $resetDb: Provider = { provide: 'ep:reset-db', useClass: ep___resetDb.default };
const $resetPassword: Provider = { provide: 'ep:reset-password', useClass: ep___resetPassword.default };
const $serverInfo: Provider = { provide: 'ep:server-info', useClass: ep___serverInfo.default };
const $stats: Provider = { provide: 'ep:stats', useClass: ep___stats.default };
const $sw_show_registration: Provider = { provide: 'ep:sw/show-registration', useClass: ep___sw_show_registration.default };
const $sw_update_registration: Provider = { provide: 'ep:sw/update-registration', useClass: ep___sw_update_registration.default };
const $sw_register: Provider = { provide: 'ep:sw/register', useClass: ep___sw_register.default };
const $sw_unregister: Provider = { provide: 'ep:sw/unregister', useClass: ep___sw_unregister.default };
const $test: Provider = { provide: 'ep:test', useClass: ep___test.default };
const $username_available: Provider = { provide: 'ep:username/available', useClass: ep___username_available.default };
const $users: Provider = { provide: 'ep:users', useClass: ep___users.default };
const $users_clips: Provider = { provide: 'ep:users/clips', useClass: ep___users_clips.default };
const $users_followers: Provider = { provide: 'ep:users/followers', useClass: ep___users_followers.default };
const $users_following: Provider = { provide: 'ep:users/following', useClass: ep___users_following.default };
const $users_gallery_posts: Provider = { provide: 'ep:users/gallery/posts', useClass: ep___users_gallery_posts.default };
const $users_getFrequentlyRepliedUsers: Provider = { provide: 'ep:users/get-frequently-replied-users', useClass: ep___users_getFrequentlyRepliedUsers.default };
const $users_featuredNotes: Provider = { provide: 'ep:users/featured-notes', useClass: ep___users_featuredNotes.default };
const $users_lists_create: Provider = { provide: 'ep:users/lists/create', useClass: ep___users_lists_create.default };
const $users_lists_delete: Provider = { provide: 'ep:users/lists/delete', useClass: ep___users_lists_delete.default };
const $users_lists_list: Provider = { provide: 'ep:users/lists/list', useClass: ep___users_lists_list.default };
const $users_lists_pull: Provider = { provide: 'ep:users/lists/pull', useClass: ep___users_lists_pull.default };
const $users_lists_push: Provider = { provide: 'ep:users/lists/push', useClass: ep___users_lists_push.default };
const $users_lists_show: Provider = { provide: 'ep:users/lists/show', useClass: ep___users_lists_show.default };
const $users_lists_update: Provider = { provide: 'ep:users/lists/update', useClass: ep___users_lists_update.default };
const $users_lists_favorite: Provider = { provide: 'ep:users/lists/favorite', useClass: ep___users_lists_favorite.default };
const $users_lists_unfavorite: Provider = { provide: 'ep:users/lists/unfavorite', useClass: ep___users_lists_unfavorite.default };
const $users_lists_createFromPublic: Provider = { provide: 'ep:users/lists/create-from-public', useClass: ep___users_lists_createFromPublic.default };
const $users_lists_updateMembership: Provider = { provide: 'ep:users/lists/update-membership', useClass: ep___users_lists_updateMembership.default };
const $users_lists_getMemberships: Provider = { provide: 'ep:users/lists/get-memberships', useClass: ep___users_lists_getMemberships.default };
const $users_notes: Provider = { provide: 'ep:users/notes', useClass: ep___users_notes.default };
const $users_pages: Provider = { provide: 'ep:users/pages', useClass: ep___users_pages.default };
const $users_flashs: Provider = { provide: 'ep:users/flashs', useClass: ep___users_flashs.default };
const $users_reactions: Provider = { provide: 'ep:users/reactions', useClass: ep___users_reactions.default };
const $users_recommendation: Provider = { provide: 'ep:users/recommendation', useClass: ep___users_recommendation.default };
const $users_relation: Provider = { provide: 'ep:users/relation', useClass: ep___users_relation.default };
const $users_reportAbuse: Provider = { provide: 'ep:users/report-abuse', useClass: ep___users_reportAbuse.default };
const $users_searchByUsernameAndHost: Provider = { provide: 'ep:users/search-by-username-and-host', useClass: ep___users_searchByUsernameAndHost.default };
const $users_search: Provider = { provide: 'ep:users/search', useClass: ep___users_search.default };
const $users_show: Provider = { provide: 'ep:users/show', useClass: ep___users_show.default };
const $users_achievements: Provider = { provide: 'ep:users/achievements', useClass: ep___users_achievements.default };
const $users_updateMemo: Provider = { provide: 'ep:users/update-memo', useClass: ep___users_updateMemo.default };
const $fetchRss: Provider = { provide: 'ep:fetch-rss', useClass: ep___fetchRss.default };
const $fetchExternalResources: Provider = { provide: 'ep:fetch-external-resources', useClass: ep___fetchExternalResources.default };
const $retention: Provider = { provide: 'ep:retention', useClass: ep___retention.default };

@Module({
	imports: [
		CoreModule,
	],
	providers: [
		GetterService,
		ApiLoggerService,
		$admin_meta,
		$admin_abuseUserReports,
		$admin_accounts_create,
		$admin_accounts_delete,
		$admin_accounts_findByEmail,
		$admin_ad_create,
		$admin_ad_delete,
		$admin_ad_list,
		$admin_ad_update,
		$admin_announcements_create,
		$admin_announcements_delete,
		$admin_announcements_list,
		$admin_announcements_update,
		$admin_avatarDecorations_create,
		$admin_avatarDecorations_delete,
		$admin_avatarDecorations_list,
		$admin_avatarDecorations_update,
		$admin_deleteAllFilesOfAUser,
		$admin_unsetUserAvatar,
		$admin_unsetUserBanner,
		$admin_drive_cleanRemoteFiles,
		$admin_drive_cleanup,
		$admin_drive_files,
		$admin_drive_showFile,
		$admin_emoji_addAliasesBulk,
		$admin_emoji_add,
		$admin_emoji_copy,
		$admin_emoji_deleteBulk,
		$admin_emoji_delete,
		$admin_emoji_importZip,
		$admin_emoji_listRemote,
		$admin_emoji_list,
		$admin_emoji_removeAliasesBulk,
		$admin_emoji_setAliasesBulk,
		$admin_emoji_setCategoryBulk,
		$admin_emoji_setLicenseBulk,
		$admin_emoji_update,
		$admin_federation_deleteAllFiles,
		$admin_federation_refreshRemoteInstanceMetadata,
		$admin_federation_removeAllFollowing,
		$admin_federation_updateInstance,
		$admin_getIndexStats,
		$admin_getTableStats,
		$admin_getUserIps,
		$admin_invite_create,
		$admin_invite_list,
		$admin_promo_create,
		$admin_queue_clear,
		$admin_queue_deliverDelayed,
		$admin_queue_inboxDelayed,
		$admin_queue_promote,
		$admin_queue_stats,
		$admin_relays_add,
		$admin_relays_list,
		$admin_relays_remove,
		$admin_resetPassword,
		$admin_resolveAbuseUserReport,
		$admin_sendEmail,
		$admin_serverInfo,
		$admin_showModerationLogs,
		$admin_showUser,
		$admin_showUsers,
		$admin_suspendUser,
		$admin_unsuspendUser,
		$admin_updateMeta,
		$admin_deleteAccount,
		$admin_updateUserNote,
		$admin_roles_create,
		$admin_roles_delete,
		$admin_roles_list,
		$admin_roles_show,
		$admin_roles_update,
		$admin_roles_assign,
		$admin_roles_unassign,
		$admin_roles_updateDefaultPolicies,
		$admin_roles_users,
		$announcements,
		$antennas_create,
		$antennas_delete,
		$antennas_list,
		$antennas_notes,
		$antennas_show,
		$antennas_update,
		$ap_get,
		$ap_show,
		$app_create,
		$app_show,
		$auth_accept,
		$auth_session_generate,
		$auth_session_show,
		$auth_session_userkey,
		$blocking_create,
		$blocking_delete,
		$blocking_list,
		$channels_create,
		$channels_featured,
		$channels_follow,
		$channels_followed,
		$channels_owned,
		$channels_show,
		$channels_timeline,
		$channels_unfollow,
		$channels_update,
		$channels_favorite,
		$channels_unfavorite,
		$channels_myFavorites,
		$channels_search,
		$charts_activeUsers,
		$charts_apRequest,
		$charts_drive,
		$charts_federation,
		$charts_instance,
		$charts_notes,
		$charts_user_drive,
		$charts_user_following,
		$charts_user_notes,
		$charts_user_pv,
		$charts_user_reactions,
		$charts_users,
		$clips_addNote,
		$clips_removeNote,
		$clips_create,
		$clips_delete,
		$clips_list,
		$clips_notes,
		$clips_show,
		$clips_update,
		$clips_favorite,
		$clips_unfavorite,
		$clips_myFavorites,
		$drive,
		$drive_files,
		$drive_files_attachedNotes,
		$drive_files_checkExistence,
		$drive_files_create,
		$drive_files_delete,
		$drive_files_findByHash,
		$drive_files_find,
		$drive_files_show,
		$drive_files_update,
		$drive_files_uploadFromUrl,
		$drive_folders,
		$drive_folders_create,
		$drive_folders_delete,
		$drive_folders_find,
		$drive_folders_show,
		$drive_folders_update,
		$drive_stream,
		$emailAddress_available,
		$endpoint,
		$endpoints,
		$exportCustomEmojis,
		$federation_followers,
		$federation_following,
		$federation_instances,
		$federation_showInstance,
		$federation_updateRemoteUser,
		$federation_users,
		$federation_stats,
		$following_create,
		$following_delete,
		$following_update,
		$following_update_all,
		$following_invalidate,
		$following_requests_accept,
		$following_requests_cancel,
		$following_requests_list,
		$following_requests_reject,
		$gallery_featured,
		$gallery_popular,
		$gallery_posts,
		$gallery_posts_create,
		$gallery_posts_delete,
		$gallery_posts_like,
		$gallery_posts_show,
		$gallery_posts_unlike,
		$gallery_posts_update,
		$getOnlineUsersCount,
		$getAvatarDecorations,
		$hashtags_list,
		$hashtags_search,
		$hashtags_show,
		$hashtags_trend,
		$hashtags_users,
		$i,
		$i_2fa_done,
		$i_2fa_keyDone,
		$i_2fa_passwordLess,
		$i_2fa_registerKey,
		$i_2fa_register,
		$i_2fa_updateKey,
		$i_2fa_removeKey,
		$i_2fa_unregister,
		$i_apps,
		$i_authorizedApps,
		$i_claimAchievement,
		$i_changePassword,
		$i_deleteAccount,
		$i_exportBlocking,
		$i_exportFollowing,
		$i_exportMute,
		$i_exportNotes,
		$i_exportFavorites,
		$i_exportUserLists,
		$i_exportAntennas,
		$i_favorites,
		$i_gallery_likes,
		$i_gallery_posts,
		$i_importBlocking,
		$i_importFollowing,
		$i_importMuting,
		$i_importUserLists,
		$i_importAntennas,
		$i_notifications,
		$i_notificationsGrouped,
		$i_pageLikes,
		$i_pages,
		$i_pin,
		$i_readAllUnreadNotes,
		$i_readAnnouncement,
		$i_regenerateToken,
		$i_registry_getAll,
		$i_registry_getDetail,
		$i_registry_get,
		$i_registry_keysWithType,
		$i_registry_keys,
		$i_registry_remove,
		$i_registry_scopesWithDomain,
		$i_registry_set,
		$i_revokeToken,
		$i_signinHistory,
		$i_unpin,
		$i_updateEmail,
		$i_update,
		$i_move,
		$i_webhooks_create,
		$i_webhooks_list,
		$i_webhooks_show,
		$i_webhooks_update,
		$i_webhooks_delete,
		$invite_create,
		$invite_delete,
		$invite_list,
		$invite_limit,
		$meta,
		$emojis,
		$emoji,
		$miauth_genToken,
		$mute_create,
		$mute_delete,
		$mute_list,
		$renoteMute_create,
		$renoteMute_delete,
		$renoteMute_list,
		$my_apps,
		$notes,
		$notes_children,
		$notes_clips,
		$notes_conversation,
		$notes_create,
		$notes_delete,
		$notes_favorites_create,
		$notes_favorites_delete,
		$notes_featured,
		$notes_globalTimeline,
		$notes_hybridTimeline,
		$notes_localTimeline,
		$notes_mentions,
		$notes_polls_recommendation,
		$notes_polls_vote,
		$notes_reactions,
		$notes_reactions_create,
		$notes_reactions_delete,
		$notes_renotes,
		$notes_replies,
		$notes_searchByTag,
		$notes_search,
		$notes_show,
		$notes_state,
		$notes_threadMuting_create,
		$notes_threadMuting_delete,
		$notes_timeline,
		$notes_translate,
		$notes_unrenote,
		$notes_userListTimeline,
		$notifications_create,
		$notifications_markAllAsRead,
		$notifications_testNotification,
		$pagePush,
		$pages_create,
		$pages_delete,
		$pages_featured,
		$pages_like,
		$pages_show,
		$pages_unlike,
		$pages_update,
		$flash_create,
		$flash_delete,
		$flash_featured,
		$flash_like,
		$flash_show,
		$flash_unlike,
		$flash_update,
		$flash_my,
		$flash_myLikes,
		$ping,
		$pinnedUsers,
		$promo_read,
		$roles_list,
		$roles_show,
		$roles_users,
		$roles_notes,
		$requestResetPassword,
		$resetDb,
		$resetPassword,
		$serverInfo,
		$stats,
		$sw_show_registration,
		$sw_update_registration,
		$sw_register,
		$sw_unregister,
		$test,
		$username_available,
		$users,
		$users_clips,
		$users_followers,
		$users_following,
		$users_gallery_posts,
		$users_getFrequentlyRepliedUsers,
		$users_featuredNotes,
		$users_lists_create,
		$users_lists_delete,
		$users_lists_list,
		$users_lists_pull,
		$users_lists_push,
		$users_lists_show,
		$users_lists_update,
		$users_lists_favorite,
		$users_lists_unfavorite,
		$users_lists_createFromPublic,
		$users_lists_updateMembership,
		$users_lists_getMemberships,
		$users_notes,
		$users_pages,
		$users_flashs,
		$users_reactions,
		$users_recommendation,
		$users_relation,
		$users_reportAbuse,
		$users_searchByUsernameAndHost,
		$users_search,
		$users_show,
		$users_achievements,
		$users_updateMemo,
		$fetchRss,
		$fetchExternalResources,
		$retention,
	],
	exports: [
		$admin_meta,
		$admin_abuseUserReports,
		$admin_accounts_create,
		$admin_accounts_delete,
		$admin_accounts_findByEmail,
		$admin_ad_create,
		$admin_ad_delete,
		$admin_ad_list,
		$admin_ad_update,
		$admin_announcements_create,
		$admin_announcements_delete,
		$admin_announcements_list,
		$admin_announcements_update,
		$admin_avatarDecorations_create,
		$admin_avatarDecorations_delete,
		$admin_avatarDecorations_list,
		$admin_avatarDecorations_update,
		$admin_deleteAllFilesOfAUser,
		$admin_unsetUserAvatar,
		$admin_unsetUserBanner,
		$admin_drive_cleanRemoteFiles,
		$admin_drive_cleanup,
		$admin_drive_files,
		$admin_drive_showFile,
		$admin_emoji_addAliasesBulk,
		$admin_emoji_add,
		$admin_emoji_copy,
		$admin_emoji_deleteBulk,
		$admin_emoji_delete,
		$admin_emoji_importZip,
		$admin_emoji_listRemote,
		$admin_emoji_list,
		$admin_emoji_removeAliasesBulk,
		$admin_emoji_setAliasesBulk,
		$admin_emoji_setCategoryBulk,
		$admin_emoji_setLicenseBulk,
		$admin_emoji_update,
		$admin_federation_deleteAllFiles,
		$admin_federation_refreshRemoteInstanceMetadata,
		$admin_federation_removeAllFollowing,
		$admin_federation_updateInstance,
		$admin_getIndexStats,
		$admin_getTableStats,
		$admin_getUserIps,
		$admin_invite_create,
		$admin_invite_list,
		$admin_promo_create,
		$admin_queue_clear,
		$admin_queue_deliverDelayed,
		$admin_queue_inboxDelayed,
		$admin_queue_promote,
		$admin_queue_stats,
		$admin_relays_add,
		$admin_relays_list,
		$admin_relays_remove,
		$admin_resetPassword,
		$admin_resolveAbuseUserReport,
		$admin_sendEmail,
		$admin_serverInfo,
		$admin_showModerationLogs,
		$admin_showUser,
		$admin_showUsers,
		$admin_suspendUser,
		$admin_unsuspendUser,
		$admin_updateMeta,
		$admin_deleteAccount,
		$admin_updateUserNote,
		$admin_roles_create,
		$admin_roles_delete,
		$admin_roles_list,
		$admin_roles_show,
		$admin_roles_update,
		$admin_roles_assign,
		$admin_roles_unassign,
		$admin_roles_updateDefaultPolicies,
		$admin_roles_users,
		$announcements,
		$antennas_create,
		$antennas_delete,
		$antennas_list,
		$antennas_notes,
		$antennas_show,
		$antennas_update,
		$ap_get,
		$ap_show,
		$app_create,
		$app_show,
		$auth_accept,
		$auth_session_generate,
		$auth_session_show,
		$auth_session_userkey,
		$blocking_create,
		$blocking_delete,
		$blocking_list,
		$channels_create,
		$channels_featured,
		$channels_follow,
		$channels_followed,
		$channels_owned,
		$channels_show,
		$channels_timeline,
		$channels_unfollow,
		$channels_update,
		$channels_favorite,
		$channels_unfavorite,
		$channels_myFavorites,
		$channels_search,
		$charts_activeUsers,
		$charts_apRequest,
		$charts_drive,
		$charts_federation,
		$charts_instance,
		$charts_notes,
		$charts_user_drive,
		$charts_user_following,
		$charts_user_notes,
		$charts_user_pv,
		$charts_user_reactions,
		$charts_users,
		$clips_addNote,
		$clips_removeNote,
		$clips_create,
		$clips_delete,
		$clips_list,
		$clips_notes,
		$clips_show,
		$clips_update,
		$clips_favorite,
		$clips_unfavorite,
		$clips_myFavorites,
		$drive,
		$drive_files,
		$drive_files_attachedNotes,
		$drive_files_checkExistence,
		$drive_files_create,
		$drive_files_delete,
		$drive_files_findByHash,
		$drive_files_find,
		$drive_files_show,
		$drive_files_update,
		$drive_files_uploadFromUrl,
		$drive_folders,
		$drive_folders_create,
		$drive_folders_delete,
		$drive_folders_find,
		$drive_folders_show,
		$drive_folders_update,
		$drive_stream,
		$emailAddress_available,
		$endpoint,
		$endpoints,
		$exportCustomEmojis,
		$federation_followers,
		$federation_following,
		$federation_instances,
		$federation_showInstance,
		$federation_updateRemoteUser,
		$federation_users,
		$federation_stats,
		$following_create,
		$following_delete,
		$following_update,
		$following_update_all,
		$following_invalidate,
		$following_requests_accept,
		$following_requests_cancel,
		$following_requests_list,
		$following_requests_reject,
		$gallery_featured,
		$gallery_popular,
		$gallery_posts,
		$gallery_posts_create,
		$gallery_posts_delete,
		$gallery_posts_like,
		$gallery_posts_show,
		$gallery_posts_unlike,
		$gallery_posts_update,
		$getOnlineUsersCount,
		$getAvatarDecorations,
		$hashtags_list,
		$hashtags_search,
		$hashtags_show,
		$hashtags_trend,
		$hashtags_users,
		$i,
		$i_2fa_done,
		$i_2fa_keyDone,
		$i_2fa_passwordLess,
		$i_2fa_registerKey,
		$i_2fa_register,
		$i_2fa_updateKey,
		$i_2fa_removeKey,
		$i_2fa_unregister,
		$i_apps,
		$i_authorizedApps,
		$i_claimAchievement,
		$i_changePassword,
		$i_deleteAccount,
		$i_exportBlocking,
		$i_exportFollowing,
		$i_exportMute,
		$i_exportNotes,
		$i_exportFavorites,
		$i_exportUserLists,
		$i_exportAntennas,
		$i_favorites,
		$i_gallery_likes,
		$i_gallery_posts,
		$i_importBlocking,
		$i_importFollowing,
		$i_importMuting,
		$i_importUserLists,
		$i_importAntennas,
		$i_notifications,
		$i_notificationsGrouped,
		$i_pageLikes,
		$i_pages,
		$i_pin,
		$i_readAllUnreadNotes,
		$i_readAnnouncement,
		$i_regenerateToken,
		$i_registry_getAll,
		$i_registry_getDetail,
		$i_registry_get,
		$i_registry_keysWithType,
		$i_registry_keys,
		$i_registry_remove,
		$i_registry_scopesWithDomain,
		$i_registry_set,
		$i_revokeToken,
		$i_signinHistory,
		$i_unpin,
		$i_updateEmail,
		$i_update,
		$i_move,
		$i_webhooks_create,
		$i_webhooks_list,
		$i_webhooks_show,
		$i_webhooks_update,
		$i_webhooks_delete,
		$invite_create,
		$invite_delete,
		$invite_list,
		$invite_limit,
		$meta,
		$emojis,
		$emoji,
		$miauth_genToken,
		$mute_create,
		$mute_delete,
		$mute_list,
		$renoteMute_create,
		$renoteMute_delete,
		$renoteMute_list,
		$my_apps,
		$notes,
		$notes_children,
		$notes_clips,
		$notes_conversation,
		$notes_create,
		$notes_delete,
		$notes_favorites_create,
		$notes_favorites_delete,
		$notes_featured,
		$notes_globalTimeline,
		$notes_hybridTimeline,
		$notes_localTimeline,
		$notes_mentions,
		$notes_polls_recommendation,
		$notes_polls_vote,
		$notes_reactions,
		$notes_reactions_create,
		$notes_reactions_delete,
		$notes_renotes,
		$notes_replies,
		$notes_searchByTag,
		$notes_search,
		$notes_show,
		$notes_state,
		$notes_threadMuting_create,
		$notes_threadMuting_delete,
		$notes_timeline,
		$notes_translate,
		$notes_unrenote,
		$notes_userListTimeline,
		$notifications_create,
		$notifications_markAllAsRead,
		$pagePush,
		$pages_create,
		$pages_delete,
		$pages_featured,
		$pages_like,
		$pages_show,
		$pages_unlike,
		$pages_update,
		$flash_create,
		$flash_delete,
		$flash_featured,
		$flash_like,
		$flash_show,
		$flash_unlike,
		$flash_update,
		$flash_my,
		$flash_myLikes,
		$ping,
		$pinnedUsers,
		$promo_read,
		$roles_list,
		$roles_show,
		$roles_users,
		$roles_notes,
		$requestResetPassword,
		$resetDb,
		$resetPassword,
		$serverInfo,
		$stats,
		$sw_register,
		$sw_unregister,
		$test,
		$username_available,
		$users,
		$users_clips,
		$users_followers,
		$users_following,
		$users_gallery_posts,
		$users_getFrequentlyRepliedUsers,
		$users_featuredNotes,
		$users_lists_create,
		$users_lists_delete,
		$users_lists_list,
		$users_lists_pull,
		$users_lists_push,
		$users_lists_show,
		$users_lists_update,
		$users_lists_favorite,
		$users_lists_unfavorite,
		$users_lists_createFromPublic,
		$users_lists_updateMembership,
		$users_lists_getMemberships,
		$users_notes,
		$users_pages,
		$users_flashs,
		$users_reactions,
		$users_recommendation,
		$users_relation,
		$users_reportAbuse,
		$users_searchByUsernameAndHost,
		$users_search,
		$users_show,
		$users_achievements,
		$users_updateMemo,
		$fetchRss,
		$fetchExternalResources,
		$retention,
	],
})
export class EndpointsModule {}
