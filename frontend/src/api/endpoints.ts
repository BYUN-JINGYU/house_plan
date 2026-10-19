// 백엔드 주소 목록 (타입 포함)
import type { LedgerEntry, NewEntry } from '../domain/ledger';
import type { QuoteBook } from '../domain/pricing';
import { request } from './client';

export type DocKey = 'plan' | 'people' | 'checks';
export interface DocOut { data: unknown; version: number; updatedAt: string }
export interface QuotesOut { quotes: QuoteBook; missing: string[] }
export interface Backup { format: 'houseplan-backup'; version: 1; docs: Record<string, unknown>; ledger?: unknown[] }

export const auth = {
  me: () => request<{ ok: boolean; open?: boolean }>('GET', '/api/auth/me'),
  login: (password: string) => request<void>('POST', '/api/auth/login', { password }),
  logout: () => request<void>('POST', '/api/auth/logout'),
};

export const docs = {
  all: () => request<Partial<Record<DocKey, DocOut>>>('GET', '/api/docs'),
  put: (key: DocKey, data: unknown, version: number) => request<DocOut>('PUT', `/api/docs/${key}`, { data, version }),
};

export const ledger = {
  list: (from: string, to: string) => request<LedgerEntry[]>('GET', `/api/ledger?from=${from}&to=${to}`),
  add: (e: NewEntry) => request<LedgerEntry>('POST', '/api/ledger', e),
  update: (id: number, e: NewEntry) => request<LedgerEntry>('PUT', `/api/ledger/${id}`, e),
  remove: (id: number) => request<void>('DELETE', `/api/ledger/${id}`),
};

export const quotes = {
  get: (keys: string[], force = false) =>
    request<QuotesOut>('GET', `/api/quotes?symbols=${encodeURIComponent(keys.join(','))}${force ? '&force=true' : ''}`),
};

export const backup = {
  download: () => request<Backup>('GET', '/api/backup'),
  restore: (b: Backup) => request<{ docs: string[]; ledger: number | null }>('POST', '/api/backup', b),
};
