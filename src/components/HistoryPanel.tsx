import React, { useState } from 'react';
import type { HistoryPanelProps, SavedSession } from '../types';

/**
 * Панель истории результатов.
 * Таблица прошлых сессий с возможностью очистки.
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({ sessions, onClear }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDifficultyLabel = (d: string): string => {
    switch (d) {
      case 'easy': return 'Лёгкий';
      case 'medium': return 'Средний';
      case 'hard': return 'Сложный';
      default: return d;
    }
  };

  const getDifficultyColor = (d: string): string => {
    switch (d) {
      case 'easy': return '#00e676';
      case 'medium': return '#ffc107';
      case 'hard': return '#ff1744';
      default: return 'inherit';
    }
  };

  const getScoreClass = (session: SavedSession): string => {
    const accuracy = session.stats.totalAttempts > 0
      ? ((session.stats.hits + session.stats.correctRejects) / session.stats.totalAttempts) * 100
      : 0;
    if (accuracy >= 80) return 'score--excellent';
    if (accuracy >= 60) return 'score--good';
    return 'score--poor';
  };

  const displaySessions = expanded ? sessions : sessions.slice(0, 5);

  if (sessions.length === 0) {
    return (
      <div className="history-panel" id="history-panel">
        <h3 className="history-title">История результатов</h3>
        <p className="history-empty">Пока нет завершённых сессий. Нажмите «Старт» для начала!</p>
      </div>
    );
  }

  return (
    <div className="history-panel" id="history-panel">
      <div className="history-header">
        <h3 className="history-title">История результатов</h3>
        <button className="btn btn--clear" onClick={onClear} id="btn-clear-history">
          Очистить
        </button>
      </div>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сложность</th>
              <th>Ср. время</th>
              <th>Попадания</th>
              <th>Пропуски</th>
              <th>Ложные</th>
              <th>Стабильность</th>
            </tr>
          </thead>
          <tbody>
            {displaySessions.map((session) => (
              <tr key={session.id} className={getScoreClass(session)}>
                <td className="history-date">{formatDate(session.date)}</td>
                <td>
                  <span
                    className="history-difficulty"
                    style={{ color: getDifficultyColor(session.difficulty) }}
                  >
                    {getDifficultyLabel(session.difficulty)}
                  </span>
                </td>
                <td className="history-time">
                  {session.stats.averageReactionTime !== null
                    ? `${session.stats.averageReactionTime} мс`
                    : '—'}
                </td>
                <td className="history-hits">{session.stats.hits}</td>
                <td className="history-misses">{session.stats.misses}</td>
                <td className="history-false">{session.stats.falsePresses}</td>
                <td className="history-stability">
                  {session.stats.reactionStability !== null
                    ? `±${session.stats.reactionStability} мс`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length > 5 && (
        <button
          className="btn btn--expand"
          onClick={() => setExpanded(!expanded)}
          id="btn-toggle-history"
        >
          {expanded ? 'Свернуть' : `Показать все (${sessions.length})`}
        </button>
      )}
    </div>
  );
};

export default HistoryPanel;
