/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export enum NoteVisibilityWeight {
	PUBLIC = 0,
	HOME = 1,
	FOLLOWERS = 2,
	SPECIFIED = 3,
}

export function getVisibilityWeight(text: typeof Misskey.noteVisibilities[number]): NoteVisibilityWeight {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return noteVisibilityWeightMap.get(text)!;
}

export function getVisibilityType(weight: NoteVisibilityWeight): typeof Misskey.noteVisibilities[number] {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return [...noteVisibilityWeightMap.entries()].find(it => it[1] === weight)![0];
}

export function calcVisibilityRange(params: {
	reply?: Misskey.entities.Note,
	renote?: Misskey.entities.Note
}): NoteVisibilityWeight {
	const reply = params.reply?.visibility as typeof Misskey.noteVisibilities[number] | undefined;
	const renote = params.renote?.visibility as typeof Misskey.noteVisibilities[number] | undefined;

	if (reply && renote) {
		const replyWeight = getVisibilityWeight(reply);
		const renoteWeight = getVisibilityWeight(renote);

		// 両方あるときは数値が大きいほうを使う
		return replyWeight >= renoteWeight ? replyWeight : renoteWeight;
	} else if (!reply && !renote) {
		// 両方ないとき
		return NoteVisibilityWeight.PUBLIC;
	} else {
		// どちらか片方だけのときはある方を返す
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return getVisibilityWeight(reply ? reply! : renote!);
	}
}

const noteVisibilityWeightMap = new Map<typeof Misskey.noteVisibilities[number], NoteVisibilityWeight>(
	[
		['public', NoteVisibilityWeight.PUBLIC],
		['home', NoteVisibilityWeight.HOME],
		['followers', NoteVisibilityWeight.FOLLOWERS],
		['specified', NoteVisibilityWeight.SPECIFIED],
	],
);

