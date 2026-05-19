/**
 * Типы сигналов: целевой (go) или запрещающий (no-go)
 */
export type SignalType = 'go' | 'no-go';

/**
 * Форма сигнала для визуализации
 */
export type SignalShape = 'circle' | 'square' | 'traffic-light' | 'f1-lights';

/**
 * Уровни сложности
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Конфигурация сложности
 */
export interface DifficultyConfig {
  readonly label: string;
  readonly labelRu: string;
  readonly description: string;
  readonly minDelay: number;       // мин. задержка перед сигналом (мс)
  readonly maxDelay: number;       // макс. задержка перед сигналом (мс)
  readonly reactionWindow: number; // время на реакцию (мс)
  readonly goChance: number;       // вероятность go-сигнала (0-1)
  readonly totalAttempts: number;  // количество попыток в сессии
}

/**
 * Результат одной попытки
 */
export type AttemptResult = 'hit' | 'miss' | 'false-press' | 'correct-reject';

/**
 * Данные одной попытки
 */
export interface AttemptData {
  readonly attemptNumber: number;
  readonly signalType: SignalType;
  readonly result: AttemptResult;
  readonly reactionTime: number | null; // null если не было нажатия
  readonly timestamp: number;
}

/**
 * Статистика текущей сессии
 */
export interface SessionStats {
  readonly totalAttempts: number;
  readonly completedAttempts: number;
  readonly hits: number;
  readonly misses: number;
  readonly falsePresses: number;
  readonly correctRejects: number;
  readonly averageReactionTime: number | null;
  readonly bestReactionTime: number | null;
  readonly worstReactionTime: number | null;
  readonly reactionStability: number | null; // стандартное отклонение
  readonly reactionTimes: readonly number[];
}

/**
 * Фазы игры
 */
export type GamePhase =
  | 'idle'       // ожидание старта
  | 'waiting'    // задержка перед сигналом
  | 'signal'     // сигнал показан, ждём реакцию
  | 'feedback'   // показ результата попытки
  | 'finished';  // сессия завершена

/**
 * Состояние игры
 */
export interface GameState {
  readonly phase: GamePhase;
  readonly currentAttempt: number;
  readonly currentSignal: SignalType | null;
  readonly currentShape: SignalShape;
  readonly difficulty: DifficultyLevel;
  readonly attempts: readonly AttemptData[];
  readonly stats: SessionStats;
  readonly lastResult: AttemptResult | null;
  readonly signalTimestamp: number | null;
}

/**
 * Сохранённая сессия в истории
 */
export interface SavedSession {
  readonly id: string;
  readonly date: string;
  readonly difficulty: DifficultyLevel;
  readonly shape: SignalShape;
  readonly stats: SessionStats;
}

/**
 * Props для компонентов
 */
export interface SignalAreaProps {
  readonly phase: GamePhase;
  readonly signalType: SignalType | null;
  readonly shape: SignalShape;
  readonly lastResult: AttemptResult | null;
}

export interface StatsPanelProps {
  readonly stats: SessionStats;
  readonly currentAttempt: number;
  readonly totalAttempts: number;
  readonly phase: GamePhase;
}

export interface ControlsProps {
  readonly phase: GamePhase;
  readonly onStart: () => void;
  readonly onReset: () => void;
  readonly difficulty: DifficultyLevel;
  readonly onDifficultyChange: (d: DifficultyLevel) => void;
  readonly shape: SignalShape;
  readonly onShapeChange: (s: SignalShape) => void;
}

export interface HistoryPanelProps {
  readonly sessions: readonly SavedSession[];
  readonly onClear: () => void;
}
