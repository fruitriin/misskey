<script lang="ts">
import { defineComponent } from 'vue';
import * as mfm from 'mfm-js';
// ノートの実態はめんどくさいのでfakesから持ってきている
// 実際はEntryで認証なしでAPIを叩くなどする
import { note } from '@/../.storybook/fakes.ts';
// その場合、EntryはAPIを叩く、embedComponentsはレンダリングに注力する
import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
import { i18n } from '@/i18n.js';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import MkPoll from '@/components/MkPoll.vue';
import MkNoteSub from '@/components/MkNoteSub.vue';
import MkMediaList from '@/components/MkMediaList.vue';
import MkInstanceTicker from '@/components/MkInstanceTicker.vue';
import { defaultStore } from '@/store.js';
import { userPage } from '@/filters/user.js';
import { getNoteSummary } from '@/scripts/get-note-summary.js';
import { isEnabledUrlPreview } from '@/instance.js';
import number from '@/filters/number.js';

// TODO: Localeの判定とローカルストレージの設定の処理は行う必要がある
// Note: 今時点ではないので / で一度Misskey本体を表示してlocalstorageに入れてもらうといい感じ

// MkNotes類を呼んでしまうとなぜかos.tsが呼ばれてachivement処理が呼ばれるので
// MkNoteのほぼパクリみたいなコンポーネントは作る必要がある
// EmEntyNoteにベタ書きしているが、embedComponentsの役割である
export default defineComponent({
	components: {
		MkInstanceTicker, MkMediaList, MkNoteSub, MkPoll, MkCwButton, MkNoteHeader, MkUrlPreview,
		MkReactionsViewer,
	},
	data() {
		console.log({ fakeNote: note() });
		// MkNote互換っぽいデータを雑に用意する
		return {
			mock: true,
			isDeleted: false,
			isRenote: false,
			muted: false,
			isLong: false,
			translating: false,
			translation: false,
			collapsed: false,
			parsed: mfm.parse(note().text),
			showContent: false,
			canRenote: false,
			showTicker: false,
			renoteCollapsed: false,
			keymap: [],
			pinned: false,
			hardMuted: false,
			note: note(),
			appearNote: note(),
		};
	},
	computed: {
		isEnabledUrlPreview() {
			return false;
		},
		defaultStore() {
			return defaultStore;
		},
		i18n() {
			return i18n;
		},
	},
	// コンテキストメニュー等は中身が空のものに差し替えている
	methods: { number, getNoteSummary, userPage, showRenoteMenu: () => {}, onContextmenu: () => {}, renote: () => {} },
});
</script>

<template>
<div class=".embed-note">
	<div>EM Note</div>

	<div
		v-if="!hardMuted && muted === false"
		v-show="!isDeleted"
		ref="rootEl"
		v-hotkey="keymap"
		:class="[$style.root, { [$style.showActionsOnlyHover]: defaultStore.state.showNoteActionsOnlyHover }]"
		:tabindex="isDeleted ? '-1' : '0'"
	>
		<MkNoteSub v-if="appearNote.reply && !renoteCollapsed" :note="appearNote.reply" :class="$style.replyTo"/>
		<div v-if="pinned" :class="$style.tip"><i class="ti ti-pin"></i> {{ i18n.ts.pinnedNote }}</div>
		<div v-if="isRenote" :class="$style.renote">
			<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
			<MkAvatar :class="$style.renoteAvatar" :user="note.user" link preview/>
			<i class="ti ti-repeat" style="margin-right: 4px;"></i>
			<I18n :src="i18n.ts.renotedBy" tag="span" :class="$style.renoteText">
				<template #user>
<!--					<MkA v-user-preview="note.userId" :class="$style.renoteUserName" :to="userPage(note.user)">-->
					<MkA  :class="$style.renoteUserName" :to="userPage(note.user)">
						<MkUserName :user="note.user"/>
					</MkA>
				</template>
			</I18n>
			<div :class="$style.renoteInfo">
				<button ref="renoteTime" :class="$style.renoteTime" class="_button" @mousedown.prevent="showRenoteMenu()">
					<i class="ti ti-dots" :class="$style.renoteMenu"></i>
