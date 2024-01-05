/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, post, uploadUrl, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';
type Note = misskey.entities.Note
describe('users/notes', () => {
	let app: INestApplicationContext;

	let alice: misskey.entities.MeSignup;
	let jpgnote: Note;
	let pngnote: Note;
	let jpgPngnote: Note;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		const jpg = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');
		const png = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.png');
		jpgNote = await post(alice, {
			fileIds: [jpg.id],
		});
		pngNote = await post(alice, {
			fileIds: [png.id],
		});
		jpgPngNote = await post(alice, {
			fileIds: [jpg.id, png.id],
		});
	}, 1000 * 60 * 2);

	afterAll(async() => {
		await app.close();
	});

	test('withFiles', async () => {
		const res = await api('/users/notes', {
			userId: alice.id,
			withFiles: true,
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.length, 3);
		assert.strictEqual(res.body.some((note: Note) => note.id === jpgNote.id), true);
		assert.strictEqual(res.body.some((note: Note) => note.id === pngNote.id), true);
		assert.strictEqual(res.body.some((note: Note) => note.id === jpgPngNote.id), true);
	});
});
