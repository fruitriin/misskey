<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA
	:to="to"
	:behavior="behavior"
	:extraMenuItems="$i != null ? getMuteMenuItems : null"
	:class="{ [$style.iosLongPress]: longPressEnabled }"
	@touchstart.passive="onTouchstart"
	@touchmove.passive="onTouchmove"
	@touchend="onTouchend"
	@touchcancel.passive="onTouchcancel"
>
	<slot></slot>
</MkA>
</template>

<script lang="ts" setup>
import { computed, onUnmounted } from 'vue';
import type { MkABehavior } from '@/components/global/MkA.vue';
import type { MenuItem } from '@/types/menu.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { isIOS } from '@/utility/is-ios.js';

const props = defineProps<{
	to: string;
	/** 先頭の # を除いたタグ */
	hashtag: string;
	behavior?: MkABehavior;
}>();

type MuteKind = 'mutedWords' | 'hardMutedWords';

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

// ワードミュートは本文の文字列で判定する。ハッシュタグは大文字・小文字を区別しないので、
// 「# + タグ」のあとにタグの続き (文字・数字・_) が来ないものを、大文字・小文字を区別せずに探す正規表現で登録する。
// サーバーの RE2 は先読みに対応していないので、先読みを使わずに書く
function muteRegExp(): string {
	return `/#${escapeRegExp(props.hashtag)}(?:[^\\p{L}\\p{N}_]|$)/iu`;
}

function isMuted(words: (string | string[])[]): boolean {
	return words.some(w => w === muteRegExp());
}

async function mute(kind: MuteKind) {
	if ($i == null) return;
	const words = $i[kind];
	if (isMuted(words)) return;
	await os.apiWithDialog('i/update', { [kind]: [...words, muteRegExp()] });
}

function getMuteMenuItems(): MenuItem[] {
	if ($i == null) return [];
	const items: MenuItem[] = [{
		type: 'label',
		text: `#${props.hashtag}`,
	}];
	// すでにミュートしている種類は出さない
	if (!isMuted($i.mutedWords)) {
		items.push({ icon: 'ti ti-eye-off', text: i18n.ts.wordMute, action: () => mute('mutedWords') });
	}
	if (!isMuted($i.hardMutedWords)) {
		items.push({ icon: 'ti ti-message-off', text: i18n.ts.hardWordMute, action: () => mute('hardMutedWords') });
	}
	return items.length > 1 ? items : [];
}

//#region iOS の長押し
// iOS の WebKit はリンクを長押ししても contextmenu を出さず、OS のリンクのメニューを出す。
// ふつうのリンク (MkA) の挙動は変えず、ハッシュタグだけ長押しを自前で判定して、右クリックと同じメニューを開く
const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

// 右クリックで OS のメニューを出す設定 (contextMenu が app 以外) のときは、os.contextMenu がメニューを出さないので扱わない
const longPressEnabled = computed(() => (
	isIOS() &&
	prefer.r.contextMenu.value === 'app' &&
	!prefer.r['experimental.useNativeLinkMenuForHashtagOnIOS'].value
));

let longPressTimer: number | null = null;
let longPressed = false;
let startX = 0;
let startY = 0;
let releaseMouseTimer: number | null = null;
let blockingMousedown = false;

// iOS は長押しの途中 (指を離す前) に mousedown を送ってくる。
// メニューは外側の mousedown で閉じるので、長押しでメニューを開いてから指を離した少しあとまで、mousedown をメニューに届けない
const RELEASE_MOUSE_DELAY_MS = 400;

function blockMousedown(ev: MouseEvent) {
	ev.stopPropagation();
	ev.preventDefault();
}

function startBlockingMousedown() {
	if (releaseMouseTimer != null) {
		window.clearTimeout(releaseMouseTimer);
		releaseMouseTimer = null;
	}
	blockingMousedown = true;
	window.addEventListener('mousedown', blockMousedown, true);
}

function stopBlockingMousedown(delay = 0) {
	if (releaseMouseTimer != null) window.clearTimeout(releaseMouseTimer);
	releaseMouseTimer = window.setTimeout(() => {
		releaseMouseTimer = null;
		blockingMousedown = false;
		window.removeEventListener('mousedown', blockMousedown, true);
	}, delay);
}

function cancelLongPress() {
	if (longPressTimer != null) {
		window.clearTimeout(longPressTimer);
		longPressTimer = null;
	}
}

function onTouchstart(ev: TouchEvent) {
	cancelLongPress();
	// 2 本目の指では長押しを始めない (開いたメニューの後始末の状態も変えない)
	if (!longPressEnabled.value || ev.touches.length !== 1) return;
	longPressed = false;

	const target = ev.currentTarget;
	if (!(target instanceof HTMLElement)) return;
	startX = ev.touches[0].clientX;
	startY = ev.touches[0].clientY;

	longPressTimer = window.setTimeout(() => {
		longPressTimer = null;
		longPressed = true;
		startBlockingMousedown();
		// MkA の contextmenu の処理に渡して、右クリックと同じメニューを開く
		target.dispatchEvent(new PointerEvent('contextmenu', {
			bubbles: true,
			cancelable: true,
			clientX: startX,
			clientY: startY,
		}));
	}, LONG_PRESS_MS);
}

function onTouchmove(ev: TouchEvent) {
	const touch = ev.touches[0];
	if (touch == null) return;
	if (Math.hypot(touch.clientX - startX, touch.clientY - startY) > MOVE_TOLERANCE_PX) cancelLongPress();
}

function onTouchend(ev: TouchEvent) {
	cancelLongPress();
	if (longPressed) {
		// メニューを開いたあとに指を離したときの click (ページの移動) を止める
		ev.preventDefault();
		longPressed = false;
	}
	releaseMousedownWhenAllFingersUp(ev);
}

function onTouchcancel(ev: TouchEvent) {
	cancelLongPress();
	longPressed = false;
	releaseMousedownWhenAllFingersUp(ev);
}

function releaseMousedownWhenAllFingersUp(ev: TouchEvent) {
	if (blockingMousedown && ev.touches.length === 0) stopBlockingMousedown(RELEASE_MOUSE_DELAY_MS);
}

onUnmounted(() => {
	cancelLongPress();
	if (releaseMouseTimer != null) window.clearTimeout(releaseMouseTimer);
	blockingMousedown = false;
	window.removeEventListener('mousedown', blockMousedown, true);
});
//#endregion
</script>

<style lang="scss" module>
.iosLongPress {
	// OS のリンクのメニューと文字の選択を出さない
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	user-select: none;
}
</style>