<!--					<MkTime :time="note.createdAt"/>-->
				</button>
				<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
					<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
					<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
					<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
				</span>
				<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
				<span v-if="note.channel" style="margin-left: 0.5em;" :title="note.channel.name"><i class="ti ti-device-tv"></i></span>
			</div>
		</div>
		<div v-if="renoteCollapsed" :class="$style.collapsedRenoteTarget">
			<MkAvatar :class="$style.collapsedRenoteTargetAvatar" :user="appearNote.user" link preview/>
			<!--			<Mfm :text="getNoteSummary(appearNote)" :plain="true" :nowrap="true" :author="appearNote.user" :nyaize="'respect'" :class="$style.collapsedRenoteTargetText" @click="renoteCollapsed = false"/>-->
		</div>
		<article v-else :class="$style.article" @contextmenu.stop="onContextmenu">
			<div v-if="appearNote.channel" :class="$style.colorBar" :style="{ background: appearNote.channel.color }"></div>
			<MkAvatar :class="$style.avatar" :user="appearNote.user" :link="!mock" :preview="!mock"/>
			<div :class="$style.main">
				<MkNoteHeader :note="appearNote" :mini="true"/>
				<MkInstanceTicker v-if="showTicker" :instance="appearNote.user.instance"/>
				<div style="container-type: inline-size;">
					<p v-if="appearNote.cw != null" :class="$style.cw">
						<Mfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :nyaize="'respect'"/>
						<MkCwButton v-model="showContent" :text="appearNote.text" :renote="appearNote.renote" :files="appearNote.files" :poll="appearNote.poll" style="margin: 4px 0;"/>
					</p>
					<div v-show="appearNote.cw == null || showContent" :class="[{ [$style.contentCollapsed]: collapsed }]">
						<div :class="$style.text">
							<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
							<MkA v-if="appearNote.replyId" :class="$style.replyIcon" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
							<Mfm
								v-if="appearNote.text"
								:parsedNodes="parsed"
								:text="appearNote.text"
								:author="appearNote.user"
								:nyaize="'respect'"
								:emojiUrls="appearNote.emojis"
								:enableEmojiMenu="true"
								:enableEmojiMenuReaction="true"
							/>
							<div v-if="translating || translation" :class="$style.translation">
								<MkLoading v-if="translating" mini/>
								<div v-else-if="translation">
									<b>{{ i18n.tsx.translatedFrom({ x: translation.sourceLang }) }}: </b>
									<Mfm :text="translation.text" :author="appearNote.user" :nyaize="'respect'" :emojiUrls="appearNote.emojis"/>
								</div>
							</div>
						</div>
						<div v-if="appearNote.files && appearNote.files.length > 0">
							<MkMediaList ref="galleryEl" :mediaList="appearNote.files"/>
						</div>
						<MkPoll v-if="appearNote.poll" :noteId="appearNote.id" :poll="appearNote.poll" :class="$style.poll"/>
						<div v-if="isEnabledUrlPreview">
							<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="false" :class="$style.urlPreview"/>
						</div>

						<button v-if="isLong && collapsed" :class="$style.collapsed" class="_button" @click="collapsed = false">
							<span :class="$style.collapsedLabel">{{ i18n.ts.showMore }}</span>
						</button>
						<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
							<span :class="$style.showLessLabel">{{ i18n.ts.showLess }}</span>
						</button>
					</div>
					<MkA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</MkA>
				</div>
				<MkReactionsViewer v-if="appearNote.reactionAcceptance !== 'likeOnly'" :note="appearNote" :maxNumber="16" @mockUpdateMyReaction="emitUpdReaction">
					<template #more>
						<MkA :to="`/notes/${appearNote.id}/reactions`" :class="[$style.reactionOmitted]">{{ i18n.ts.more }}</MkA>
					</template>
				</MkReactionsViewer>
				<footer :class="$style.footer">
					<button :class="$style.footerButton" class="_button" @click="reply()">
						<i class="ti ti-arrow-back-up"></i>
						<p v-if="appearNote.repliesCount > 0" :class="$style.footerButtonCount">{{ number(appearNote.repliesCount) }}</p>
					</button>
					<button
						v-if="canRenote"
						ref="renoteButton"
						:class="$style.footerButton"
						class="_button"
						@mousedown.prevent="renote()"
					>
						<i class="ti ti-repeat"></i>
						<p v-if="appearNote.renoteCount > 0" :class="$style.footerButtonCount">{{ number(appearNote.renoteCount) }}</p>
					</button>
					<button v-else :class="$style.footerButton" class="_button" disabled>
						<i class="ti ti-ban"></i>
					</button>
					<button ref="reactButton" :class="$style.footerButton" class="_button" @click="toggleReact()">
						<i v-if="appearNote.reactionAcceptance === 'likeOnly' && appearNote.myReaction != null" class="ti ti-heart-filled" style="color: var(--eventReactionHeart);"></i>
						<i v-else-if="appearNote.myReaction != null" class="ti ti-minus" style="color: var(--accent);"></i>
						<i v-else-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
						<i v-else class="ti ti-plus"></i>
						<p v-if="(appearNote.reactionAcceptance === 'likeOnly' || defaultStore.state.showReactionsCount) && appearNote.reactionCount > 0" :class="$style.footerButtonCount">{{ number(appearNote.reactionCount) }}</p>
					</button>
					<button v-if="defaultStore.state.showClipButtonInNoteFooter" ref="clipButton" :class="$style.footerButton" class="_button" @mousedown.prevent="clip()">
						<i class="ti ti-paperclip"></i>
					</button>
					<button ref="menuButton" :class="$style.footerButton" class="_button" @mousedown.prevent="showMenu()">
						<i class="ti ti-dots"></i>
					</button>
				</footer>
			</div>
		</article>
	</div>
	<div v-else-if="!hardMuted" :class="$style.muted" @click="muted = false">
		<I18n v-if="muted === 'sensitiveMute'" :src="i18n.ts.userSaysSomethingSensitive" tag="small">
			<template #name>
				<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
					<MkUserName :user="appearNote.user"/>
				</MkA>
			</template>
		</I18n>
		<I18n v-else :src="i18n.ts.userSaysSomething" tag="small">
			<template #name>
				<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
					<MkUserName :user="appearNote.user"/>
				</MkA>
			</template>
		</I18n>
	</div>
