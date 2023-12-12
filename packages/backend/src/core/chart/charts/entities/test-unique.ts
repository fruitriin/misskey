/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.ts';

export const name = 'testUnique';

export const schema = {
	'foo': { uniqueIncrement: true },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
