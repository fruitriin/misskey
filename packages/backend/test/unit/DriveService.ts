/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, test, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
	CopyObjectCommand,
	DeleteObjectCommand,
	DeleteObjectCommandOutput,
	InvalidObjectState,
	NoSuchKey,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { GlobalModule } from '@/GlobalModule.js';
import { DriveService } from '@/core/DriveService.js';
import { CoreModule } from '@/core/CoreModule.js';
import { DI } from '@/di-symbols.js';
import type { MiMeta, DriveFilesRepository } from '@/models/_.js';
import type { TestingModule } from '@nestjs/testing';

const _dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const resource = (name: string) => nodePath.resolve(_dirname, '../resources', name);

describe('DriveService', () => {
	let app: TestingModule;
	let driveService: DriveService;
	const s3Mock = mockClient(S3Client);

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
			providers: [DriveService],
		}).compile();
		app.enableShutdownHooks();
		driveService = app.get<DriveService>(DriveService);
	});

	beforeEach(async () => {
		s3Mock.reset();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Object storage', () => {
		test('delete a file', async () => {
			s3Mock.on(DeleteObjectCommand)
				.resolves({} as DeleteObjectCommandOutput);

			await driveService.deleteObjectStorageFile('peace of the world');
		});

		test('delete a file then unexpected error', async () => {
			s3Mock.on(DeleteObjectCommand)
				.rejects(new InvalidObjectState({ $metadata: {}, message: '' }));

			await expect(driveService.deleteObjectStorageFile('unexpected')).rejects.toThrow(Error);
		});

		test('delete a file with no valid key', async () => {
			// Some S3 implementations returns 404 Not Found on deleting with a non-existent key
			s3Mock.on(DeleteObjectCommand)
				.rejects(new NoSuchKey({ $metadata: {}, message: 'allowed error.' }));

			await driveService.deleteObjectStorageFile('lol no way');
		});
	});

	describe('preUploadedKey', () => {
		let meta: MiMeta;
		let saved: Partial<MiMeta>;

		beforeEach(() => {
			meta = app.get<MiMeta>(DI.meta);
			saved = { ...meta };
			Object.assign(meta, {
				useObjectStorage: true,
				objectStorageBucket: 'test-bucket',
				objectStoragePrefix: 'files',
				objectStorageEndpoint: 'example.r2.cloudflarestorage.com',
				objectStorageRegion: 'auto',
				objectStorageAccessKey: 'ak',
				objectStorageSecretKey: 'sk',
				objectStorageUseSSL: true,
				objectStorageBaseUrl: 'https://media.example.com',
			});
			const repo = app.get<DriveFilesRepository>(DI.driveFilesRepository);
			vi.spyOn(repo, 'insertOne').mockImplementation(async (f) => f as never);
			s3Mock.on(CopyObjectCommand).resolves({});
			s3Mock.on(PutObjectCommand).resolves({});
		});

		afterEach(() => {
			Object.assign(meta, saved);
			vi.restoreAllMocks();
		});

		test('copies the pre-uploaded original instead of uploading it', async () => {
			const file = await driveService.addFile({
				user: null,
				path: resource('192.jpg'),
				name: '192.jpg',
				force: true,
				preUploadedKey: 'files/direct-upload-pending/abc',
			});

			const copies = s3Mock.commandCalls(CopyObjectCommand);
			expect(copies).toHaveLength(1);
			expect(copies[0].args[0].input).toMatchObject({
				Bucket: 'test-bucket',
				Key: file.accessKey,
				CopySource: 'test-bucket/files/direct-upload-pending/abc',
				MetadataDirective: 'REPLACE',
				ContentType: 'image/jpeg',
				CacheControl: 'max-age=31536000, immutable',
			});
			const puts = s3Mock.commandCalls(PutObjectCommand).map(c => c.args[0].input.Key);
			expect(puts).not.toContain(file.accessKey);
		});

		test('throws when object storage is disabled', async () => {
			meta.useObjectStorage = false;
			await expect(driveService.addFile({
				user: null,
				path: resource('192.jpg'),
				name: '192.jpg',
				force: true,
				preUploadedKey: 'files/direct-upload-pending/abc',
			})).rejects.toThrow('preUploadedKey requires object storage');
		});
	});
});
