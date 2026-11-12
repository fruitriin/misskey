/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, assert, describe, test, vi } from 'vitest';
import { fetchRssItems, getRssRefreshIntervalMs, RSS_DEFAULT_REFRESH_INTERVAL_MIN, RSS_MIN_REFRESH_INTERVAL_MIN } from '@/utility/fetch-rss.js';

describe('getRssRefreshIntervalMs', () => {
	test('間隔は分で受け取り、ミリ秒で返す', () => {
		assert.strictEqual(getRssRefreshIntervalMs(120), 120 * 60 * 1000);
	});

	test('下限より短い間隔は下限 (45 分) にする', () => {
		assert.strictEqual(getRssRefreshIntervalMs(1), RSS_MIN_REFRESH_INTERVAL_MIN * 60 * 1000);
		assert.strictEqual(getRssRefreshIntervalMs(1), 45 * 60 * 1000);
	});

	test('数でない値・0 以下は既定値 (180 分) にする', () => {
		assert.strictEqual(getRssRefreshIntervalMs(Number.NaN), RSS_DEFAULT_REFRESH_INTERVAL_MIN * 60 * 1000);
		assert.strictEqual(getRssRefreshIntervalMs(0), 180 * 60 * 1000);
		assert.strictEqual(getRssRefreshIntervalMs(-1), 180 * 60 * 1000);
	});

	test('ステータスバーに保存されている秒の値 (これまでの既定値の 120 秒など) は、分に直すと下限になる', () => {
		assert.strictEqual(getRssRefreshIntervalMs(120 / 60), 45 * 60 * 1000);
	});
});

describe('fetchRssItems', () => {
	const fetchMock = vi.mocked(window.fetch);

	afterEach(() => {
		fetchMock.mockReset();
	});

	const respond = (status: number, body: unknown) => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
	};

	test('フィードの項目のうち、http・https のリンクを持つものだけを返す', async () => {
		respond(200, { items: [
			{ title: 'a', link: 'https://example.com/a' },
			{ title: 'b', link: 'javascript:alert(1)' },
			{ title: 'c' },
		] });
		const items = await fetchRssItems('https://example.com/feed.xml');
		assert.deepStrictEqual(items?.map(i => i.title), ['a']);
		const requested = new URL(String(fetchMock.mock.calls[0][0]));
		assert.strictEqual(requested.pathname, '/api/fetch-rss');
		assert.strictEqual(requested.searchParams.get('url'), 'https://example.com/feed.xml');
	});

	test('サーバーがエラーを返したら null を返す (エラーの応答をフィードとして読まない)', async () => {
		respond(422, { error: { code: 'FETCH_RSS_FAILED' } });
		assert.isNull(await fetchRssItems('https://example.com/broken.xml'));
	});

	test('通信に失敗したら null を返す', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('network error'));
		assert.isNull(await fetchRssItems('https://example.com/feed.xml'));
	});

	test('items のない応答は null を返す', async () => {
		respond(200, { title: 'not a feed' });
		assert.isNull(await fetchRssItems('https://example.com/feed.xml'));
	});
});
