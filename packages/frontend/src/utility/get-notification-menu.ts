/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { InjectionKey } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import { timemachineAvailable } from '@/utility/check-permissions.js';
import { formatTimestamp } from '@/utility/timemachine-format.js';

/**
 * 通知の一覧の中のノート (メンション・返信・引用) のメニューに、通知の項目を足すための provide のキー。
 * noteId のノートのメニューにだけ足す (引用先や Renote 先のノートには足さない)
 */
export const notificationNoteMenuKey: InjectionKey<{
	noteId: string;
	getItems: () => MenuItem[];
}> = Symbol('notificationNoteMenu');

/** 通知を消すときの API の引数。まとめた通知は元の通知の ID を持たないので、種類・ノート・ユーザーで指定する */
export function getDeleteNotificationParams(notification: Misskey.entities.Notification): Misskey.entities.NotificationsDeleteRequest | null {
	if (notification.type === 'reaction:grouped') {
		return {
			group: {
				type: 'reaction',
				noteId: notification.note.id,
				userIds: [...new Set(notification.reactions.map(r => r.user.id))],
			},
		};
	}
	if (notification.type === 'renote:grouped') {
		return {
			group: {
				type: 'renote',
				// まとめた Renote の note は Renote そのものなので、Renote されたノートで指定する
				noteId: notification.note.renoteId ?? notification.note.id,
				userIds: [...new Set(notification.users.map(u => u.id))],
			},
		};
	}
	if (notification.id === '') return null;
	return { notificationIds: [notification.id] };
}

/**
 * 通知のメニュー。通知の時刻をタイムマシンで見る項目と、通知を消す項目を返す。
 * @param onDeleted 消したあとに呼ぶ (一覧から取り除くため)
 */
export function getNotificationMenu(notification: Misskey.entities.Notification, opts: {
	router: ReturnType<typeof useRouter>;
	onDeleted?: () => void;
	withTimemachine?: boolean;
}): MenuItem[] {
	const items: MenuItem[] = [];

	if ((opts.withTimemachine ?? true) && timemachineAvailable) {
		// ノートのメニューと同じく 1 分後の時刻へ移動し、その時刻の出来事が画面に入るようにする
		const timestamp = new Date(notification.createdAt).getTime() + 60000;
		const timemachinePath = `/timemachine?goto=${formatTimestamp(timestamp, 'goto')}`;
		items.push({
			type: 'parent',
			icon: 'ti ti-clock-bolt',
			text: i18n.ts.jumpToTimemachine,
			children: [{
				icon: 'ti ti-app-window',
				text: i18n.ts.openInWindow,
				action: () => {
					os.pageWindow(timemachinePath);
				},
			}, {
				icon: 'ti ti-player-eject',
				text: i18n.ts.showInPage,
				action: () => {
					opts.router.pushByPath(timemachinePath, 'forcePage');
				},
			}],
		});
	}

	const params = getDeleteNotificationParams(notification);
	if (params != null) {
		items.push({
			icon: 'ti ti-trash',
			text: i18n.ts.deleteNotification,
			danger: true,
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					text: i18n.ts.deleteNotificationConfirm,
				});
				if (canceled) return;
				await os.apiWithDialog('notifications/delete', params);
				opts.onDeleted?.();
			},
		});
	}

	return items;
}
