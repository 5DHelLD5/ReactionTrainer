import {
  calcAverageTime,
  calcBestTime,
  calcWorstTime,
  calcStability,
  createInitialStats,
  updateStats,
  getFinalStats,
} from '../src/utils/statistics';
import type { AttemptData } from '../src/types';

describe('calcAverageTime', () => {
  it('returns null for empty array', () => {
    expect(calcAverageTime([])).toBeNull();
  });

  it('calculates average for single value', () => {
    expect(calcAverageTime([250])).toBe(250);
  });

  it('calculates average for multiple values', () => {
    expect(calcAverageTime([200, 300, 400])).toBe(300);
  });

  it('rounds to nearest integer', () => {
    expect(calcAverageTime([100, 200, 301])).toBe(200);
  });
});

describe('calcBestTime', () => {
  it('returns null for empty array', () => {
    expect(calcBestTime([])).toBeNull();
  });

  it('returns min value', () => {
    expect(calcBestTime([300, 150, 400])).toBe(150);
  });
});

describe('calcWorstTime', () => {
  it('returns null for empty array', () => {
    expect(calcWorstTime([])).toBeNull();
  });

  it('returns max value', () => {
    expect(calcWorstTime([300, 150, 400])).toBe(400);
  });
});

describe('calcStability', () => {
  it('returns null for less than 2 values', () => {
    expect(calcStability([])).toBeNull();
    expect(calcStability([100])).toBeNull();
  });

  it('returns 0 for identical values', () => {
    expect(calcStability([200, 200, 200])).toBe(0);
  });

  it('calculates standard deviation', () => {
    const result = calcStability([200, 300, 400]);
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });
});

describe('createInitialStats', () => {
  it('creates stats with correct total', () => {
    const stats = createInitialStats(20);
    expect(stats.totalAttempts).toBe(20);
    expect(stats.completedAttempts).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.falsePresses).toBe(0);
    expect(stats.correctRejects).toBe(0);
    expect(stats.averageReactionTime).toBeNull();
    expect(stats.reactionTimes).toEqual([]);
  });
});

describe('updateStats', () => {
  it('increments hits on successful reaction', () => {
    const initial = createInitialStats(20);
    const attempt: AttemptData = {
      attemptNumber: 1,
      signalType: 'go',
      result: 'hit',
      reactionTime: 250,
      timestamp: Date.now(),
    };
    const updated = updateStats(initial, attempt);
    expect(updated.hits).toBe(1);
    expect(updated.completedAttempts).toBe(1);
    expect(updated.averageReactionTime).toBe(250);
    expect(updated.reactionTimes).toEqual([250]);
  });

  it('increments misses on missed signal', () => {
    const initial = createInitialStats(20);
    const attempt: AttemptData = {
      attemptNumber: 1,
      signalType: 'go',
      result: 'miss',
      reactionTime: null,
      timestamp: Date.now(),
    };
    const updated = updateStats(initial, attempt);
    expect(updated.misses).toBe(1);
    expect(updated.averageReactionTime).toBeNull();
  });

  it('increments falsePresses on false press', () => {
    const initial = createInitialStats(20);
    const attempt: AttemptData = {
      attemptNumber: 1,
      signalType: 'no-go',
      result: 'false-press',
      reactionTime: null,
      timestamp: Date.now(),
    };
    const updated = updateStats(initial, attempt);
    expect(updated.falsePresses).toBe(1);
  });

  it('increments correctRejects', () => {
    const initial = createInitialStats(20);
    const attempt: AttemptData = {
      attemptNumber: 1,
      signalType: 'no-go',
      result: 'correct-reject',
      reactionTime: null,
      timestamp: Date.now(),
    };
    const updated = updateStats(initial, attempt);
    expect(updated.correctRejects).toBe(1);
  });

  it('accumulates multiple attempts', () => {
    let stats = createInitialStats(20);
    const attempts: AttemptData[] = [
      { attemptNumber: 1, signalType: 'go', result: 'hit', reactionTime: 200, timestamp: 1 },
      { attemptNumber: 2, signalType: 'go', result: 'hit', reactionTime: 300, timestamp: 2 },
      { attemptNumber: 3, signalType: 'no-go', result: 'false-press', reactionTime: null, timestamp: 3 },
      { attemptNumber: 4, signalType: 'go', result: 'miss', reactionTime: null, timestamp: 4 },
    ];
    for (const a of attempts) {
      stats = updateStats(stats, a);
    }
    expect(stats.completedAttempts).toBe(4);
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.falsePresses).toBe(1);
    expect(stats.averageReactionTime).toBe(250);
    expect(stats.reactionTimes).toEqual([200, 300]);
  });
});

describe('getFinalStats', () => {
  it('aggregates all attempts into final stats', () => {
    const attempts: AttemptData[] = [
      { attemptNumber: 1, signalType: 'go', result: 'hit', reactionTime: 150, timestamp: 1 },
      { attemptNumber: 2, signalType: 'go', result: 'hit', reactionTime: 350, timestamp: 2 },
      { attemptNumber: 3, signalType: 'no-go', result: 'correct-reject', reactionTime: null, timestamp: 3 },
      { attemptNumber: 4, signalType: 'go', result: 'miss', reactionTime: null, timestamp: 4 },
      { attemptNumber: 5, signalType: 'no-go', result: 'false-press', reactionTime: null, timestamp: 5 },
    ];
    const final = getFinalStats(attempts, 20);
    expect(final.totalAttempts).toBe(20);
    expect(final.completedAttempts).toBe(5);
    expect(final.hits).toBe(2);
    expect(final.misses).toBe(1);
    expect(final.falsePresses).toBe(1);
    expect(final.correctRejects).toBe(1);
    expect(final.averageReactionTime).toBe(250);
    expect(final.bestReactionTime).toBe(150);
    expect(final.worstReactionTime).toBe(350);
    expect(final.reactionTimes).toEqual([150, 350]);
  });

  it('handles sessions with no hits', () => {
    const attempts: AttemptData[] = [
      { attemptNumber: 1, signalType: 'go', result: 'miss', reactionTime: null, timestamp: 1 },
      { attemptNumber: 2, signalType: 'no-go', result: 'false-press', reactionTime: null, timestamp: 2 },
    ];
    const final = getFinalStats(attempts, 20);
    expect(final.averageReactionTime).toBeNull();
    expect(final.bestReactionTime).toBeNull();
    expect(final.reactionTimes).toEqual([]);
  });
});
