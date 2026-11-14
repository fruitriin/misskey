<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 歯抜けマーカーの動作確認用のワンショットのパネル。確認するときだけ cherry-pick し、終わったら revert する -->
<template>
<Teleport to="body">
	<div :class="$style.root" data-dev-gap-panel>
		<button class="_button" :class="$style.header" @click="opened = !opened">
			<i :class="opened ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> 歯抜けシナリオ (DEV)
		</button>
		<div v-if="opened" :class="$style.body">
			<div :class="$style.buttons">
				<button
					v-for="(s, i) in scenarios"
					:key="i"
					class="_button"
					:class="[$style.button, { [$style.current]: current === i }]"
					:disabled="running"
					@click="run(i)"
				>
					{{ s.label }}
				</button>
				<button class="_button" :class="[$style.button, $style.stop]" :disabled="running" @click="reset()">本物に戻す</button>
			</div>
			<div v-if="current != null" :class="$style.expected">{{ scenarios[current]!.expected }}</div>
			<ol :class="$style.log">
				<li v-for="(line, i) in logs" :key="i">{{ line }}</li>
			</ol>
		</div>
	</div>
</Teleport>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import { scenarios, stop, measureOnGapButtonClick, prepareCustom } from '@/utility/dev-timeline-gap-scenarios.js';
import type { ScenarioContext, PrepareOptions } from '@/utility/dev-timeline-gap-scenarios.js';

const props = defineProps<{
	channel: string;
	reload: () => Promise<void>;
	getRoot: () => HTMLElement | null;
	getScrollContainer: () => HTMLElement | null;
}>();

const opened = ref(true);
const running = ref(false);
const current = ref<number | null>(null);
const logs = ref<string[]>([]);

function log(text: string): void {
	logs.value.push(text);
}

const ctx: ScenarioContext = {
	channel: props.channel,
	reload: () => props.reload(),
	getRoot: () => props.getRoot(),
	getScrollContainer: () => props.getScrollContainer(),
	log,
};

const disposeMeasure = measureOnGapButtonClick(ctx, log);
onUnmounted(disposeMeasure);

// 自動テスト (Playwright) から条件を指定して準備できるようにする
(window as unknown as { __gapDev?: unknown }).__gapDev = {
	prepare: (o: PrepareOptions) => prepareCustom(ctx, o),
	stop: () => stop(ctx),
};
onUnmounted(() => {
	delete (window as unknown as { __gapDev?: unknown }).__gapDev;
});

async function run(i: number): Promise<void> {
	running.value = true;
	current.value = i;
	logs.value = [];
	try {
		await scenarios[i]!.run(ctx);
	} catch (err) {
		log(`失敗: ${err instanceof Error ? err.message : String(err)}`);
	} finally {
		running.value = false;
	}
}

async function reset(): Promise<void> {
	running.value = true;
	current.value = null;
	logs.value = [];
	await stop(ctx);
	running.value = false;
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	right: 12px;
	bottom: 12px;
	z-index: 100000;
	width: 300px;
	max-height: calc(100dvh - 24px);
	overflow: auto;
	box-sizing: border-box;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
	font-size: 12px;
}

.header {
	display: block;
	width: 100%;
	padding: 8px 12px;
	text-align: left;
	font-weight: bold;
}

.body {
	padding: 0 12px 12px;
}

.buttons {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.button {
	display: block;
	width: 100%;
	padding: 4px 8px;
	border-radius: var(--MI-radius-sm, 6px);
	background: var(--MI_THEME-buttonBg);
	text-align: left;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.5;
	}
}

.current {
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.stop {
	margin-top: 4px;
	text-align: center;
}

.expected {
	margin-top: 8px;
	padding: 8px;
	border-radius: var(--MI-radius-sm, 6px);
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
}

.log {
	margin: 8px 0 0;
	padding-left: 1.5em;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
