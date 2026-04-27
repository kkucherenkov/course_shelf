import en from './locales/en';
import ru from './locales/ru';

// Plain TS modules (not JSON) — `@intlify/unplugin-vue-i18n` only claims
// `.json`/`.yaml` resource files, and `vite:json` only matches `.json`.
// Both stay out of the chain, leaving us with a normal JS module import
// whose default export reaches `messages` directly.
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, ru },
}));
