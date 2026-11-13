/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 약관·처리방침에 표시할 운영자명 */
  readonly VITE_OPERATOR_NAME?: string;
  /** 약관·처리방침에 표시할 문의처 */
  readonly VITE_OPERATOR_CONTACT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
