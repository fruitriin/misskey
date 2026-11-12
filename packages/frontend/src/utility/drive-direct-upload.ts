/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { globalEvents } from '@/events.js';

// Cloudflare (Free / Pro) のリクエストボディ上限 100MB に余裕を持たせた閾値
export const DIRECT_UPLOAD_THRESHOLD = 90 * 1024 * 1024;
const CONCURRENCY = 4;
const PART_RETRIES = 3;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30 * 60 * 1000;

export class DirectUploadUnavailableError extends Error {
	constructor() {
		super('Direct upload is unavailable');
	}
}

export class DirectUploadAbortedError extends Error {
	constructor() {
		super('Upload aborted');
	}
}

type UploadOptions = {
	name?: string;
	folderId?: string | null;
	isSensitive?: boolean;
	caption?: string | null;
	onProgress?: (ctx: { total: number; loaded: number; }) => void;
};

export function splitParts(size: number, partSize: number): { partNumber: number; start: number; end: number }[] {
	const count = Math.max(1, Math.ceil(size / partSize));
	return Array.from({ length: count }, (_, i) => ({
		partNumber: i + 1,
		start: i * partSize,
		end: Math.min(size, (i + 1) * partSize),
	}));
}

export async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
	const results: T[] = new Array(tasks.length);
	let next = 0;
	const worker = async () => {
		while (next < tasks.length) {
			const i = next++;
			results[i] = await tasks[i]();
		}
	};
	await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
	return results;
}

function putPart(url: string, body: Blob, xhrs: Set<XMLHttpRequest>, onProgress: (loaded: number) => void): Promise<string> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhrs.add(xhr);
		xhr.open('PUT', url, true);
		xhr.upload.onprogress = ev => onProgress(ev.loaded);
		xhr.onload = () => {
			xhrs.delete(xhr);
			const etag = xhr.getResponseHeader('ETag');
			if (xhr.status >= 200 && xhr.status < 300 && etag != null) resolve(etag);
			else reject(new Error(`part upload failed: ${xhr.status}`));
		};
		xhr.onerror = () => { xhrs.delete(xhr); reject(new Error('part upload network error')); };
		xhr.onabort = () => { xhrs.delete(xhr); reject(new DirectUploadAbortedError()); };
		xhr.send(body);
	});
}

async function putPartWithRetry(url: string, body: Blob, xhrs: Set<XMLHttpRequest>, onProgress: (loaded: number) => void): Promise<string> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await putPart(url, body, xhrs, onProgress);
		} catch (err) {
			if (err instanceof DirectUploadAbortedError || attempt >= PART_RETRIES) throw err;
			onProgress(0);
			await new Promise(r => window.setTimeout(r, 1000 * attempt));
		}
	}
}

function alertUploadError(code: string | null | undefined) {
	const text =
		code === 'MAX_FILE_SIZE_EXCEEDED' ? i18n.ts.cannotUploadBecauseExceedsFileSizeLimit :
		code === 'NO_FREE_SPACE' ? i18n.ts.cannotUploadBecauseNoFreeSpace :
		code === 'UNALLOWED_FILE_TYPE' ? i18n.ts.cannotUploadBecauseUnallowedFileType :
		code === 'INAPPROPRIATE' ? i18n.ts.cannotUploadBecauseInappropriate :
		code ?? '';
	os.alert({ type: 'error', title: i18n.ts.failedToUpload, text });
}

export function directUploadFile(file: File | Blob, options: UploadOptions = {}): { filePromise: Promise<Misskey.entities.DriveFile>; abort: () => void } {
	const xhrs = new Set<XMLHttpRequest>();
	let aborted = false;
	let uploadId: string | null = null;

	const filePromise = (async () => {
		let init: Misskey.entities.DriveFilesDirectUploadInitResponse;
		try {
			init = await misskeyApi('drive/files/direct-upload/init', {
				size: file.size,
				name: options.name ?? (file instanceof File ? file.name : null),
				folderId: options.folderId ?? null,
				comment: options.caption ?? null,
				isSensitive: options.isSensitive ?? false,
				force: true,
			});
		} catch (err) {
			if ((err as { code?: string }).code === 'DIRECT_UPLOAD_UNAVAILABLE') throw new DirectUploadUnavailableError();
			alertUploadError((err as { code?: string }).code);
			throw err;
		}
		uploadId = init.uploadId;

		const parts = splitParts(file.size, init.partSize);
		const loadedByPart = new Array<number>(parts.length).fill(0);
		const report = () => options.onProgress?.({ total: file.size, loaded: loadedByPart.reduce((a, b) => a + b, 0) });

		const etags = await runWithConcurrency(parts.map((p, i) => () => {
			if (aborted) throw new DirectUploadAbortedError();
			return putPartWithRetry(init.urls[i], file.slice(p.start, p.end), xhrs, loaded => {
				loadedByPart[i] = loaded;
				report();
			});
		}), CONCURRENCY);

		await misskeyApi('drive/files/direct-upload/complete', {
			uploadId: init.uploadId,
			parts: parts.map((p, i) => ({ partNumber: p.partNumber, etag: etags[i] })),
		});

		const deadline = Date.now() + POLL_TIMEOUT_MS;
		while (Date.now() < deadline) {
			if (aborted) throw new DirectUploadAbortedError();
			await new Promise(r => window.setTimeout(r, POLL_INTERVAL_MS));
			const s = await misskeyApi('drive/files/direct-upload/status', { uploadId: init.uploadId });
			if (s.status === 'done' && s.file != null) {
				globalEvents.emit('driveFileCreated', s.file);
				return s.file;
			}
			if (s.status === 'failed') {
				alertUploadError(s.errorCode);
				throw new Error(`direct upload failed: ${s.errorCode}`);
			}
		}
		alertUploadError(null);
		throw new Error('direct upload timed out');
	})();

	const abort = () => {
		aborted = true;
		for (const xhr of xhrs) xhr.abort();
		if (uploadId != null) misskeyApi('drive/files/direct-upload/abort', { uploadId }).catch(() => {});
	};

	return { filePromise, abort };
}
