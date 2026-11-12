<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span v-if="!fetching" :class="$style.root">
	<template v-if="display === 'marquee'">
		<Transition
			:enterActiveClass="$style.transition_change_enterActive"
			:leaveActiveClass="$style.transition_change_leaveActive"
			:enterFromClass="$style.transition_change_enterFrom"
			:leaveToClass="$style.transition_change_leaveTo"
			mode="default"
		>
			<MkMarqueeText :key="key" :duration="marqueeDuration" :reverse="marqueeReverse">
				<span v-for="item in items" :class="$style.item">
					<a :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a><span :class="$style.divider"></span>
				</span>
			</MkMarqueeText>
		</Transition>
	</template>
	<template v-else-if="display === 'oneByOne'">
		<!-- TODO -->
	</template>
</span>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import MkMarqueeText from '@/components/MkMarqueeText.vue';
import { shuffle } from '@/utility/shuffle.js';
import { fetchRssItems, getRssRefreshIntervalMs } from '@/utility/fetch-rss.js';

const props = defineProps<{
	url: string;
	shuffle?: boolean;
	display?: 'marquee' | 'oneByOne';
	marqueeDuration?: number;
	marqueeReverse?: boolean;
	oneByOneInterval?: number;
	refreshIntervalSec: number;
}>();

const items = ref<Misskey.entities.FetchRssResponse['items']>([]);
const fetching = ref(true);
const key = ref(0);

const tick = async () => {
	const newItems = await fetchRssItems(props.url);
	// 取れなかったときは、前に取れた項目があればそれを流したままにする
	fetching.value = false;
	if (newItems == null) return;
	if (props.shuffle) {
		shuffle(newItems);
	}
	items.value = newItems;
	key.value++;
};

useInterval(tick, getRssRefreshIntervalMs(props.refreshIntervalSec), {
	immediate: true,
	afterMounted: true,
});
</script>

<style lang="scss" module>
.transition_change_enterActive,
.transition_change_leaveActive {
	position: absolute;
	top: 0;
  transition: all 1s ease;
}
.transition_change_enterFrom {
	opacity: 0;
	transform: translateY(-100%);
}
.transition_change_leaveTo {
	opacity: 0;
	transform: translateY(100%);
}

.root {
	display: inline-block;
	position: relative;
}

.item {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	margin: 0;
}

.divider {
	display: inline-block;
	width: 0.5px;
	height: var(--height);
	margin: 0 3em;
	background: currentColor;
	opacity: 0.3;
}
</style>
