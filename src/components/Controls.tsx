import { useCallback } from 'react';
import type { Stage, Mode } from '../types';
import styles from './Controls.module.css';

interface ControlsProps {
  stage: Stage;
  substage: number;
  numSubstages: number;
  mode: Mode;
  theme: string;
  fontSize: string;
  onPrevStage: () => void;
  onNextStage: () => void;
  onSetMode: (mode: Mode) => void;
  onRevealAll: () => void;
  onReset: () => void;
  onNextSubstage: () => void;
  onBack: () => void;
  onToggleTheme: () => void;
  onCycleFontSize: () => void;
  onShowHelp: () => void;
}

export default function Controls({
  stage,
  substage,
  numSubstages,
  mode,
  theme,
  fontSize,
  onPrevStage,
  onNextStage,
  onSetMode,
  onRevealAll,
  onReset,
  onNextSubstage,
  onBack,
  onToggleTheme,
  onCycleFontSize,
  onShowHelp,
}: ControlsProps) {
  const toggleMode = useCallback(() => {
    onSetMode(mode === 'click' ? 'type' : 'click');
  }, [mode, onSetMode]);

  return (
    <div className={styles.controls}>
      {/* Left: back + stage nav */}
      <div className={styles.group}>
        <button className="btn-ghost" onClick={onBack} title="Enter new text [Esc in click mode]">
          ← New text
        </button>
        <button
          className="btn-secondary"
          onClick={onPrevStage}
          disabled={stage === 0}
          title="Previous stage [←]"
        >
          ‹ Prev
        </button>
        <button
          className="btn-secondary"
          onClick={onNextStage}
          disabled={stage === 3}
          title="Next stage [→]"
        >
          Next ›
        </button>
      </div>

      {/* Right: mode + reveal + reset + display + help */}
      <div className={styles.group}>
        <button
          className={mode === 'type' ? 'btn-active' : 'btn-secondary'}
          onClick={toggleMode}
          title={mode === 'click' ? 'Switch to Type mode [M]' : 'Switch to Click mode [Esc]'}
        >
          {mode === 'click' ? '⌨ Type mode' : '🖱 Click mode'}
        </button>
        {stage > 0 && mode === 'click' && (
          <button className="btn-secondary" onClick={onRevealAll} title="Reveal all hidden words [A]">
            Reveal all
          </button>
        )}
        {stage > 0 && substage < numSubstages && (
          <button
            className="btn-secondary"
            onClick={onNextSubstage}
            title={`Add the next batch of hidden words (step ${substage}/${numSubstages}) [W]`}
          >
            + More words
          </button>
        )}
        <button className="btn-ghost" onClick={onReset} title="Reset — hide all words again [R]">
          ↺ Reset
        </button>
        <button
          className="btn-ghost"
          onClick={onCycleFontSize}
          title={`Font size: ${fontSize} [F]`}
        >
          {fontSize === 'small' ? 'A' : fontSize === 'medium' ? 'A' : 'A'}
          <span className={styles.fontSizeLabel}>{fontSize[0].toUpperCase()}</span>
        </button>
        <button className="btn-ghost" onClick={onToggleTheme} title="Toggle dark mode [T]">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button className="btn-ghost" onClick={onShowHelp} title="Keyboard shortcuts [?]">
          ?
        </button>
      </div>
    </div>
  );
}
