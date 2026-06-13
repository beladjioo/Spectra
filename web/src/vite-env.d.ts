/// <reference types="vite/client" />
/// <reference types="w3c-web-usb" />

interface ImportMetaEnv {
  /** Cloudflare Web Analytics beacon token (optional; edge injection preferred). */
  readonly VITE_CF_BEACON?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
