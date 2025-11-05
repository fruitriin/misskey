<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>
	<MkSpacer :contentMax="800">
		<div :class="$style.root">
			<!-- 日時選択セクション -->
			<div v-if="!timeshiftActive" :class="$style.controls">
				<div :class="$style.dateTimeInputs">
					<MkInput v-model="selectedDate" type="date" :max="maxDate">
						<template #label>{{ i18n.ts._timemachine.selectDate }}</template>
					</MkInput>
					<MkInput v-model="selectedTime" type="time">
						<template #label>{{ i18n.ts._timemachine.selectTime }}</template>
					</MkInput>
				</div>

				<div :class="$style.buttonGroup">
					<MkButton primary rounded @click="startTimeshift">
						<i class="ti ti-player-play"></i> {{ i18n.ts._timemachine.startTimeshift }}
					</MkButton>
				</div>
			</div>

			<!-- タイムシフト再生コントロール -->
			<div v-if="timeshiftActive" :class="$style.timeshiftControls">
				<div :class="$style.timeshiftInfo">
					<div :class="$style.currentTime">
						{{ i18n.ts._timemachine.currentTime }}: {{ formatDateTime(currentSeekTime) }}
					</div>
					<div :class="$style.originalTime">
						{{ i18n.ts._timemachine.originalTime }}: {{ formatDateTime(targetDateTime) }}
					</div>
				</div>

				<div :class="$style.playbackControls">
					<MkButton v-if="!isPlaying" @click="togglePlayback">
						<i class="ti ti-player-play"></i> {{ i18n.ts._timemachine.play }}
					</MkButton>
					<MkButton v-else @click="togglePlayback">
						<i class="ti ti-player-pause"></i> {{ i18n.ts._timemachine.pause }}
					</MkButton>

					<MkSelect v-model="playbackSpeed" :class="$style.speedSelect">
						<template #label>{{ i18n.ts._timemachine.playbackSpeed }}</template>
						<option :value="1">1x</option>
						<option :value="2">2x</option>
						<option :value="5">5x</option>
						<option :value="10">10x</option>
						<option :value="30">30x</option>
						<option :value="60">60x</option>
					</MkSelect>

					<MkButton @click="stopTimeshift">
						<i class="ti ti-player-stop"></i> {{ i18n.ts._timemachine.stop }}
					</MkButton>
				</div>

				<div :class="$style.progress">
					<div :class="$style.progressBar">
						<div
							:class="$style.progressFill"
							:style="{ width: progressPercent + '%' }"
						></div>
					</div>
					<div :class="$style.progressText">
						{{ progressPercent.toFixed(1) }}%
					</div>
				</div>
			</div>

			<!-- タイムライン表示 -->
			<div v-if="paginatorKey" :class="$style.timeline">
				<MkNotesTimeline
					:key="paginatorKey"
					:paginator="paginator"
					:noGap="false"
				/>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import MkStickyContainer from '@/components/global/MkStickyContainer.vue';
import MkPageHeader from '@/components/MkPageHeader.vue';
import MkSpacer from '@/components/MkSpacer.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import { Paginator } from '@/utility/paginator.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/utility/page-metadata.js';
import { $i } from '@/i.js';

const tab = ref<string>('social');

// 日時選択
const now = new Date();
const selectedDate = ref(now.toISOString().split('T')[0]);
const selectedTime = ref('00:00');
const maxDate = now.toISOString().split('T')[0];

// タイムシフト状態
const timeshiftActive = ref(false);
const isPlaying = ref(false);
const playbackSpeed = ref(1);
const targetDateTime = ref(0);
const currentSeekTime = ref(0);
const seekStartTime = ref(0);
const realStartTime = ref(0);
const timeshiftInterval = ref<number | null>(null);
const paginatorKey = ref<string | null>(null);

// フェッチ済みのノート全体（時系列順）
const allFetchedNotes = ref<any[]>([]);
const fetchedUntilTime = ref(0);

// タイムライン再生の終了時刻（1時間後）
const TIMESHIFT_DURATION = 60 * 60 * 1000; // 1時間

// 進捗率の計算
const progressPercent = computed(() => {
	if (!timeshiftActive.value) return 0;
	const elapsed = currentSeekTime.value - targetDateTime.value;
	return Math.min((elapsed / TIMESHIFT_DURATION) * 100, 100);
});

// Paginator設定
const paginator = computed(() => {
	if (!paginatorKey.value) return null;

	return new Paginator('notes/hybrid-timeline', {
		limit: 30,
		params: {
			withFiles: false,
			withRenotes: true,
		},
		initialDate: targetDateTime.value,
	});
});

