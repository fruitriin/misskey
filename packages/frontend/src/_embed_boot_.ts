import {createApp, markRaw} from 'vue';
import EmEntryNote from '@/embedSrcs/entryComponents/EmEntryNote.vue';
import mountGlobalComponents from '@/components';
import {updateI18n} from "@/i18n.js";
import {I18n} from "@/scripts/i18n.js";
import {locale} from "@/config.js";
const embedApp = createApp(EmEntryNote);

mountGlobalComponents(embedApp);

embedApp.mount('#embed-misskey');

