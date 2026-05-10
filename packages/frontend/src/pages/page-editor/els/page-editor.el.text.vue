<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => emit('remove')">
	<template #header><i class="ti ti-align-left"></i> {{ i18n.ts._pages.blocks.text }}</template>

	<section>
		<div :class="$style.toolbar">
			<button
				v-for="fmt in MFM_FORMATS"
				:key="fmt.id"
				:title="fmt.label"
				:class="$style.toolbarBtn"
				@mousedown.prevent="applyFormat(fmt)"
			>
				<i :class="fmt.icon"></i>
			</button>
		</div>
		<textarea ref="inputEl" v-model="text" :class="$style.textarea"></textarea>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
import { watch, ref, useTemplateRef, onMounted, onUnmounted, nextTick } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '../page-editor.container.vue';
import { i18n } from '@/i18n.js';
import { Autocomplete } from '@/utility/autocomplete.js';
import * as os from '@/os.js';

const props = defineProps<{
	modelValue: Misskey.entities.PageBlock & { type: 'text' }
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'text' }): void;
	(ev: 'remove'): void;
}>();

type MfmFormat = {
	id: string;
	label: string;
	icon: string;
	before: string;
	after: string;
	multilineOk: boolean;
};

const MFM_FORMATS: MfmFormat[] = [
	{ id: 'bold', label: '太字', icon: 'ti ti-bold', before: '**', after: '**', multilineOk: false },
	{ id: 'italic', label: 'イタリック', icon: 'ti ti-italic', before: '*', after: '*', multilineOk: false },
	{ id: 'strike', label: '打ち消し', icon: 'ti ti-strikethrough', before: '~~', after: '~~', multilineOk: false },
	{ id: 'center', label: '中央寄せ', icon: 'ti ti-align-center', before: '<center>', after: '</center>', multilineOk: true },
	{ id: 'small', label: '小さく', icon: 'ti ti-letter-case-lower', before: '<small>', after: '</small>', multilineOk: true },
	{ id: 'code', label: 'インラインコード', icon: 'ti ti-code', before: '`', after: '`', multilineOk: false },
	{ id: 'codeblock', label: 'コードブロック', icon: 'ti ti-code-dots', before: '```\n', after: '\n```', multilineOk: true },
	{ id: 'x2', label: '2倍サイズ', icon: 'ti ti-zoom-in', before: '$[x2 ', after: ']', multilineOk: true },
	{ id: 'rainbow', label: '虹色', icon: 'ti ti-rainbow', before: '$[rainbow ', after: ']', multilineOk: true },
	{ id: 'spin', label: '回転', icon: 'ti ti-rotate-clockwise', before: '$[spin ', after: ']', multilineOk: true },
	{ id: 'blur', label: 'ぼかし', icon: 'ti ti-eye-off', before: '$[blur ', after: ']', multilineOk: true },
];

let autocomplete: Autocomplete;

const text = ref(props.modelValue.text ?? '');
const inputEl = useTemplateRef('inputEl');

watch(text, () => {
	emit('update:modelValue', {
		...props.modelValue,
		text: text.value,
	});
});

function applyFormat(fmt: MfmFormat) {
	const el = inputEl.value;
	if (!el) return;

	const start = el.selectionStart ?? 0;
	const end = el.selectionEnd ?? 0;
	const selected = text.value.substring(start, end);

	if (!fmt.multilineOk && selected.includes('\n')) {
		os.toast(i18n.ts._pages.mfmNoMultiline);
		return;
	}

	const placeholder = 'テキスト';
	const inner = selected || placeholder;

	text.value = text.value.substring(0, start) + fmt.before + inner + fmt.after + text.value.substring(end);

	nextTick(() => {
		el.focus();
		if (selected) {
			const pos = start + fmt.before.length + selected.length + fmt.after.length;
			el.setSelectionRange(pos, pos);
		} else {
			const selStart = start + fmt.before.length;
			el.setSelectionRange(selStart, selStart + placeholder.length);
		}
	});
}

onMounted(() => {
	if (inputEl.value == null) return;
	autocomplete = new Autocomplete(inputEl.value, text);
});

onUnmounted(() => {
	autocomplete.detach();
});
</script>

<style lang="scss" module>
.toolbar {
	display: flex;
	flex-wrap: wrap;
	padding: 4px 8px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	gap: 2px;
}

.toolbarBtn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border: none;
	background: transparent;
	border-radius: 4px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	font-size: 14px;

	&:hover {
		background: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
	}

	&:active {
		background: var(--MI_THEME-accent);
		color: #fff;
	}
}

.textarea {
	display: block;
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	width: 100%;
	min-width: 100%;
	min-height: 150px;
	border: none;
	box-shadow: none;
	padding: 16px;
	background: transparent;
	color: var(--MI_THEME-fg);
	font-size: 14px;
	box-sizing: border-box;
}
</style>
