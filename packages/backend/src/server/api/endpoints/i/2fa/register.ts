/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@/models/_.ts';
import { Endpoint } from '@/server/api/endpoint-base.ts';
import { DI } from '@/di-symbols.ts';
import type { Config } from '@/config.ts';
import { ApiError } from '@/server/api/error.ts';
import { UserAuthService } from '@/core/UserAuthService.ts';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '78d6c839-20c9-4c66-b90a-fc0542168b48',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		token: { type: 'string', nullable: true },
	},
	required: ['password'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userAuthService: UserAuthService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = ps.token;
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new Error('authentication failed');
				}

				try {
					await this.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (e) {
					throw new Error('authentication failed');
				}
			}

			const passwordMatched = await bcrypt.compare(ps.password, profile.password ?? '');
			if (!passwordMatched) {
				throw new ApiError(meta.errors.incorrectPassword);
			}

			// Generate user's secret key
			const secret = new OTPAuth.Secret();

			await this.userProfilesRepository.update(me.id, {
				twoFactorTempSecret: secret.base32,
			});

			// Get the data URL of the authenticator URL
			const totp = new OTPAuth.TOTP({
				secret,
				digits: 6,
				label: me.username,
				issuer: this.config.host,
			});
			const url = totp.toString();
			const qr = await QRCode.toDataURL(url);

			return {
				qr,
				url,
				secret: secret.base32,
				label: me.username,
				issuer: this.config.host,
			};
		});
	}
}
