/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * チャンネルが連合する設定 (federationPolicy が 'none' 以外) かどうか。
 * packed channel には federationPolicy が必ず含まれるが、古いキャッシュ等に備えて防御的に扱う。
 */
export function isFederatedChannel(channel: { federationPolicy?: 'none' | 'unlisted' | 'public' } | null | undefined): boolean {
	return (channel?.federationPolicy ?? 'none') !== 'none';
}
