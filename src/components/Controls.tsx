import React from 'react';
import type { ControlsProps, DifficultyLevel, SignalShape } from '../types';

const DIFFICULTIES: { key: DifficultyLevel; label: string; color: string }[] = [
  { key: 'easy', label: 'Лёгкий', color: '#00e676' },
  { key: 'medium', label: 'Средний', color: '#ffc107' },
  { key: 'hard', label: 'Сложный', color: '#ff1744' },
];

const SHAPES: { key: SignalShape; label: string }[] = [
  { key: 'circle', label: 'Круг' },
  { key: 'square', label: 'Квадрат' },
  { key: 'traffic-light', label: 'Светофор' },
  { key: 'f1-lights', label: 'F1' },
];

/**
 * Блок управления: старт, сброс, выбор сложности и формы.
 */
const Controls: React.FC<ControlsProps> = ({
  phase,
  onStart,
  onReset,
  difficulty,
  onDifficultyChange,
  shape,
  onShapeChange,
}) => {
  const isPlaying = phase === 'waiting' || phase === 'signal' || phase === 'feedback';
  const canChangeSettings = phase === 'idle' || phase === 'finished';

  return (
    <div className="controls" id="controls">
      {/* Кнопки управления */}
      <div className="controls-buttons">
        <button
          className="btn btn--start"
          onClick={onStart}
          disabled={isPlaying}
          id="btn-start"
        >
          {phase === 'finished' ? 'Заново' : 'Старт'}
        </button>
        <button
          className="btn btn--reset"
          onClick={onReset}
          disabled={!isPlaying}
          id="btn-reset"
        >
          Сброс
        </button>
      </div>

      {/* Выбор сложности */}
      <div className={`controls-section ${!canChangeSettings ? 'controls-section--disabled' : ''}`}>
        <h3 className="controls-section-title">Сложность</h3>
        <div className="controls-options">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              className={`option-btn option-btn--difficulty ${difficulty === d.key ? 'option-btn--active' : ''}`}
              onClick={() => onDifficultyChange(d.key)}
              disabled={!canChangeSettings}
              id={`difficulty-${d.key}`}
              style={{ color: d.color }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Выбор формы */}
      <div className={`controls-section ${!canChangeSettings ? 'controls-section--disabled' : ''}`}>
        <h3 className="controls-section-title">Форма сигнала</h3>
        <div className="controls-options controls-options--shapes">
          {SHAPES.map((s) => (
            <button
              key={s.key}
              className={`option-btn option-btn--shape ${shape === s.key ? 'option-btn--active' : ''}`}
              onClick={() => onShapeChange(s.key)}
              disabled={!canChangeSettings}
              id={`shape-${s.key}`}
              title={s.label}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Подсказка */}
      {isPlaying && (
        <div className="controls-hint">
          <kbd>Пробел</kbd> — для реакции на зелёный сигнал
        </div>
      )}
    </div>
  );
};

export default Controls;
