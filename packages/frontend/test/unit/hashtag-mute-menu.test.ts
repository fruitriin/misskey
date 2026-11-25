/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, assert, beforeEach, describe, test, vi } from 'vitest';
import { ref } from 'vue';
import { cleanup, createEvent, fireEvent, render } from '@testing-library/vue';
import { directives } from '@/directives/index.js';
import { components } from '@/components/index.js';
import MkMfm from '@/components/global/MkMfm.js';
import * as os from '@/os.js';
import type { MenuItem } from '@/types/menu.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';

const mocks = vi.hoisted(() => ({
	ios: false,
	me: null as null | { id: string; policies: Record<string, unknown>; mutedWords: (string | string[])[]; hardMutedWords: (string | string[])[] },
}));

vi.mock('@/i.js', async (importOriginal) => {
	const original = await importOriginal<typeof import('@/i.js')>();
	return {
		...original,
		get $i() { return mocks.me; },
	};
});

vi.mock('@/utility/is-ios.js', () => ({
	isIOS: () => mocks.ios,
}));

vi.mock('@/os.js', () => ({
	contextMenu: vi.fn(),
	apiWithDialog: vi.fn(() => Promise.resolve()),
	pageWindow: vi.fn(),
	popup: vi.fn(),
}));

type ButtonItem = { text?: string; action?: () => unknown; type?: string };

describe('ハッシュタグの右クリックのメニューからミュートする', () => {
	const contextMenu = vi.mocked(os.contextMenu);
	const apiWithDialog = vi.mocked(os.apiWithDialog);

	beforeEach(() => {
		contextMenu.mockClear();
		apiWithDialog.mockClear();
		mocks.me = { id: 'me', policies: {}, mutedWords: [], hardMutedWords: [] };
	});

	afterEach(() => {
		cleanup();
	});

	const openMenu = async (text: string): Promise<ButtonItem[]> => {
		const result = render(MkMfm, { props: { text }, global: { directives, components } });
		const anchor = result.container.querySelector('a[href^="/tags/"]');
		assert.exists(anchor);
		await fireEvent.contextMenu(anchor!);
		assert.strictEqual(contextMenu.mock.calls.length, 1);
		return contextMenu.mock.calls[0][0] as MenuItem[] as ButtonItem[];
	};

	const MUTE = '/#misskey(?:[^\\p{L}\\p{N}_]|$)/iu';

	test('ワードミュートとハードワードミュートが出て、ハッシュタグの正規表現で登録する', async () => {
		const items = await openMenu('こんにちは #misskey');
		const wordMute = items.find(i => i.text === i18n.ts.wordMute);
		const hardMute = items.find(i => i.text === i18n.ts.hardWordMute);
		assert.exists(wordMute);
		assert.exists(hardMute);

		await wordMute!.action!();
		assert.deepStrictEqual(apiWithDialog.mock.calls[0], ['i/update', { mutedWords: [MUTE] }]);

		await hardMute!.action!();
		assert.deepStrictEqual(apiWithDialog.mock.calls[1], ['i/update', { hardMutedWords: [MUTE] }]);
	});

	test('登録した正規表現は、そのハッシュタグだけに当たる (大文字・小文字は区別しない)', () => {
		const parts = MUTE.match(/^\/(.+)\/(.*)$/)!;
		const re = new RegExp(parts[1], parts[2]);
		assert.isTrue(re.test('こんにちは #misskey'));
		assert.isTrue(re.test('#Misskey!'));
		assert.isTrue(re.test('#misskey すごい'));
		assert.isFalse(re.test('#misskeyio'));
		assert.isFalse(re.test('#misskey_dev'));
		assert.isFalse(re.test('misskey'));
	});

	test('タグの中の正規表現の記号は、文字として扱う', async () => {
		const items = await openMenu('#a.b');
		await items.find(i => i.text === i18n.ts.wordMute)!.action!();
		const word = (apiWithDialog.mock.calls[0][1] as { mutedWords: string[] }).mutedWords[0];
		const parts = word.match(/^\/(.+)\/(.*)$/)!;
		const re = new RegExp(parts[1], parts[2]);
		assert.isTrue(re.test('#a.b'));
		assert.isFalse(re.test('#axb'));
	});

	test('すでにミュートしている種類は出さない', async () => {
		mocks.me!.mutedWords = [MUTE];
		const items = await openMenu('#misskey');
		assert.notExists(items.find(i => i.text === i18n.ts.wordMute));
		assert.exists(items.find(i => i.text === i18n.ts.hardWordMute));
	});

	test('サインインしていなければ、ミュートの項目は出さない', async () => {
		mocks.me = null;
		const items = await openMenu('#misskey');
		assert.notExists(items.find(i => i.text === i18n.ts.wordMute));
		assert.notExists(items.find(i => i.text === '#misskey'));
		// 足す項目がないときは、区切り線も足さない
		assert.strictEqual(items.filter(i => i.type === 'divider').length, 1);
	});

	test('ふつうのリンクのメニューは変わらない', async () => {
		const items = await openMenu('#misskey');
		assert.exists(items.find(i => i.text === i18n.ts.copyLink));
		assert.exists(items.find(i => i.text === i18n.ts.openInWindow));
	});
});

