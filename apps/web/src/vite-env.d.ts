/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __GIT_SHA__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Optional JWT for local browser testing when not inside Telegram (never commit real tokens). */
  readonly VITE_DEV_JWT?: string;
  /** For referral share links: Bot username without @ */
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  /** BotFather Mini App short name */
  readonly VITE_TELEGRAM_WEB_APP_SHORT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
