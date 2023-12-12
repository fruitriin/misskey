/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Schema } from '@/misc/json-schema.ts';
import { refs } from '@/misc/json-schema.ts';

export function convertSchemaToOpenApiSchema(schema: Schema) {
	// optional, refはスキーマ定義に含まれないので分離しておく
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { optional, ref, ...res }: any = schema;

	if (schema.type === 'object' && schema.properties) {
		const required = Object.entries(schema.properties).filter(([k, v]) => !v.optional).map(([k]) => k);
		if (required.length > 0) {
			// 空配列は許可されない
			res.required = required;
		}

		for (const k of Object.keys(schema.properties)) {
			res.properties[k] = convertSchemaToOpenApiSchema(schema.properties[k]);
		}
	}

	if (schema.type === 'array' && schema.items) {
		res.items = convertSchemaToOpenApiSchema(schema.items);
	}

	if (schema.anyOf) res.anyOf = schema.anyOf.map(convertSchemaToOpenApiSchema);
	if (schema.oneOf) res.oneOf = schema.oneOf.map(convertSchemaToOpenApiSchema);
	if (schema.allOf) res.allOf = schema.allOf.map(convertSchemaToOpenApiSchema);

	if (schema.ref) {
		const $ref = `#/components/schemas/${schema.ref}`;
		if (schema.nullable || schema.optional) {
			res.allOf = [{ $ref }];
		} else {
			res.$ref = $ref;
		}
	}

	return res;
}

export const schemas = {
	Error: {
		type: 'object',
		properties: {
			error: {
				type: 'object',
				description: 'An error object.',
				properties: {
					code: {
						type: 'string',
						description: 'An error code. Unique within the endpoint.',
					},
					message: {
						type: 'string',
						description: 'An error message.',
					},
					id: {
						type: 'string',
						format: 'uuid',
						description: 'An error ID. This ID is static.',
					},
				},
				required: ['code', 'id', 'message'],
			},
		},
		required: ['error'],
	},

	...Object.fromEntries(
		Object.entries(refs).map(([key, schema]) => [key, convertSchemaToOpenApiSchema(schema)]),
	),
};
