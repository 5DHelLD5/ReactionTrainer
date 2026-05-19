import type { SavedSession } from '../types';
import { dbLoadHistory, dbSaveSession, dbClearHistory } from './database';

/**
 * Генерирует уникальный UUID v4
 */
export function generateUUID(): string {
  // Используем crypto.randomUUID, если доступен (современные браузеры)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Фоллбэк для старых браузеров
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Загружает историю сессий из БД (IndexedDB с фоллбэком на localStorage)
 */
export async function loadHistory(): Promise<SavedSession[]> {
  return dbLoadHistory();
}

/**
 * Сохраняет одну сессию в БД
 */
export async function saveSession(session: SavedSession): Promise<void> {
  return dbSaveSession(session);
}

/**
 * Очищает всю историю
 */
export async function clearHistory(): Promise<void> {
  return dbClearHistory();
}
