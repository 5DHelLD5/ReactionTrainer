import React from 'react';
import SignalArea from './components/SignalArea';
import StatsPanel from './components/StatsPanel';
import Controls from './components/Controls';
import HistoryPanel from './components/HistoryPanel';
import { useGameLogic } from './hooks/useGameLogic';
import { DIFFICULTY_CONFIGS } from './utils/signals';

const App: React.FC = () => {
  const {
    gameState,
    history,
    startSession,
    resetSession,
    setDifficulty,
    setShape,
    handleClearHistory,
  } = useGameLogic();

  const config = DIFFICULTY_CONFIGS[gameState.difficulty];

  return (
    <div className="app" id="app-root">
      {/* Фоновые элементы */}
      <div className="bg-glow bg-glow--1" />
      <div className="bg-glow bg-glow--2" />
      <div className="bg-glow bg-glow--3" />

      {/* Заголовок */}
      <header className="app-header" id="app-header">
        <h1 className="app-title">
          Тренажёр реакции
          <span className="app-title-badge">Go/No-Go</span>
        </h1>
        <p className="app-subtitle">
          Нажимайте <kbd>Пробел</kbd> на зелёный сигнал • Игнорируйте красный
        </p>
      </header>

      {/* Основной контент */}
      <main className="app-main">
        {/* Левая колонка: управление */}
        <aside className="app-sidebar app-sidebar--left" id="sidebar-left">
          <Controls
            phase={gameState.phase}
            onStart={startSession}
            onReset={resetSession}
            difficulty={gameState.difficulty}
            onDifficultyChange={setDifficulty}
            shape={gameState.currentShape}
            onShapeChange={setShape}
          />
        </aside>

        {/* Центр: сигнал */}
        <section className="app-center" id="app-center">
          <SignalArea
            phase={gameState.phase}
            signalType={gameState.currentSignal}
            shape={gameState.currentShape}
            lastResult={gameState.lastResult}
          />
        </section>

        {/* Правая колонка: статистика */}
        <aside className="app-sidebar app-sidebar--right" id="sidebar-right">
          <StatsPanel
            stats={gameState.stats}
            currentAttempt={gameState.currentAttempt}
            totalAttempts={config.totalAttempts}
            phase={gameState.phase}
          />
        </aside>
      </main>

      {/* История */}
      <footer className="app-footer" id="app-footer">
        <HistoryPanel sessions={history} onClear={handleClearHistory} />
      </footer>
    </div>
  );
};

export default App;
