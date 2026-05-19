import type { AttemptData, SessionStats } from '../types';

/**
 * Вычисляет среднее арифметическое массива времён реакций
 */
export function calcAverageTime(reactionTimes: readonly number[]): number | null {
  if (reactionTimes.length === 0) return null;
  const sum = reactionTimes.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / reactionTimes.length);
}

/**
 * Находит лучшее (минимальное) время реакции
 */
export function calcBestTime(reactionTimes: readonly number[]): number | null {
  if (reactionTimes.length === 0) return null;
  return Math.min(...reactionTimes);
}

/**
 * Находит худшее (максимальное) время реакции
 */
export function calcWorstTime(reactionTimes: readonly number[]): number | null {
  if (reactionTimes.length === 0) return null;
  return Math.max(...reactionTimes);
}

/**
 * Вычисляет стандартное отклонение (мера стабильности реакции)
 * Чем ниже значение, тем стабильнее реакция
 */
export function calcStability(reactionTimes: readonly number[]): number | null {
  if (reactionTimes.length < 2) return null;
  const avg = calcAverageTime(reactionTimes);
  if (avg === null) return null;
  const squaredDiffs = reactionTimes.map((t) => Math.pow(t - avg, 2));
  const variance = squaredDiffs.reduce((acc, d) => acc + d, 0) / reactionTimes.length;
  return Math.round(Math.sqrt(variance));
}

/**
 * Создаёт начальную (пустую) статистику
 */
export function createInitialStats(totalAttempts: number): SessionStats {
  return {
    totalAttempts,
    completedAttempts: 0,
    hits: 0,
    misses: 0,
    falsePresses: 0,
    correctRejects: 0,
    averageReactionTime: null,
    bestReactionTime: null,
    worstReactionTime: null,
    reactionStability: null,
    reactionTimes: [],
  };
}

/**
 * Обновляет статистику на основании новой попытки
 */
export function updateStats(
  currentStats: SessionStats,
  attempt: AttemptData
): SessionStats {
  const newReactionTimes =
    attempt.result === 'hit' && attempt.reactionTime !== null
      ? [...currentStats.reactionTimes, attempt.reactionTime]
      : [...currentStats.reactionTimes];

  const hits = currentStats.hits + (attempt.result === 'hit' ? 1 : 0);
  const misses = currentStats.misses + (attempt.result === 'miss' ? 1 : 0);
  const falsePresses =
    currentStats.falsePresses + (attempt.result === 'false-press' ? 1 : 0);
  const correctRejects =
    currentStats.correctRejects + (attempt.result === 'correct-reject' ? 1 : 0);

  return {
    totalAttempts: currentStats.totalAttempts,
    completedAttempts: currentStats.completedAttempts + 1,
    hits,
    misses,
    falsePresses,
    correctRejects,
    averageReactionTime: calcAverageTime(newReactionTimes),
    bestReactionTime: calcBestTime(newReactionTimes),
    worstReactionTime: calcWorstTime(newReactionTimes),
    reactionStability: calcStability(newReactionTimes),
    reactionTimes: newReactionTimes,
  };
}

/**
 * Формирует финальную статистику сессии
 */
export function getFinalStats(attempts: readonly AttemptData[], totalAttempts: number): SessionStats {
  const reactionTimes = attempts
    .filter((a) => a.result === 'hit' && a.reactionTime !== null)
    .map((a) => a.reactionTime as number);

  return {
    totalAttempts,
    completedAttempts: attempts.length,
    hits: attempts.filter((a) => a.result === 'hit').length,
    misses: attempts.filter((a) => a.result === 'miss').length,
    falsePresses: attempts.filter((a) => a.result === 'false-press').length,
    correctRejects: attempts.filter((a) => a.result === 'correct-reject').length,
    averageReactionTime: calcAverageTime(reactionTimes),
    bestReactionTime: calcBestTime(reactionTimes),
    worstReactionTime: calcWorstTime(reactionTimes),
    reactionStability: calcStability(reactionTimes),
    reactionTimes,
  };
}
