import { createApp } from 'vue';
import EmEntryNote from '@/embedSrcs/entryComponents/EmEntryNote.vue';
import mountGlobalComponents from '@/components';
const embedApp = createApp(EmEntryNote);

mountGlobalComponents(embedApp);

embedApp.mount('#embed-misskey');
