import React from 'react';
import type { SignalAreaProps, GamePhase, SignalType, AttemptResult } from '../types';

/* ====================================================================
   Утилита: цвет на основе фазы
   ==================================================================== */
function resolveColor(
  phase: GamePhase,
  signalType: SignalType | null,
  lastResult: AttemptResult | null
): string {
  if (phase === 'signal' && signalType === 'go') return '#00e676';
  if (phase === 'signal' && signalType === 'no-go') return '#ff1744';
  if (phase === 'waiting') return '#546e7a';
  if (phase === 'feedback') {
    switch (lastResult) {
      case 'hit': return '#00e676';
      case 'miss': return '#ff9800';
      case 'false-press': return '#ff1744';
      case 'correct-reject': return '#00bcd4';
      default: return '#546e7a';
    }
  }
  return '#37474f';
}

/* ====================================================================
   Светофор (3 огня: красный / жёлтый / зелёный)
   ==================================================================== */
function TrafficLight({
  phase, signalType, lastResult,
}: {
  phase: GamePhase; signalType: SignalType | null; lastResult: AttemptResult | null;
}) {
  const dim = '#1a1a1a';

  const getColors = (): [string, string, string] => {
    // [red, yellow, green]
    if (phase === 'idle' || phase === 'finished') return [dim, dim, dim];
    if (phase === 'waiting') return ['#4a1a1a', '#4a3a0a', '#0a3a0a']; // тусклые
    if (phase === 'signal' && signalType === 'go') return [dim, dim, '#00e676'];
    if (phase === 'signal' && signalType === 'no-go') return ['#ff1744', dim, dim];
    if (phase === 'feedback') {
      const c = resolveColor(phase, signalType, lastResult);
      switch (lastResult) {
        case 'hit': return [dim, dim, c]; // зелёный
        case 'miss': return [dim, c, dim]; // жёлтый
        case 'false-press': return [c, dim, dim]; // красный
        case 'correct-reject': return [dim, dim, c]; // cyan на месте зелёного
        default: return [dim, dim, dim];
      }
    }
    return [dim, dim, dim];
  };

  const [red, yellow, green] = getColors();

  const glow = (color: string): string =>
    color === dim ? 'none' : `0 0 12px ${color}, 0 0 24px ${color}55`;

  return (
    <div className="tl-body">
      <div className="tl-light" style={{ backgroundColor: red, boxShadow: glow(red) }} />
      <div className="tl-light" style={{ backgroundColor: yellow, boxShadow: glow(yellow) }} />
      <div className="tl-light" style={{ backgroundColor: green, boxShadow: glow(green) }} />
    </div>
  );
}


/* ====================================================================
   Светофор F1 (5 огней в ряд)
   ==================================================================== */
function F1Lights({
  phase, signalType, lastResult,
}: {
  phase: GamePhase; signalType: SignalType | null; lastResult: AttemptResult | null;
}) {
  const getLightState = (): { color: string; lit: boolean; glowColor: string } => {
    if (phase === 'idle' || phase === 'finished')
      return { color: '#1e272e', lit: false, glowColor: 'transparent' };
    if (phase === 'waiting')
      return { color: '#cc0000', lit: true, glowColor: '#ff1744' };
    if (phase === 'signal' && signalType === 'go')
      return { color: '#0a1a0a', lit: false, glowColor: 'transparent' };
    if (phase === 'signal' && signalType === 'no-go')
      return { color: '#ff1744', lit: true, glowColor: '#ff1744' };
    if (phase === 'feedback') {
      const c = resolveColor(phase, signalType, lastResult);
      return { color: c, lit: true, glowColor: c };
    }
    return { color: '#1e272e', lit: false, glowColor: 'transparent' };
  };

  const { color, lit, glowColor } = getLightState();
  const lightStyle: React.CSSProperties = {
    backgroundColor: color,
    boxShadow: lit ? `0 0 14px ${glowColor}, 0 0 28px ${glowColor}55` : 'none',
    borderColor: lit ? `${glowColor}80` : 'rgba(80, 80, 100, 0.4)',
  };
  const panelStyle: React.CSSProperties =
    phase === 'signal' && signalType === 'go'
      ? { boxShadow: 'inset 0 0 30px rgba(0,230,118,0.15), 0 0 20px rgba(0,230,118,0.2)' }
      : {};

  return (
    <div className="f1-lights-panel" style={panelStyle}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="f1-light" style={lightStyle} />
      ))}
    </div>
  );
}

