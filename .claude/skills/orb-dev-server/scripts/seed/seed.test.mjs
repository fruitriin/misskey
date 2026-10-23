/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodePng, avatarPng, bannerPng, emojiPng, photoPng } from './lib/png.mjs';
import { genAidx } from './lib/aidx.mjs';
import { createRandom } from './lib/random.mjs';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('encodePng: シグネチャと IHDR の幅・高さ', () => {
	const png = encodePng(3, 2, new Uint8Array(3 * 2 * 4));
	assert.deepEqual(png.subarray(0, 8), SIGNATURE);
	assert.equal(png.toString('latin1', 12, 16), 'IHDR');
	assert.equal(png.readUInt32BE(16), 3);
	assert.equal(png.readUInt32BE(20), 2);
	assert.equal(png.toString('latin1', png.length - 8, png.length - 4), 'IEND');
});

test('各生成関数: 指定サイズで、同じシードなら同じバイト列', () => {
	const cases = [
		[avatarPng, 256, 256],
		[bannerPng, 1500, 500],
		[emojiPng, 128, 128],
		[photoPng, 800, 600],
	];
	for (const [fn, w, h] of cases) {
		const a = fn('user01');
		assert.deepEqual(a.subarray(0, 8), SIGNATURE);
		assert.equal(a.readUInt32BE(16), w);
		assert.equal(a.readUInt32BE(20), h);
		assert.deepEqual(a, fn('user01'));
		assert.notDeepEqual(a, fn('user02'));
	}
});

test('genAidx: 16 文字で先頭 8 文字は時刻の 36 進数', () => {
	const id = genAidx(946684800000 + 36 ** 3, 0);
	assert.equal(id.length, 16);
	assert.equal(id.slice(0, 8), '00001000');
	assert.match(id, /^[0-9a-z]{16}$/);
	assert.equal(id.slice(12), '0000');
	assert.equal(genAidx(946684800000, 36).slice(12), '0010');
});

test('genAidx: node 部はプロセス内で固定', () => {
	assert.equal(genAidx(946684800000, 1).slice(8, 12), genAidx(946684800000, 2).slice(8, 12));
});

test('createRandom: 同じシードで同じ列、範囲内の値を返す', () => {
	const a = createRandom(20261023);
	const b = createRandom(20261023);
	const seqA = Array.from({ length: 20 }, () => a.next());
	const seqB = Array.from({ length: 20 }, () => b.next());
	assert.deepEqual(seqA, seqB);
	const r = createRandom(1);
	for (let i = 0; i < 200; i++) {
		const v = r.int(3, 5);
		assert.ok(v >= 3 && v <= 5 && Number.isInteger(v));
		assert.ok(['x', 'y'].includes(r.pick(['x', 'y'])));
		assert.equal(typeof r.chance(0.5), 'boolean');
	}
});
