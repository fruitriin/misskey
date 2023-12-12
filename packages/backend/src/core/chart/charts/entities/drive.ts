/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.ts';

export const name = 'drive';

export const schema = {
	'local.incCount': {},
	'local.incSize': {}, // in kilobyte
	'local.decCount': {},
	'local.decSize': {}, // in kilobyte
	'remote.incCount': {},
	'remote.incSize': {}, // in kilobyte
	'remote.decCount': {},
	'remote.decSize': {}, // in kilobyte
} as const;

export const entity = Chart.schemaToEntity(name, schema);