/* ====================================================================
   Текст обратной связи
   ==================================================================== */
function getFeedbackLabel(r: AttemptResult | null): string {
  switch (r) {
    case 'hit': return 'Попадание!';
    case 'miss': return 'Пропуск!';
    case 'false-press': return 'Ложное нажатие!';
    case 'correct-reject': return 'Верно!';
    default: return '';
  }
}
function getFeedbackClass(r: AttemptResult | null): string {
  switch (r) {
    case 'hit': return 'signal-feedback--hit';
    case 'miss': return 'signal-feedback--miss';
    case 'false-press': return 'signal-feedback--false';
    case 'correct-reject': return 'signal-feedback--correct';
    default: return '';
  }
}

/* ====================================================================
   Главный компонент — SignalArea
   ==================================================================== */
const SignalArea: React.FC<SignalAreaProps> = ({ phase, signalType, shape, lastResult }) => {
  let colorClass = 'signal--idle';
  let pulseClass = '';

  if (phase === 'waiting') {
    colorClass = 'signal--waiting';
    pulseClass = 'signal--pulse';
  } else if (phase === 'signal' && signalType === 'go') {
    colorClass = 'signal--go';
    pulseClass = 'signal--active';
  } else if (phase === 'signal' && signalType === 'no-go') {
    colorClass = 'signal--nogo';
    pulseClass = 'signal--active';
  } else if (phase === 'feedback') {
    switch (lastResult) {
      case 'hit': colorClass = 'signal--feedback-hit'; break;
      case 'miss': colorClass = 'signal--feedback-miss'; break;
      case 'false-press': colorClass = 'signal--feedback-false'; break;
      case 'correct-reject': colorClass = 'signal--feedback-correct'; break;
    }
  } else if (phase === 'finished') {
    colorClass = 'signal--finished';
  }

  const shapeColor = resolveColor(phase, signalType, lastResult);
  const isSpecial = shape === 'f1-lights' || shape === 'traffic-light';

  // Подсказка для авто — инвертированная логика
  const getHintText = (): string => {
    if (phase === 'idle') return 'Нажмите «Старт» для начала';
    if (phase === 'waiting') return 'Приготовьтесь...';
    if (phase === 'signal' && signalType === 'go') {
      return 'ЖМИТЕ ПРОБЕЛ!';
    }
    if (phase === 'signal' && signalType === 'no-go') {
      return 'НЕ НАЖИМАЙТЕ!';
    }
    if (phase === 'finished') return 'Сессия завершена!';
    return '';
  };

  const feedbackLabel = phase === 'feedback' ? getFeedbackLabel(lastResult) : '';
  const feedbackClass = phase === 'feedback' ? getFeedbackClass(lastResult) : '';

  // Свечение для простых фигур
  const shapeGlow =
    phase === 'signal' ? `0 0 30px ${shapeColor}66`
    : phase === 'feedback' ? `0 0 20px ${shapeColor}44`
    : 'none';

  // Определяем контейнерный CSS-класс
  const containerClass = isSpecial
    ? `signal-container signal-container--special ${colorClass} ${pulseClass}`
    : `signal-container ${colorClass} ${pulseClass}`;

  return (
    <div className="signal-area" id="signal-area">
      <div className={containerClass}>
        {shape === 'f1-lights' && (
          <F1Lights phase={phase} signalType={signalType} lastResult={lastResult} />
        )}
        {shape === 'traffic-light' && (
          <TrafficLight phase={phase} signalType={signalType} lastResult={lastResult} />
        )}
        {!isSpecial && (
          <div
            className={`signal-shape signal-shape--${shape}`}
            style={{ backgroundColor: shapeColor, boxShadow: shapeGlow }}
          />
        )}
      </div>

      <div className="signal-text-area">
        {feedbackLabel ? (
          <p className={`signal-feedback-label ${feedbackClass}`}>{feedbackLabel}</p>
        ) : (
          <p className={`signal-hint ${phase === 'signal' ? 'signal-hint--active' : ''}`}>
            {getHintText()}
          </p>
        )}
      </div>
    </div>
  );
};

export default SignalArea;