</div>
</template>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	font-size: 1.05em;
	overflow: clip;
	contain: content;

	// これらの指定はパフォーマンス向上には有効だが、ノートの高さは一定でないため、
	// 下の方までスクロールすると上のノートの高さがここで決め打ちされたものに変化し、表示しているノートの位置が変わってしまう
	// ノートがマウントされたときに自身の高さを取得し contain-intrinsic-size を設定しなおせばほぼ解決できそうだが、
	// 今度はその処理自体がパフォーマンス低下の原因にならないか懸念される。また、被リアクションでも高さは変化するため、やはり多少のズレは生じる
	// 一度レンダリングされた要素はブラウザがよしなにサイズを覚えておいてくれるような実装になるまで待った方が良さそう(なるのか？)
	//content-visibility: auto;
	//contain-intrinsic-size: 0 128px;

	&:focus-visible {
		outline: none;

		&::after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: dashed 2px var(--focus);
			border-radius: var(--radius);
			box-sizing: border-box;
		}
	}

	.footer {
		position: relative;
		z-index: 1;
	}

	&:hover > .article > .main > .footer > .footerButton {
		opacity: 1;
	}

	&.showActionsOnlyHover {
		.footer {
			visibility: hidden;
			position: absolute;
			top: 12px;
			right: 12px;
			padding: 0 4px;
			margin-bottom: 0 !important;
			background: var(--popup);
			border-radius: 8px;
			box-shadow: 0px 4px 32px var(--shadow);
		}

		.footerButton {
			font-size: 90%;

			&:not(:last-child) {
				margin-right: 0;
			}
		}
	}

	&.showActionsOnlyHover:hover {
		.footer {
			visibility: visible;
		}
	}
}

.tip {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 24px;
	font-size: 90%;
	white-space: pre;
	color: #d28a3f;
}

