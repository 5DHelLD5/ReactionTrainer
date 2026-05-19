import type { SignalType, DifficultyLevel, DifficultyConfig } from '../types';

/**
 * Конфигурации уровней сложности
 */
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    labelRu: 'Лёгкий',
    description: 'Длинная задержка, много времени на реакцию, больше go-сигналов',
    minDelay: 1500,
    maxDelay: 3500,
    reactionWindow: 3000,
    goChance: 0.7,
    totalAttempts: 15,
  },
  medium: {
    label: 'Medium',
    labelRu: 'Средний',
    description: 'Стандартные настройки',
    minDelay: 600,
    maxDelay: 2500,
    reactionWindow: 1800,
    goChance: 0.5,
    totalAttempts: 20,
  },
  hard: {
    label: 'Hard',
    labelRu: 'Сложный',
    description: 'Минимальные задержки, молниеносная реакция',
    minDelay: 200,
    maxDelay: 800,
    reactionWindow: 800,
    goChance: 0.35,
    totalAttempts: 25,
  },
};

/**
 * Генерирует случайный сигнал (go / no-go) с заданной вероятностью
 */
export function generateSignal(goChance: number = 0.5): SignalType {
  return Math.random() < goChance ? 'go' : 'no-go';
}

/**
 * Генерирует случайную задержку в миллисекундах в заданном диапазоне
 */
export function generateDelay(min: number = 500, max: number = 3000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
