/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { runWithConcurrency, splitParts } from '@/utility/drive-direct-upload.js';

describe('splitParts', () => {
	test('splits into full parts and a trailing remainder', () => {
		expect(splitParts(25, 10)).toEqual([
			{ partNumber: 1, start: 0, end: 10 },
			{ partNumber: 2, start: 10, end: 20 },
			{ partNumber: 3, start: 20, end: 25 },
		]);
	});

	test('exact multiple has no empty trailing part', () => {
		expect(splitParts(20, 10)).toHaveLength(2);
	});

	test('smaller than one part is a single part', () => {
		expect(splitParts(3, 10)).toEqual([{ partNumber: 1, start: 0, end: 3 }]);
	});
});

describe('runWithConcurrency', () => {
	test('keeps order and never exceeds the limit', async () => {
		let running = 0;
		let peak = 0;
		const tasks = Array.from({ length: 10 }, (_, i) => async () => {
			running++;
			peak = Math.max(peak, running);
			await new Promise(r => setTimeout(r, 5));
			running--;
			return i;
		});

		expect(await runWithConcurrency(tasks, 3)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(peak).toBe(3);
	});

	test('rejects when a task fails', async () => {
		await expect(runWithConcurrency([async () => 1, async () => { throw new Error('x'); }], 2)).rejects.toThrow('x');
	});
});
