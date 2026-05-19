/**
 * @jest-environment jsdom
 */
import { loadHistory, saveSession, clearHistory, generateUUID } from '../src/utils/storage';
import type { SavedSession, SessionStats } from '../src/types';

/**
 * Мок localStorage.
 * В тестовой среде jsdom IndexedDB недоступна, поэтому
 * database.ts автоматически откатится на localStorage.
 */
const mockStorage: Record<string, string> = {};
beforeAll(() => {
  // Убираем indexedDB, чтобы гарантировать фоллбэк на localStorage
  Object.defineProperty(window, 'indexedDB', {
    value: undefined,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    },
    writable: true,
  });
});

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
});

const createMockStats = (): SessionStats => ({
  totalAttempts: 20,
  completedAttempts: 20,
  hits: 10,
  misses: 3,
  falsePresses: 2,
  correctRejects: 5,
  averageReactionTime: 300,
  bestReactionTime: 150,
  worstReactionTime: 500,
  reactionStability: 50,
  reactionTimes: [150, 200, 300, 400, 500],
});

describe('generateUUID', () => {
  it('generates a valid UUID v4 format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique UUIDs', () => {
    const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
    expect(uuids.size).toBe(100);
  });
});

describe('loadHistory', () => {
  it('returns empty array when no data', async () => {
    expect(await loadHistory()).toEqual([]);
  });

  it('returns empty array for invalid JSON', async () => {
    mockStorage['reaction-trainer-history'] = 'not-json';
    expect(await loadHistory()).toEqual([]);
  });

  it('returns empty array for non-array JSON', async () => {
    mockStorage['reaction-trainer-history'] = '{"key": "value"}';
    expect(await loadHistory()).toEqual([]);
  });

  it('loads valid history', async () => {
    const sessions: SavedSession[] = [{
      id: 'test-id',
      date: new Date().toISOString(),
      difficulty: 'medium',
      shape: 'circle',
      stats: createMockStats(),
    }];
    mockStorage['reaction-trainer-history'] = JSON.stringify(sessions);
    const loaded = await loadHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('test-id');
  });
});

describe('saveSession', () => {
  it('saves a session to storage', async () => {
    const session: SavedSession = {
      id: generateUUID(),
      date: new Date().toISOString(),
      difficulty: 'easy',
      shape: 'circle',
      stats: createMockStats(),
    };
    await saveSession(session);
    const loaded = await loadHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].difficulty).toBe('easy');
  });

  it('prepends new sessions (newest first)', async () => {
    const s1: SavedSession = { id: '1', date: '2024-01-01', difficulty: 'easy', shape: 'circle', stats: createMockStats() };
    const s2: SavedSession = { id: '2', date: '2024-01-02', difficulty: 'hard', shape: 'circle', stats: createMockStats() };
    await saveSession(s1);
    await saveSession(s2);
    const loaded = await loadHistory();
    expect(loaded[0].id).toBe('2');
    expect(loaded[1].id).toBe('1');
  });

  it('limits history to 50 sessions', async () => {
    for (let i = 0; i < 55; i++) {
      await saveSession({ id: String(i), date: new Date().toISOString(), difficulty: 'medium', shape: 'circle', stats: createMockStats() });
    }
    expect(await loadHistory()).toHaveLength(50);
  });
});

describe('clearHistory', () => {
  it('removes all history', async () => {
    await saveSession({ id: '1', date: new Date().toISOString(), difficulty: 'medium', shape: 'circle', stats: createMockStats() });
    expect(await loadHistory()).toHaveLength(1);
    await clearHistory();
    expect(await loadHistory()).toEqual([]);
  });
});
