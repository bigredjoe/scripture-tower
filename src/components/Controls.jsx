import React, { useCallback, useState, useEffect } from 'react';
import styles from './Controls.module.css';

export default function Controls({
  stage,
  substage,
  numSubstages,
  mode,
  onPrevStage,
  onNextStage,
  onSetMode,
  onRevealAll,
  onReset,
  onNextSubstage,
  onBack,
}) {
  const [theme,    setTheme]    = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const [fontSize, setFontSize] = useState(() => document.documentElement.getAttribute('data-font-size') || 'medium');

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('st-theme', next);
  }, [theme]);

  const cycleFontSize = useCallback(() => {
    const sizes = ['small', 'medium', 'large'];
    const next  = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length];
    setFontSize(next);
    document.documentElement.setAttribute('data-font-size', next);
    localStorage.setItem('st-font-size', next);
  }, [fontSize]);

  const toggleMode = useCallback(() => {
    onSetMode(mode === 'click' ? 'type' : 'click');
  }, [mode, onSetMode]);

  return (
    <div className={styles.controls}>
      {/* Left: back + stage nav */}
      <div className={styles.group}>
        <button className="btn-ghost" onClick={onBack} title="Enter new text">
          ← New text
        </button>
        <button
          className="btn-secondary"
          onClick={onPrevStage}
          disabled={stage === 0}
          title="Previous stage"
        >
          ‹ Prev
        </button>
        <button
          className="btn-secondary"
          onClick={onNextStage}
          disabled={stage === 3}
          title="Next stage"
        >
          Next ›
        </button>
      </div>

      {/* Right: mode + reveal + reset + display */}
      <div className={styles.group}>
        <button
          className={mode === 'type' ? 'btn-active' : 'btn-secondary'}
          onClick={toggleMode}
          title={mode === 'click' ? 'Switch to Type mode' : 'Switch to Click mode'}
        >
          {mode === 'click' ? '⌨ Type mode' : '🖱 Click mode'}
        </button>
        {stage > 0 && mode === 'click' && (
          <button className="btn-secondary" onClick={onRevealAll} title="Reveal all hidden words">
            Reveal all
          </button>
        )}
        {stage > 0 && substage < numSubstages && (
          <button
            className="btn-secondary"
            onClick={onNextSubstage}
            title={`Add the next batch of hidden words (step ${substage}/${numSubstages})`}
          >
            + More words
          </button>
        )}
        <button className="btn-ghost" onClick={onReset} title="Reset — hide all words again">
          ↺ Reset
        </button>
        <button
          className="btn-ghost"
          onClick={cycleFontSize}
          title={`Font size: ${fontSize}`}
        >
          {fontSize === 'small' ? 'A' : fontSize === 'medium' ? 'A' : 'A'}
          <span className={styles.fontSizeLabel}>{fontSize[0].toUpperCase()}</span>
        </button>
        <button className="btn-ghost" onClick={toggleTheme} title="Toggle dark mode">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </div>
  );
}
