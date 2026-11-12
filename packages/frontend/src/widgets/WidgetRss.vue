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
import { computed } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import { i18n } from '@/i18n.js';
import { getRssFetchErrorText, RSS_DEFAULT_REFRESH_INTERVAL_MIN, RSS_MAX_REFRESH_INTERVAL_MIN, RSS_MIN_REFRESH_INTERVAL_MIN, RSS_REFRESH_INTERVAL_STEP_MIN } from '@/utility/fetch-rss.js';
import { useRssFeed } from '@/utility/use-rss-feed.js';
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

const { items: rawItems, fetching, error: fetchError } = useRssFeed({
	url: () => widgetProps.url,
	refreshIntervalMin: () => widgetProps.refreshIntervalMin,
});
const items = computed(() => rawItems.value.slice(0, widgetProps.maxEntries));

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
