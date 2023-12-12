/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.ts';

export const name = 'testIntersection';

export const schema = {
	'a': { uniqueIncrement: true },
	'b': { uniqueIncrement: true },
	'aAndB': { intersection: ['a', 'b'] },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
