/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddRenoteLock1780189658202 {
	name = 'AddRenoteLock1780189658202';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" ADD "renoteLock" character varying(32) NOT NULL DEFAULT 'none'`);
		await queryRunner.query(`ALTER TABLE "note" ADD "renoteWindowDuration" integer DEFAULT NULL`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "renoteWindowDuration"`);
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "renoteLock"`);
	}
}
