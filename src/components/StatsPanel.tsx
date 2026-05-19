import React from 'react';
import type { StatsPanelProps } from '../types';

/**
 * Панель статистики текущей сессии.
 * Отображает прогресс, среднее время, ошибки и стабильность.
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ stats, currentAttempt, totalAttempts, phase }) => {
  const isActive = phase !== 'idle';
  const progressPercent = totalAttempts > 0
    ? Math.round((stats.completedAttempts / totalAttempts) * 100)
    : 0;

  const formatTime = (ms: number | null): string => {
    if (ms === null) return '—';
    return `${ms} мс`;
  };

  const getStabilityLabel = (stability: number | null): string => {
    if (stability === null) return '—';
    if (stability <= 30) return `${stability} мс (Отличная)`;
    if (stability <= 60) return `${stability} мс (Хорошая)`;
    if (stability <= 100) return `${stability} мс (Средняя)`;
    return `${stability} мс (Низкая)`;
  };

  const getStabilityClass = (stability: number | null): string => {
    if (stability === null) return '';
    if (stability <= 30) return 'stat-value--excellent';
    if (stability <= 60) return 'stat-value--good';
    if (stability <= 100) return 'stat-value--medium';
    return 'stat-value--poor';
  };

  return (
    <div className={`stats-panel ${isActive ? 'stats-panel--active' : ''}`} id="stats-panel">
      {/* Индикатор попытки */}
      <div className="stats-attempt-indicator">
        <span className="stats-attempt-label">Попытка</span>
        <span className="stats-attempt-value">
          {phase === 'idle' ? '—' : `${currentAttempt} / ${totalAttempts}`}
        </span>
      </div>

      {/* Прогресс бар */}
      <div className="stats-progress">
        <div className="stats-progress-bar">
          <div
            className="stats-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="stats-progress-text">{progressPercent}%</span>
      </div>

      {/* Основные метрики */}
      <div className="stats-grid">
        <div className="stat-card" id="stat-avg-time">
          <div className="stat-info">
            <span className="stat-label">Среднее время</span>
            <span className="stat-value">{formatTime(stats.averageReactionTime)}</span>
          </div>
        </div>

        <div className="stat-card" id="stat-best-time">
          <div className="stat-info">
            <span className="stat-label">Лучшее</span>
            <span className="stat-value stat-value--excellent">
              {formatTime(stats.bestReactionTime)}
            </span>
          </div>
        </div>

        <div className="stat-card" id="stat-worst-time">
          <div className="stat-info">
            <span className="stat-label">Худшее</span>
            <span className="stat-value">{formatTime(stats.worstReactionTime)}</span>
          </div>
        </div>

        <div className="stat-card" id="stat-hits">
          <div className="stat-info">
            <span className="stat-label">Попадания</span>
            <span className="stat-value stat-value--excellent">{stats.hits}</span>
          </div>
        </div>

        <div className="stat-card" id="stat-misses">
          <div className="stat-info">
            <span className="stat-label">Пропуски</span>
            <span className="stat-value stat-value--poor">{stats.misses}</span>
          </div>
        </div>

        <div className="stat-card" id="stat-false">
          <div className="stat-info">
            <span className="stat-label">Ложные нажатия</span>
            <span className="stat-value stat-value--poor">{stats.falsePresses}</span>
          </div>
        </div>

        <div className="stat-card" id="stat-correct-rejects">
          <div className="stat-info">
            <span className="stat-label">Верные отказы</span>
            <span className="stat-value stat-value--good">{stats.correctRejects}</span>
          </div>
        </div>

        <div className="stat-card" id="stat-stability">
          <div className="stat-info">
            <span className="stat-label">Стабильность</span>
            <span className={`stat-value ${getStabilityClass(stats.reactionStability)}`}>
              {getStabilityLabel(stats.reactionStability)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
