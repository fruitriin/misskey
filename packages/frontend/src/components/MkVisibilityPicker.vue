<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type }" :zPriority="'high'" :src="src" @click="modal.close()" @closed="emit('closed')">
	<div class="_popup" :class="{ [$style.root]: true, [$style.asDrawer]: type === 'drawer' }">
		<div :class="[$style.label, $style.item]">
			{{ i18n.ts.visibility }}
		</div>
		<button key="public" :disabled="actualDisablePublic" class="_button" :class="[$style.item, { [$style.active]: v === 'public' &&!currentChannel }]" data-index="1" @click="choose('public')">
			<div :class="$style.icon"><i class="ti ti-world"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.public }}</span>
				<span :class="$style.itemDescription">{{ i18n.ts._visibility.publicDescription }}</span>
			</div>
		</button>
		<button key="home" :disabled="actualDisableHome" class="_button" :class="[$style.item, { [$style.active]: v === 'home' && !currentChannel }]" data-index="2" @click="choose('home')">
			<div :class="$style.icon"><i class="ti ti-home"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.home }}</span>
				<span :class="$style.itemDescription">{{ i18n.ts._visibility.homeDescription }}</span>
			</div>
		</button>
		<button key="followers" :disabled="actualDisableFollowers" class="_button" :class="[$style.item, { [$style.active]: v === 'followers' && !currentChannel }]" data-index="3" @click="choose('followers')">
			<div :class="$style.icon"><i class="ti ti-lock"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.followers }}</span>
				<span :class="$style.itemDescription">{{ i18n.ts._visibility.followersDescription }}</span>
			</div>
		</button>
		<button key="specified" :disabled="actualDisableSpecified" class="_button" :class="[$style.item, { [$style.active]: v === 'specified' && !currentChannel }]" data-index="4" @click="choose('specified')">
			<div :class="$style.icon"><i class="ti ti-mail"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.specified }}</span>
				<span :class="$style.itemDescription">{{ i18n.ts._visibility.specifiedDescription }}</span>
			</div>
		</button>
		<button ref="channelsButton" :disabled="actualDisableChannel" class="_button" :class="[$style.item, { [$style.active]: currentChannel }]" data-index="5" @click="chooseChannel">
			<div :class="$style.channelWrapper" :style="[currentChannel ? {borderLeftColor: `${currentChannel.color}`} : {}]">
				<div :class="$style.icon">
					<i class="ti ti-device-tv"></i>
				</div>
				<div :class="$style.body">
					<span :class="$style.itemTitle">{{ i18n.ts._visibility.channel }}</span>
					<span :class="$style.itemDescription">
						<span v-if="currentChannelName">{{ i18n.t('_visibility.channelSelected', { name: currentChannelName }) }}</span>
						<span v-else>{{ i18n.ts._visibility.channelDescription }}</span>
					</span>
				</div>
			</div>
		</button>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { api } from '@/scripts/api.js';
import { calcVisibilityRange, NoteVisibilityWeight } from '@/scripts/note-visibility-utils.js';

const props = withDefaults(defineProps<{
	currentVisibility: typeof Misskey.noteVisibilities[number];
	disablePublic: boolean;
	disableSpecified: boolean;
	src?: HTMLElement;
  currentChannel?: Misskey.entities.Channel,
	reply?: Misskey.entities.Note;
	renote?: Misskey.entities.Note;
}>(), {
});