.tip + .article {
	padding-top: 8px;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.renote {
	position: relative;
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 28px;
	white-space: pre;
	color: var(--renote);

	& + .article {
		padding-top: 8px;
	}

	> .colorBar {
		height: calc(100% - 6px);
	}
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteUserName {
	font-weight: bold;
}

.renoteInfo {
	margin-left: auto;
	font-size: 0.9em;
}

.renoteTime {
	flex-shrink: 0;
	color: inherit;
}

.renoteMenu {
	margin-right: 4px;
}

.collapsedRenoteTarget {
	display: flex;
	align-items: center;
	line-height: 28px;
	white-space: pre;
	padding: 0 32px 18px;
}

.collapsedRenoteTargetAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
}

.collapsedRenoteTargetText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 90%;
	opacity: 0.7;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}
}

.article {
	position: relative;
	display: flex;
	padding: 28px 32px;
}

.colorBar {
	position: absolute;
	top: 8px;
	left: 8px;
	width: 5px;
	height: calc(100% - 16px);
	border-radius: 999px;
	pointer-events: none;
}

.avatar {
	flex-shrink: 0;
	display: block !important;
	margin: 0 14px 0 0;
	width: 58px;
	height: 58px;
	position: sticky !important;
	top: calc(22px + var(--stickyTop, 0px));
	left: 0;
}

.main {
	flex: 1;
	min-width: 0;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.showLess {
	width: 100%;
	margin-top: 14px;
	position: sticky;
	bottom: calc(var(--stickyBottom, 0px) + 14px);
}

.showLessLabel {
	display: inline-block;
	background: var(--popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.contentCollapsed {
	position: relative;
	max-height: 9em;
	overflow: clip;
}

.collapsed {
	display: block;
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 2;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--panel), color(from var(--panel) srgb r g b / 0));

	&:hover > .collapsedLabel {
		background: var(--panelHighlight);
	}
}

.collapsedLabel {
	display: inline-block;
	background: var(--panel);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.text {
	overflow-wrap: break-word;
}

.replyIcon {
	color: var(--accent);
	margin-right: 0.5em;
}

.translation {
	border: solid 0.5px var(--divider);
	border-radius: var(--radius);
	padding: 12px;
	margin-top: 8px;
}

.urlPreview {
	margin-top: 8px;
}

.poll {
	font-size: 80%;
}

.quote {
	padding: 8px 0;
}

.quoteNote {
	padding: 16px;
	border: dashed 1px var(--renote);
	border-radius: 8px;
	overflow: clip;
}

.channel {
	opacity: 0.7;
	font-size: 80%;
}

.footer {
	margin-bottom: -14px;
}

.footerButton {
	margin: 0;
	padding: 8px;
	opacity: 0.7;

	&:not(:last-child) {
		margin-right: 28px;
	}

	&:hover {
		color: var(--fgHighlighted);
	}
}

.footerButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;
}

@container (max-width: 580px) {
	.root {
		font-size: 0.95em;
	}

	.renote {
		padding: 12px 26px 0 26px;
	}

	.article {
		padding: 24px 26px;
	}

	.avatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}

	.renote {
		padding: 10px 22px 0 22px;
	}

	.article {
		padding: 20px 22px;
	}

	.footer {
		margin-bottom: -8px;
	}
}

@container (max-width: 480px) {
	.renote {
		padding: 8px 16px 0 16px;
	}

	.tip {
		padding: 8px 16px 0 16px;
	}

	.collapsedRenoteTarget {
		padding: 0 16px 9px;
		margin-top: 4px;
	}

	.article {
		padding: 14px 16px;
	}
}

@container (max-width: 450px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 46px;
		height: 46px;
		top: calc(14px + var(--stickyTop, 0px));
	}
}

@container (max-width: 400px) {
	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 18px;
			}
		}
	}
}

@container (max-width: 350px) {
	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 12px;
			}
		}
	}

	.colorBar {
		top: 6px;
		left: 6px;
		width: 4px;
		height: calc(100% - 12px);
	}
}

@container (max-width: 300px) {
	.avatar {
		width: 44px;
		height: 44px;
	}

	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 8px;
			}
		}
	}
}

@container (max-width: 250px) {
	.quoteNote {
		padding: 12px;
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}

.reactionOmitted {
	display: inline-block;
	margin-left: 8px;
	opacity: .8;
	font-size: 95%;
}
</style>