function formatDateTime(timestamp: number): string {
	if (!timestamp) return '';
	const date = new Date(timestamp);
	return date.toLocaleString('ja-JP', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

function startTimeshift() {
	// 選択された日時を取得
	const dateTimeStr = `${selectedDate.value}T${selectedTime.value}:00`;
	const selectedDateTime = new Date(dateTimeStr);

	if (isNaN(selectedDateTime.getTime())) {
		alert(i18n.ts._timemachine.invalidDateTime);
		return;
	}

	targetDateTime.value = selectedDateTime.getTime();
	currentSeekTime.value = targetDateTime.value;
	seekStartTime.value = targetDateTime.value;
	fetchedUntilTime.value = targetDateTime.value;

	timeshiftActive.value = true;
	paginatorKey.value = `timeshift-${Date.now()}`;

	// 自動再生開始
	setTimeout(() => {
		togglePlayback();
	}, 500);
}

function togglePlayback() {
	isPlaying.value = !isPlaying.value;

	if (isPlaying.value) {
		realStartTime.value = Date.now();
		seekStartTime.value = currentSeekTime.value;
		startTimeshiftPlayback();
	} else {
		stopTimeshiftPlayback();
	}
}

function startTimeshiftPlayback() {
	if (timeshiftInterval.value) {
		clearInterval(timeshiftInterval.value);
	}

	timeshiftInterval.value = window.setInterval(() => {
		if (!isPlaying.value) return;

		// 実際の経過時間 × 再生速度 = シーク時間の進み
		const realElapsed = Date.now() - realStartTime.value;
		const seekElapsed = realElapsed * playbackSpeed.value;
		currentSeekTime.value = seekStartTime.value + seekElapsed;

		// 終了判定（1時間経過）
		if (currentSeekTime.value >= targetDateTime.value + TIMESHIFT_DURATION) {
			currentSeekTime.value = targetDateTime.value + TIMESHIFT_DURATION;
			stopTimeshiftPlayback();
			isPlaying.value = false;
		}

		// 先読みフェッチ（現在時刻の10分先までフェッチ）
		const PREFETCH_AHEAD = 10 * 60 * 1000; // 10分
		if (currentSeekTime.value + PREFETCH_AHEAD > fetchedUntilTime.value) {
			// ここで追加のフェッチを行うロジックを入れる
			// 現在はPaginatorの自動フェッチに任せる
		}
	}, 100); // 100msごとに更新
}

function stopTimeshiftPlayback() {
	if (timeshiftInterval.value) {
		clearInterval(timeshiftInterval.value);
		timeshiftInterval.value = null;
	}
}

function stopTimeshift() {
	stopTimeshiftPlayback();
	isPlaying.value = false;
	timeshiftActive.value = false;
	paginatorKey.value = null;
	currentSeekTime.value = 0;
	allFetchedNotes.value = [];
	fetchedUntilTime.value = 0;
}

// 再生速度が変更されたら、シーク位置を再計算
watch(playbackSpeed, () => {
	if (isPlaying.value) {
		// 現在のシーク位置を保存して再スタート
		seekStartTime.value = currentSeekTime.value;
		realStartTime.value = Date.now();
	}
});

// コンポーネント破棄時にクリーンアップ
onUnmounted(() => {
	stopTimeshiftPlayback();
});

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts._timemachine.title,
	icon: 'ti ti-clock',
}));
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}

.controls {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	padding: 24px;
	margin-bottom: 16px;
}

.dateTimeInputs {
	display: flex;
	gap: 16px;
	margin-bottom: 16px;

	> * {
		flex: 1;
	}
}

.buttonGroup {
	display: flex;
	gap: 12px;
	justify-content: center;
}

.timeshiftControls {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	padding: 24px;
	margin-bottom: 16px;
}

.timeshiftInfo {
	margin-bottom: 16px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.currentTime {
	font-size: 1.1em;
	font-weight: bold;
	margin-bottom: 8px;
	color: var(--MI_THEME-accent);
}

.originalTime {
	font-size: 0.9em;
	opacity: 0.7;
}

.playbackControls {
	display: flex;
	gap: 12px;
	align-items: flex-end;
	margin-bottom: 16px;
}

.speedSelect {
	flex: 0 0 120px;
}

.progress {
	margin-top: 16px;
}

.progressBar {
	width: 100%;
	height: 8px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 4px;
	overflow: hidden;
	margin-bottom: 8px;
}

.progressFill {
	height: 100%;
	background: var(--MI_THEME-accent);
	transition: width 0.1s linear;
}

.progressText {
	text-align: center;
	font-size: 0.9em;
	opacity: 0.7;
}

.timeline {
	margin-top: 16px;
}
</style>
