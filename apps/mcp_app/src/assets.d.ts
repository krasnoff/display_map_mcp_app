declare module "*.scss";

interface ImportMetaEnv {
  readonly MAPTILER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
