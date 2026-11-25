/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, describe, test } from 'vitest';
import * as Misskey from 'misskey-js';
import { getDeleteNotificationParams } from '@/utility/get-notification-menu.js';

const user = (id: string) => ({ id }) as Misskey.entities.UserLite;

describe('通知を消すときの API の引数', () => {
	test('ふつうの通知は ID で指定する', () => {
		const notification = { id: 'n1', type: 'follow', createdAt: '', user: user('u1'), userId: 'u1' } as unknown as Misskey.entities.Notification;
		assert.deepStrictEqual(getDeleteNotificationParams(notification), { notificationIds: ['n1'] });
	});

	test('まとめたリアクションは、リアクションされたノートとユーザーで指定する (同じユーザーは 1 回)', () => {
		const notification = {
			id: 'g1', type: 'reaction:grouped', createdAt: '',
			note: { id: 'note1' },
			reactions: [{ user: user('u1'), reaction: '👍' }, { user: user('u2'), reaction: '❤' }, { user: user('u1'), reaction: '🎉' }],
		} as unknown as Misskey.entities.Notification;
		assert.deepStrictEqual(getDeleteNotificationParams(notification), {
			group: { type: 'reaction', noteId: 'note1', userIds: ['u1', 'u2'] },
		});
	});

	test('まとめた Renote は、Renote されたノートとユーザーで指定する', () => {
		const notification = {
			id: 'g2', type: 'renote:grouped', createdAt: '',
			note: { id: 'renote1', renoteId: 'note1' },
			users: [user('u1'), user('u2')],
		} as unknown as Misskey.entities.Notification;
		assert.deepStrictEqual(getDeleteNotificationParams(notification), {
			group: { type: 'renote', noteId: 'note1', userIds: ['u1', 'u2'] },
		});
	});

	test('ID のない通知は消せない', () => {
		const notification = { id: '', type: 'follow', createdAt: '' } as unknown as Misskey.entities.Notification;
		assert.isNull(getDeleteNotificationParams(notification));
	});
});
