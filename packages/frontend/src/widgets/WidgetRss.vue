<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-rss" class="mkw-rss">
	<template #icon><i class="ti ti-rss"></i></template>
	<template #header>RSS</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button></template>

	<div class="ekmkgxbj">
		<MkLoading v-if="fetching"/>
		<MkResult v-else-if="fetchError != null && items.length === 0" type="error" :text="getRssFetchErrorText(fetchError)"/>
		<MkResult v-else-if="(!items || items.length === 0) && widgetProps.showHeader" type="empty"/>
		<div v-else :class="$style.feed">
			<a v-for="item in items" :key="item.link" :class="$style.item" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import { createVisibilityAwareInterval } from '@@/js/interval.js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import { i18n } from '@/i18n.js';
import type { RssFetchError } from '@/utility/fetch-rss.js';
import { fetchRss, getRssFetchErrorText, getRssRefreshIntervalMs, RSS_DEFAULT_REFRESH_INTERVAL_MIN, RSS_MAX_REFRESH_INTERVAL_MIN, RSS_MIN_REFRESH_INTERVAL_MIN, RSS_REFRESH_INTERVAL_STEP_MIN } from '@/utility/fetch-rss.js';
import MkContainer from '@/components/MkContainer.vue';

const name = 'rss';

const widgetPropsDef = {
	url: {
		type: 'string',
		label: i18n.ts._widgetOptions._rss.url,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
		manualSave: true,
	},
	refreshIntervalMin: {
		type: 'range',
		label: i18n.ts._widgetOptions._rss.refreshIntervalMin,
		default: RSS_DEFAULT_REFRESH_INTERVAL_MIN,
		min: RSS_MIN_REFRESH_INTERVAL_MIN,
		max: RSS_MAX_REFRESH_INTERVAL_MIN,
		step: RSS_REFRESH_INTERVAL_STEP_MIN,
	},
	maxEntries: {
		type: 'number',
		label: i18n.ts._widgetOptions._rss.maxEntries,
		default: 15,
	},
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const rawItems = ref<Misskey.entities.FetchRssResponse['items']>([]);
const items = computed(() => rawItems.value.slice(0, widgetProps.maxEntries));
const fetching = ref(true);
// 取れなかったときは、前に取れた項目があればそれを出したままにする
const fetchError = ref<RssFetchError | null>(null);

// 取得中に URL が変わったら、古い応答は捨てる
let generation = 0;

const tick = async () => {
	const current = ++generation;
	const result = await fetchRss(widgetProps.url);
	if (current !== generation) return;
	if (result.items != null) rawItems.value = result.items;
	fetchError.value = result.error ?? null;
	fetching.value = false;
};

watch(() => widgetProps.url, () => {
	// 前の URL で取れた項目は出さない
	rawItems.value = [];
	fetchError.value = null;
	fetching.value = true;
	tick();
});

// useInterval は setup の中でしか開始できないので、間隔を変えたときに作り直せるよう、ここでは直接使う
let intervalClear: (() => void) | null = null;
watch(() => widgetProps.refreshIntervalMin, () => {
	intervalClear?.();
	intervalClear = createVisibilityAwareInterval(tick, getRssRefreshIntervalMs(widgetProps.refreshIntervalMin), {
		immediate: true,
	});
}, { immediate: true });

onUnmounted(() => {
	intervalClear?.();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.feed {
	padding: 0;
	font-size: 0.9em;
}

.item {
	display: block;
	padding: 8px 16px;
	color: var(--MI_THEME-fg);
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;

	&:nth-child(even) {
		background: rgba(#000, 0.05);
	}
}
</style>
