/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUNNY_CDN_HOSTNAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
