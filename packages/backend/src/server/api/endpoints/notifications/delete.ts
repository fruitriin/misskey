/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { MiNotification } from '@/models/Notification.js';

// MISTEMS: 通知を個別に消す (スパムのユーザーからの通知を消す用途)。
// 通知は Redis のストリーム (notificationTimeline:<userId>) に入っているので、当てはまるエントリを XDEL で消す。
// まとめた通知 (reaction:grouped / renote:grouped) は元の通知の ID を持たないので、種類・ノート・ユーザーで指定する。
// まとめ表示は連続した通知だけをまとめるが、group ではストリーム全体から同じ組み合わせの通知を消す (スパム対策としてまとめて消す)。
// ほかのタブや端末の通知の一覧には知らせない (読み込み直すまで残る)
export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',

	limit: {
		duration: 1000 * 60 * 60,
		max: 600,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			deletedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	anyOf: [
		{
			type: 'object',
			properties: {
				notificationIds: {
					type: 'array',
					minItems: 1,
					maxItems: 100,
					uniqueItems: true,
					items: { type: 'string', format: 'misskey:id' },
				},
			},
			required: ['notificationIds'],
		},
		{
			type: 'object',
			properties: {
				group: {
					type: 'object',
					description: 'Delete the notifications that were grouped. For `reaction`, `noteId` is the reacted note. For `renote`, `noteId` is the renoted note.',
					properties: {
						type: { type: 'string', enum: ['reaction', 'renote'] },
						noteId: { type: 'string', format: 'misskey:id' },
						userIds: {
							type: 'array',
							minItems: 1,
							maxItems: 100,
							uniqueItems: true,
							items: { type: 'string', format: 'misskey:id' },
						},
					},
					required: ['type', 'noteId', 'userIds'],
				},
			},
			required: ['group'],
		},
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
		super(meta, paramDef, async (ps, me) => {
			const key = `notificationTimeline:${me.id}`;
			const notificationIds = new Set('notificationIds' in ps ? ps.notificationIds : []);
			const group = 'group' in ps ? ps.group : undefined;
			const groupUserIds = new Set(group?.userIds ?? []);

			const matchesGroup = (notification: MiNotification): boolean => {
				if (group == null || notification.type !== group.type) return false;
				if (!('notifierId' in notification) || !groupUserIds.has(notification.notifierId)) return false;
				if (notification.type === 'reaction') return notification.noteId === group.noteId;
				if (notification.type === 'renote') return notification.targetNoteId === group.noteId;
				return false;
			};

			// ストリームの長さは perUserNotificationsMaxCount (既定 500) 程度に保たれているので、全体を読んでよい
			const entries = await this.redisClient.xrange(key, '-', '+');
			const streamIds: string[] = [];
			for (const [streamId, fields] of entries) {
				let notification: MiNotification;
				try {
					notification = JSON.parse(fields[1]) as MiNotification;
				} catch {
					continue;
				}
				if (notificationIds.has(notification.id) || matchesGroup(notification)) {
					streamIds.push(streamId);
				}
			}

			if (streamIds.length === 0) return { deletedCount: 0 };

			// 既読の位置 (latestReadNotification) のエントリを消すと、未読数の数え方 (UserEntityService.getNotificationsInfo) がずれる。
			// 消さずに残るエントリのうち、それより古い最も新しいものへ既読の位置を移す
			const latestReadKey = `latestReadNotification:${me.id}`;
			const latestRead = await this.redisClient.get(latestReadKey);
			const deleting = new Set(streamIds);
			if (latestRead != null && deleting.has(latestRead)) {
				const olderRemaining = entries.map(([streamId]) => streamId).filter(streamId => !deleting.has(streamId) && this.compareStreamIds(streamId, latestRead) < 0).at(-1);
				// 古いものが残っていなければ、ストリームの先頭より前を指す (残ったものはすべて未読になる)
				await this.redisClient.set(latestReadKey, olderRemaining ?? '0-1');
			}

			const deletedCount = await this.redisClient.xdel(key, ...streamIds);
			return { deletedCount };
		});
	}

	private compareStreamIds(a: string, b: string): number {
		const [aMs, aSeq] = a.split('-').map(x => BigInt(x));
		const [bMs, bSeq] = b.split('-').map(x => BigInt(x));
		if (aMs !== bMs) return aMs < bMs ? -1 : 1;
		if (aSeq !== bSeq) return aSeq < bSeq ? -1 : 1;
		return 0;
	}
}
