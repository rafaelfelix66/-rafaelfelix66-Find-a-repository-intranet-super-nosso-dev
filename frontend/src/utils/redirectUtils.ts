// src/utils/redirectUtils.ts - Utilitários para gerenciar redirecionamentos
export interface RedirectInfo {
  path: string;
  search?: string;
  hash?: string;
  state?: any;
}

// Chaves para localStorage
const REDIRECT_KEYS = {
  PENDING: 'auth_pending_redirect',
  FALLBACK: 'auth_fallback_redirect',
  HISTORY: 'auth_redirect_history'
} as const;

/**
 * Classe para gerenciar redirecionamentos de forma