const emit = defineEmits<{
	(ev: 'changeVisibility', v: typeof Misskey.noteVisibilities[number]): void;
  (ev: 'changeChannel', v: Misskey.entities.Channel) : void
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();
const channelsButton = shallowRef<InstanceType<typeof HTMLButtonElement>>();

const actualDisablePublic = computed<boolean>(() => props.disablePublic || calcDisabled(NoteVisibilityWeight.PUBLIC));
const actualDisableHome = computed<boolean>(() => calcDisabled(NoteVisibilityWeight.HOME));
const actualDisableFollowers = computed<boolean>(() => calcDisabled(NoteVisibilityWeight.FOLLOWERS));
const actualDisableSpecified = computed<boolean>(() => props.disableSpecified || calcDisabled(NoteVisibilityWeight.SPECIFIED));
const actualDisableChannel = computed<boolean>(() => {
	const reply = props.reply;
	if (reply) {
		// リプライの場合
		if (!reply.channelId) {
			// リプライ先がチャンネル外だったら非活性
			return true;
		} else if (reply.channelId !== currentChannel.value?.id) {
			// リプライ先が選択中のチャンネル以外だったら非活性
			return true;
		}
	}

	return false;
});

const v = ref<typeof Misskey.noteVisibilities[number]>(props.currentVisibility);

const channels = ref<Misskey.entities.Channel[]>([]);
const currentChannel = ref<Misskey.entities.Channel | undefined>(props.currentChannel);
const currentChannelName = computed<string | null>(() => currentChannel.value?.name ?? null);

function calcDisabled(weight: NoteVisibilityWeight): boolean {
	const reply = props.reply;
	const renote = props.renote;

	if (reply?.channelId) {
		// リプライがチャンネルの場合はチャンネル固定としたいので非活性
		return true;
	}

	if (renote?.channel && !renote.channel.allowRenoteToExternal) {
		// チャンネルの外部公開制限がある場合はチャンネル固定としたいので非活性
		return true;
	}

	const calcWeight = calcVisibilityRange({ reply, renote });
	if (weight < calcWeight) {
		// 要求された公開範囲の重みとリプライ・リノートから取り出された重みが釣り合わない場合は非活性
		return true;
	}

	return false;
}

async function fetchChannels() {
	const res = await api('channels/my-favorites', {
		limit: 100,
	});
	channels.value.splice(0, 0, ...res);
}

async function chooseChannel() {
	let selectedChannel: Misskey.entities.Channel | null = null;
	await os.popupMenu(
		channels.value.map(it => ({ type: 'button', text: it.name, action: (_) => selectedChannel = it })),
		channelsButton.value,
	);

	if (selectedChannel) {
		emit('changeChannel', selectedChannel);
	}

	await nextTick();
	if (modal.value) modal.value.close();
}

function choose(visibility: typeof Misskey.noteVisibilities[number]): void {
	v.value = visibility;
	emit('changeVisibility', visibility);
	nextTick(() => {
		if (modal.value) modal.value.close();
	});
}

fetchChannels();
</script>

<style lang="scss" module>
.root {
	min-width: 240px;
	padding: 8px 0;

	&.asDrawer {
		padding: 12px 0 max(env(safe-area-inset-bottom, 0px), 12px) 0;
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		.label {
			pointer-events: none;
			font-size: 12px;
			padding-bottom: 4px;
			opacity: 0.7;
		}

		.item {
			font-size: 14px;
			padding: 10px 24px;
		}
	}
}

.label {
	pointer-events: none;
	font-size: 10px;
	padding-bottom: 4px;
	opacity: 0.7;
}

.item {
	display: flex;
	padding: 8px 14px;
	font-size: 12px;
	text-align: left;
	width: 100%;
	box-sizing: border-box;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	&:active {
		background: rgba(0, 0, 0, 0.1);
	}

	&.active {
		color: var(--accent);
	}
}

.icon {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: 10px;
	width: 16px;
	top: 0;
	bottom: 0;
	margin-top: auto;
	margin-bottom: auto;
}

.body {
	flex: 1 1 auto;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.itemTitle {
	display: block;
	font-weight: bold;
}

.itemDescription {
	opacity: 0.6;
}

.channelWrapper {
	display: flex;
	margin-left: -6px;
	padding-left: 4px;
	border-left-width: 2px;
	border-left-style: solid;
	border-left-color: transparent;
}
</style>
