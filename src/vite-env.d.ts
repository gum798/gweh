/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_API_KEY: string;
  readonly VITE_NASA_API_KEY: string;
  readonly VITE_POLAR_PRODUCT_ID: string;
  readonly VITE_POLAR_SANDBOX_PRODUCT_ID: string;
  readonly VITE_POLAR_SANDBOX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