describe('iOS でハッシュタグを長押しすると、右クリックと同じメニューを開く', () => {
	const contextMenu = vi.mocked(os.contextMenu);
	const KEY = 'experimental.useNativeLinkMenuForHashtagOnIOS';
	const useNativeLinkMenu = ref(false);
	const contextMenuSetting = ref('app');

	beforeEach(() => {
		vi.useFakeTimers();
		contextMenu.mockClear();
		mocks.me = { id: 'me', policies: {}, mutedWords: [], hardMutedWords: [] };
		mocks.ios = true;
		useNativeLinkMenu.value = false;
		contextMenuSetting.value = 'app';
		(prefer.r as Record<string, unknown>)[KEY] = useNativeLinkMenu;
		(prefer.r as Record<string, unknown>).contextMenu = contextMenuSetting;
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		mocks.ios = false;
		delete (prefer.r as Record<string, unknown>)[KEY];
		delete (prefer.r as Record<string, unknown>).contextMenu;
	});

	const renderHashtag = () => {
		const result = render(MkMfm, { props: { text: '#misskey' }, global: { directives, components } });
		const anchor = result.container.querySelector('a[href^="/tags/"]');
		assert.exists(anchor);
		return anchor!;
	};

	const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }] });

	/** 指を離して、そのあとの click (ページの移動) を止めたかを返す */
	const touchEndPrevented = async (anchor: Element): Promise<boolean> => {
		const ev = createEvent.touchEnd(anchor, { touches: [] });
		await fireEvent(anchor, ev);
		return ev.defaultPrevented;
	};

	test('長押しでメニューが開き、指を離したときのページの移動を止める', async () => {
		const anchor = renderHashtag();
		await fireEvent.touchStart(anchor, touch(10, 10));
		vi.advanceTimersByTime(499);
		assert.strictEqual(contextMenu.mock.calls.length, 0);
		vi.advanceTimersByTime(1);
		assert.strictEqual(contextMenu.mock.calls.length, 1);
		const items = contextMenu.mock.calls[0][0] as MenuItem[] as ButtonItem[];
		assert.exists(items.find(i => i.text === i18n.ts.wordMute));

		assert.isTrue(await touchEndPrevented(anchor));
	});

	test('メニューを開いてから指を離した少しあとまで、iOS が送る mousedown でメニューを閉じさせない', async () => {
		const anchor = renderHashtag();
		const onBodyMousedown = vi.fn();
		document.body.addEventListener('mousedown', onBodyMousedown);
		try {
			await fireEvent.touchStart(anchor, touch(10, 10));
			vi.advanceTimersByTime(500);
			assert.strictEqual(contextMenu.mock.calls.length, 1);

			// 指を離す前に iOS が送る mousedown
			await fireEvent.mouseDown(anchor);
			assert.strictEqual(onBodyMousedown.mock.calls.length, 0);

			await touchEndPrevented(anchor);
			await fireEvent.mouseDown(anchor);
			assert.strictEqual(onBodyMousedown.mock.calls.length, 0);

			// 少し待てば、ふつうに届く (メニューの外を押せば閉じる)
			vi.advanceTimersByTime(400);
			await fireEvent.mouseDown(document.body);
			assert.strictEqual(onBodyMousedown.mock.calls.length, 1);
		} finally {
			document.body.removeEventListener('mousedown', onBodyMousedown);
		}
	});

	test('すぐに離したら (タップ) メニューは開かず、ページの移動も止めない', async () => {
		const anchor = renderHashtag();
		await fireEvent.touchStart(anchor, touch(10, 10));
		vi.advanceTimersByTime(200);
		assert.isFalse(await touchEndPrevented(anchor));
		vi.advanceTimersByTime(1000);
		assert.strictEqual(contextMenu.mock.calls.length, 0);
	});

	test('指が動いたら (スクロール) メニューは開かない', async () => {
		const anchor = renderHashtag();
		await fireEvent.touchStart(anchor, touch(10, 10));
		await fireEvent.touchMove(anchor, touch(10, 40));
		vi.advanceTimersByTime(1000);
		assert.strictEqual(contextMenu.mock.calls.length, 0);
	});

	test('実験的機能で OS のメニューに戻していれば、長押しを扱わない', async () => {
		useNativeLinkMenu.value = true;
		const anchor = renderHashtag();
		await fireEvent.touchStart(anchor, touch(10, 10));
		vi.advanceTimersByTime(1000);
		assert.strictEqual(contextMenu.mock.calls.length, 0);
	});

	test('右クリックで OS のメニューを出す設定なら、長押しを扱わない', async () => {
		contextMenuSetting.value = 'native';
		const anchor = renderHashtag();
		await fireEvent.touchStart(anchor, touch(10, 10));
		vi.advanceTimersByTime(1000);
		assert.strictEqual(contextMenu.mock.calls.length, 0);
		assert.isFalse(await touchEndPrevented(anchor));
	});

	test('メニューを開いたまま 2 本目の指が触れても、指をすべて離せば mousedown を止めるのをやめる', async () => {
		const anchor = renderHashtag();
		const onBodyMousedown = vi.fn();
		document.body.addEventListener('mousedown', onBodyMousedown);
		try {
			await fireEvent.touchStart(anchor, touch(10, 10));
			vi.advanceTimersByTime(500);
			assert.strictEqual(contextMenu.mock.calls.length, 1);

			await fireEvent.touchStart(anchor, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
			await fireEvent.touchEnd(anchor, { touches: [{ clientX: 10, clientY: 10 }] });
			await fireEvent.touchEnd(anchor, { touches: [] });
			vi.advanceTimersByTime(400);
			await fireEvent.mouseDown(document.body);
			assert.strictEqual(onBodyMousedown.mock.calls.length, 1);
		} finally {
			document.body.removeEventListener('mousedown', onBodyMousedown);
		}
	});

	test('iOS 以外では長押しを扱わない', async () => {
		mocks.ios = false;
		const anchor = renderHashtag();
		await fireEvent.touchStart(anchor, touch(10, 10));
		vi.advanceTimersByTime(1000);
		assert.strictEqual(contextMenu.mock.calls.length, 0);
	});
});
