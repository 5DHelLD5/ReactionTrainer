import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GameState,
  GamePhase,
  SignalType,
  SignalShape,
  DifficultyLevel,
  AttemptData,
  AttemptResult,
  SavedSession,
} from '../types';
import { generateSignal, generateDelay, DIFFICULTY_CONFIGS } from '../utils/signals';
import { createInitialStats, updateStats, getFinalStats } from '../utils/statistics';
import { loadHistory, saveSession, clearHistory, generateUUID } from '../utils/storage';

/**
 * Основной хук логики игры.
 * Вся логика таймеров, состояния, обработки реакций изолирована здесь.
 */
export function useGameLogic() {
  // ---- Состояние игры ----
  const [gameState, setGameState] = useState<GameState>({
    phase: 'idle',
    currentAttempt: 0,
    currentSignal: null,
    currentShape: 'circle',
    difficulty: 'medium',
    attempts: [],
    stats: createInitialStats(20),
    lastResult: null,
    signalTimestamp: null,
  });

  // ---- История ----
  const [history, setHistory] = useState<SavedSession[]>([]);

  // ---- Рефы для таймеров ----
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signalTimestampRef = useRef<number>(0);

  // ---- Рефы для синхронного доступа к состоянию (без задержки useEffect) ----
  const phaseRef = useRef<GamePhase>('idle');
  const currentSignalRef = useRef<SignalType | null>(null);
  const currentAttemptRef = useRef<number>(0);
  const attemptsRef = useRef<AttemptData[]>([]);
  const statsRef = useRef(createInitialStats(20));
  const difficultyRef = useRef<DifficultyLevel>('medium');
  const shapeRef = useRef<SignalShape>('circle');
  const reactedRef = useRef<boolean>(false);

  // Загрузить историю при маунте
  useEffect(() => {
    loadHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  /**
   * Очистка всех таймеров
   */
  const clearAllTimers = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
  }, []);

  /**
   * Хелпер: обновляет и state, и ref синхронно, чтобы избежать race condition
   */
  const updateGameState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      // Синхронно обновляем рефы
      phaseRef.current = next.phase;
      currentSignalRef.current = next.currentSignal;
      currentAttemptRef.current = next.currentAttempt;
      return next;
    });
  }, []);

  /**
   * Завершает сессию, сохраняет результаты
   */
  const endSession = useCallback(async () => {
    clearAllTimers();

    const config = DIFFICULTY_CONFIGS[difficultyRef.current];
    const finalStats = getFinalStats(attemptsRef.current, config.totalAttempts);

    const session: SavedSession = {
      id: generateUUID(),
      date: new Date().toISOString(),
      difficulty: difficultyRef.current,
      shape: shapeRef.current,
      stats: finalStats,
    };

    // Сохраняем асинхронно в IndexedDB
    try {
      await saveSession(session);
      const updated = await loadHistory();
      setHistory(updated);
    } catch {
      // Фоллбэк: добавим сессию вручную в состояние
      setHistory((prev) => [session, ...prev].slice(0, 50));
    }

    phaseRef.current = 'finished';
    currentSignalRef.current = null;

    setGameState((prev) => ({
      ...prev,
      phase: 'finished',
      stats: finalStats,
      currentSignal: null,
    }));
  }, [clearAllTimers]);

  /**
   * Начинает следующую попытку
   */
  const startAttempt = useCallback(
    (attemptNum: number) => {
      const config = DIFFICULTY_CONFIGS[difficultyRef.current];

      // Проверяем: если попытки закончились — завершаем
      if (attemptNum > config.totalAttempts) {
        endSession();
        return;
      }

      reactedRef.current = false;

      // Синхронно обновляем рефы ДО setState
      phaseRef.current = 'waiting';
      currentSignalRef.current = null;
      currentAttemptRef.current = attemptNum;

      updateGameState((prev) => ({
        ...prev,
        phase: 'waiting',
        currentAttempt: attemptNum,
        currentSignal: null,
        lastResult: null,
        signalTimestamp: null,
      }));

      // Задержка перед сигналом
      const delay = generateDelay(config.minDelay, config.maxDelay);
      delayTimerRef.current = setTimeout(() => {
        const signal = generateSignal(config.goChance);
        const ts = performance.now();
        signalTimestampRef.current = ts;
        reactedRef.current = false;

        // Синхронно обновляем рефы
        phaseRef.current = 'signal';
        currentSignalRef.current = signal;

        updateGameState((prev) => ({
          ...prev,
          phase: 'signal',
          currentSignal: signal,
          signalTimestamp: ts,
        }));

        // Таймаут на реакцию
        reactionTimerRef.current = setTimeout(() => {
          // Время вышло
          if (reactedRef.current) return;

          let result: AttemptResult;
          if (signal === 'go') {
            result = 'miss'; // Пропустил зелёный
          } else {
            result = 'correct-reject'; // Верно не нажал на красный
          }

          const attempt: AttemptData = {
            attemptNumber: attemptNum,
            signalType: signal,
            result,
            reactionTime: null,
            timestamp: Date.now(),
          };

          attemptsRef.current = [...attemptsRef.current, attempt];
          const newStats = updateStats(statsRef.current, attempt);
          statsRef.current = newStats;

          phaseRef.current = 'feedback';
          currentSignalRef.current = null;

          updateGameState((prev) => ({
            ...prev,
            phase: 'feedback',
            lastResult: result,
            currentSignal: null,
            attempts: attemptsRef.current,
            stats: newStats,
          }));

          // Пауза и переход к следующей попытке
          feedbackTimerRef.current = setTimeout(() => {
            startAttempt(attemptNum + 1);
          }, 1000);
        }, config.reactionWindow);
      }, delay);
    },
    [endSession, updateGameState]
  );

  /**
   * Запуск сессии
   */
  const startSession = useCallback(() => {
    clearAllTimers();
    const config = DIFFICULTY_CONFIGS[difficultyRef.current];

    attemptsRef.current = [];
    statsRef.current = createInitialStats(config.totalAttempts);
    phaseRef.current = 'idle';
    currentSignalRef.current = null;
    currentAttemptRef.current = 0;

    updateGameState((prev) => ({
      ...prev,
      phase: 'idle',
      currentAttempt: 0,
      currentSignal: null,
      attempts: [],
      stats: createInitialStats(config.totalAttempts),
      lastResult: null,
      signalTimestamp: null,
    }));

    // Начнём попытку через маленькую задержку (отслеживаемый таймер)
    startTimerRef.current = setTimeout(() => {
      startAttempt(1);
    }, 100);
  }, [clearAllTimers, startAttempt, updateGameState]);

  /**
   * Сброс (экстренное завершение)
   */
  const resetSession = useCallback(() => {
    clearAllTimers();
    const config = DIFFICULTY_CONFIGS[difficultyRef.current];

    attemptsRef.current = [];
    statsRef.current = createInitialStats(config.totalAttempts);
    phaseRef.current = 'idle';
    currentSignalRef.current = null;
    currentAttemptRef.current = 0;

    updateGameState((prev) => ({
      ...prev,
      phase: 'idle',
      currentAttempt: 0,
      currentSignal: null,
      attempts: [],
      stats: createInitialStats(config.totalAttempts),
      lastResult: null,
      signalTimestamp: null,
    }));
  }, [clearAllTimers, updateGameState]);

  /**
   * Обработка реакции пользователя (нажатие пробела)
   */
  const processReaction = useCallback(() => {
    const phase = phaseRef.current;
    const signal = currentSignalRef.current;
    const attemptNum = currentAttemptRef.current;

    // Игнорируем нажатия вне активных фаз
    if (phase !== 'waiting' && phase !== 'signal') return;

    // Если пользователь нажал до сигнала (в фазе ожидания) — ложное нажатие
    if (phase === 'waiting') {
      reactedRef.current = true;
      clearAllTimers();

      const attempt: AttemptData = {
        attemptNumber: attemptNum,
        signalType: 'go', // сигнал ещё не был показан
        result: 'false-press',
        reactionTime: null,
        timestamp: Date.now(),
      };

      attemptsRef.current = [...attemptsRef.current, attempt];
      const newStats = updateStats(statsRef.current, attempt);
      statsRef.current = newStats;

      phaseRef.current = 'feedback';

      updateGameState((prev) => ({
        ...prev,
        phase: 'feedback',
        lastResult: 'false-press',
        currentSignal: null,
        attempts: attemptsRef.current,
        stats: newStats,
      }));

      feedbackTimerRef.current = setTimeout(() => {
        startAttempt(attemptNum + 1);
      }, 1000);

      return;
    }

    // Нажатие при активном сигнале
    if (phase === 'signal' && !reactedRef.current) {
      reactedRef.current = true;
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = null;
      }

      let result: AttemptResult;
      let reactionTime: number | null = null;

      if (signal === 'go') {
        // Правильная реакция!
        reactionTime = Math.round(performance.now() - signalTimestampRef.current);
        result = 'hit';
      } else {
        // Нажал на красный — ложное срабатывание
        result = 'false-press';
      }

      const attempt: AttemptData = {
        attemptNumber: attemptNum,
        signalType: signal ?? 'go',
        result,
        reactionTime,
        timestamp: Date.now(),
      };

      attemptsRef.current = [...attemptsRef.current, attempt];
      const newStats = updateStats(statsRef.current, attempt);
      statsRef.current = newStats;

      phaseRef.current = 'feedback';

      updateGameState((prev) => ({
        ...prev,
        phase: 'feedback',
        lastResult: result,
        currentSignal: null,
        attempts: attemptsRef.current,
        stats: newStats,
      }));

      feedbackTimerRef.current = setTimeout(() => {
        startAttempt(attemptNum + 1);
      }, 1000);
    }
  }, [clearAllTimers, startAttempt, updateGameState]);

  /**
   * Обработка глобального нажатия пробела
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Защита от repeat (удержание клавиши)
      if (e.repeat) return;
      if (e.code !== 'Space') return;
      e.preventDefault();

      processReaction();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [processReaction]);

  /**
   * Очистка таймеров при размонтировании
   */
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  /**
   * Смена сложности
   */
  const setDifficulty = useCallback(
    (d: DifficultyLevel) => {
      if (phaseRef.current !== 'idle' && phaseRef.current !== 'finished') return;
      difficultyRef.current = d;
      const config = DIFFICULTY_CONFIGS[d];
      setGameState((prev) => ({
        ...prev,
        difficulty: d,
        stats: createInitialStats(config.totalAttempts),
      }));
    },
    []
  );

  /**
   * Смена формы
   */
  const setShape = useCallback(
    (s: SignalShape) => {
      if (phaseRef.current !== 'idle' && phaseRef.current !== 'finished') return;
      shapeRef.current = s;
      setGameState((prev) => ({
        ...prev,
        currentShape: s,
      }));
    },
    []
  );

  /**
   * Очистка истории
   */
  const handleClearHistory = useCallback(async () => {
    try {
      await clearHistory();
    } catch {
      // Игнорируем ошибки очистки
    }
    setHistory([]);
  }, []);

  return {
    gameState,
    history,
    startSession,
    resetSession,
    processReaction,
    setDifficulty,
    setShape,
    handleClearHistory,
  };
}
