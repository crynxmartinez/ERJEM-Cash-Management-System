/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
