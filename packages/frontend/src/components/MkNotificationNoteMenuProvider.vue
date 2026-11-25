<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
通知の一覧の中のノート (メンション・返信・引用) のメニューに、通知の項目 (通知の削除) を足す。
描画を持たず provide するだけの部品なので、Storybook のストーリーは置かない
-->
<template>
<slot></slot>
</template>

<script lang="ts" setup>
import { provide } from 'vue';
import * as Misskey from 'misskey-js';
import { useRouter } from '@/router.js';
import { getNotificationMenu, notificationNoteMenuKey } from '@/utility/get-notification-menu.js';

const props = defineProps<{
	notification: Misskey.entities.Notification;
	noteId: string;
}>();

const emit = defineEmits<{
	(ev: 'deleted'): void;
}>();

const router = useRouter();

provide(notificationNoteMenuKey, {
	get noteId() {
		return props.noteId;
	},
	// ノートのメニューにはノートの時刻へのタイムマシンがすでにあるので、通知の削除だけを足す
	getItems: () => getNotificationMenu(props.notification, {
		router,
		withTimemachine: false,
		onDeleted: () => emit('deleted'),
	}),
});
</script>
