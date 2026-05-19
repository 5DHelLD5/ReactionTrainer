import type { SavedSession } from '../types';

/**
 * Модуль работы с localStorage.
 *
 * Схема:
 *   - Ключ: "reaction-trainer-history"
 *   - Значение: JSON-массив SavedSession[], максимум MAX_SESSIONS записей
 */

const LS_KEY = 'reaction-trainer-history';
const MAX_SESSIONS = 50;

/* ====================================================================
   Внутренние функции
   ==================================================================== */

function lsLoad(): SavedSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedSession[]) : [];
  } catch {
    return [];
  }
}

function lsSave(session: SavedSession): void {
  const history = lsLoad();
  history.unshift(session);
  localStorage.setItem(LS_KEY, JSON.stringify(history.slice(0, MAX_SESSIONS)));
}

function lsClear(): void {
  localStorage.removeItem(LS_KEY);
}

/* ====================================================================
   Публичный API
   ==================================================================== */

/**
 * Загружает историю сессий из localStorage
 */
export async function dbLoadHistory(): Promise<SavedSession[]> {
  return lsLoad();
}

/**
 * Сохраняет одну сессию в localStorage
 */
export async function dbSaveSession(session: SavedSession): Promise<void> {
  lsSave(session);
}

/**
 * Очищает всю историю
 */
export async function dbClearHistory(): Promise<void> {
  lsClear();
}
