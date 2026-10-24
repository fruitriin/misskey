/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyFiles, findForkPoint, slugOf } from './classify.mjs';

test('classifyFiles: migration の追加があれば migration', () => {
	const changed = [
		'packages/backend/src/core/NoteCreateService.ts',
		'packages/frontend/src/components/MkNote.vue',
		'packages/backend/migration/1780190369217-noteRenoteLock.js',
	];
	const added = ['packages/backend/migration/1780190369217-noteRenoteLock.js'];
	assert.equal(classifyFiles(changed, added), 'migration');
});

test('classifyFiles: migration の変更だけで追加が無ければ migration にしない', () => {
	const changed = ['packages/backend/migration/1000000000000-init.js', 'packages/backend/src/server/api/endpoints/meta.ts'];
	assert.equal(classifyFiles(changed, []), 'backend');
});

test('classifyFiles: migration 以外のファイルの追加は migration にしない', () => {
	const changed = ['packages/backend/src/core/NewService.ts'];
	assert.equal(classifyFiles(changed, ['packages/backend/src/core/NewService.ts']), 'backend');
});

test('classifyFiles: packages/backend/src の変更は backend', () => {
	assert.equal(classifyFiles(['packages/frontend/src/a.vue', 'packages/backend/src/b.ts'], []), 'backend');
});

test('classifyFiles: misskey-js の autogen の変更は backend', () => {
	assert.equal(classifyFiles(['packages/misskey-js/src/autogen/types.ts'], []), 'backend');
});

test('classifyFiles: misskey-js の autogen 以外や backend のテストだけなら backend にしない', () => {
	assert.equal(classifyFiles(['packages/misskey-js/src/api.ts'], []), 'other');
	assert.equal(classifyFiles(['packages/backend/test/unit/a.ts'], []), 'other');
});

test('classifyFiles: packages/frontend* だけなら frontend', () => {
	assert.equal(classifyFiles(['packages/frontend/src/pages/clip.vue'], []), 'frontend');
	assert.equal(classifyFiles(['packages/frontend/src/a.vue', 'packages/frontend-shared/js/b.ts', 'packages/frontend-embed/src/c.vue'], []), 'frontend');
});

test('classifyFiles: frontend と他のファイルが混ざれば other', () => {
	assert.equal(classifyFiles(['packages/frontend/src/a.vue', 'locales/ja-JP.yml'], []), 'other');
});

test('classifyFiles: どれでもなければ other', () => {
	assert.equal(classifyFiles(['README.md'], []), 'other');
	assert.equal(classifyFiles([], []), 'other');
});

test('findForkPoint: 件名が Version updated to: で始まる最新のコミットを返す', () => {
	const commits = [
		{ hash: 'c3', subject: 'fix: 何か' },
		{ hash: 'c2', subject: 'Version updated to: 2026.5.4-MISTEMS.91' },
		{ hash: 'c1', subject: 'Version updated to: 2026.5.4-MISTEMS.90' },
	];
	assert.equal(findForkPoint(commits), 'c2');
});

test('findForkPoint: 件名の途中にあるだけなら起点にしない', () => {
	const commits = [{ hash: 'c1', subject: 'Revert "Version updated to: 1.0"' }];
	assert.equal(findForkPoint(commits), null);
});

test('findForkPoint: 無ければ null', () => {
	assert.equal(findForkPoint([]), null);
	assert.equal(findForkPoint([{ hash: 'c1', subject: 'feat: x' }]), null);
});

test('slugOf: 最後の / 以降を小文字にし、[a-z0-9-] 以外を - にする', () => {
	assert.equal(slugOf('claude/renote-lock-feature-7J0NA'), 'renote-lock-feature-7j0na');
	assert.equal(slugOf('claude/issue-26-20260510-1119'), 'issue-26-20260510-1119');
	assert.equal(slugOf('fix-clips-pagination'), 'fix-clips-pagination');
	assert.equal(slugOf('feat/foo_bar.baz'), 'foo-bar-baz');
});
