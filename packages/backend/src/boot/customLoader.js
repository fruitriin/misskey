import { pathToFileURL } from 'url';

import {
	resolve as esmResolve,
	getFormat,
	transformSource,
	load,
} from 'ts-node/esm';
import { createMatchPath, loadConfig } from 'tsconfig-paths';

export { getFormat, transformSource, load };

const { absoluteBaseUrl, paths } = loadConfig();
const matchPath = createMatchPath(absoluteBaseUrl, paths);

export async function resolve(specifier, context, defaultResolve) {
	// *.js を matchPath が展開できないため、matchPath 前後で拡張子を付け直す
	if (specifier.endsWith('.ts')) {
		const trimmed = specifier.substring(0, specifier.length - 3);
		const matchedSpecifier = matchPath(trimmed);
		if (matchedSpecifier) {
			return esmResolve(
				pathToFileURL(`${matchedSpecifier}.js`).toString(),
				context,
				defaultResolve,
			);
		}
	}

	return esmResolve(specifier, context, defaultResolve);
}
