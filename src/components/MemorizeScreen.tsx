import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import StageBar        from './StageBar';
import Controls        from './Controls';
import ProgressCounter from './ProgressCounter';
import TextDisplay     from './TextDisplay';
import KeyboardHelp    from './KeyboardHelp';
import { isWordBlanked, NUM_SUBSTAGES } from '../utils/wordUtils';
import type { MemorizeHookResult, WordItem, Stage } from '../types';
import styles from './MemorizeScreen.module.css';

interface MemorizeScreenProps {
  memorize: MemorizeHookResult;
}

export default function MemorizeScreen({ memorize }: MemorizeScreenProps) {
  const {
    title, tokens, stage, substage, wordBatchMap, mode,
    revealed, typingCursor, charArray, cursorWordId,
    typingError, totalWords, revealedCount,
    setStage, setMode, revealWord, revealAll, reset, nextSubstage, backToInput,
  } = memorize;

  // ── Theme & font size (lifted from Controls) ──
  const [theme, setThemeState] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  const [fontSize, setFontSizeState] = useState(
    () => document.documentElement.getAttribute('data-font-size') || 'medium'
  );

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('st-theme', next);
  }, [theme]);

  const cycleFontSize = useCallback(() => {
    const sizes = ['small', 'medium', 'large'];
    const next  = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length];
    setFontSizeState(next);
    document.documentElement.setAttribute('data-font-size', next);
    localStorage.setItem('st-font-size', next);
  }, [fontSize]);

  // ── Help modal ──
  const [helpOpen, setHelpOpen] = useState(false);

  // ── Derived ──
  const blankedWordIds = useMemo(() => {
    const wordTokens = tokens.filter((t): t is WordItem => t.type === 'word');
    return new Set(
      wordTokens.filter(wt => isWordBlanked(wt.id, substage, wordBatchMap)).map(wt => wt.id)
    );
  }, [tokens, substage, wordBatchMap]);

  const typedWordIds = useMemo(() => {
    if (mode !== 'type') return new Set<number>();
    const typed = new Set<number>();
    for (let i = 0; i < typingCursor && i < charArray.length; i++) {
      const entry = charArray[i];
      if (entry && entry.wordId !== null) {
        if (stage === 0 || blankedWordIds.has(entry.wordId)) {
          typed.add(entry.wordId);
        }
      }
    }
    if (cursorWordId !== null) typed.delete(cursorWordId);
    return typed;
  }, [mode, typingCursor, charArray, cursorWordId, stage, blankedWordIds]);

  const wordProgress = useMemo(() => {
    if (mode !== 'type') return null;
    const map = new Map<number, number>();
    for (let i = 0; i < typingCursor && i < charArray.length; i++) {
      const { wordId, isSpace } = charArray[i];
      if (!isSpace && wordId !== null) {
        map.set(wordId, (map.get(wordId) || 0) + 1);
      }
    }
    return map;
  }, [mode, typingCursor, charArray]);

  const handlePrevStage = useCallback(() => setStage(Math.max(0, stage - 1) as Stage), [setStage, stage]);
  const handleNextStage = useCallback(() => setStage(Math.min(3, stage + 1) as Stage), [setStage, stage]);

  // ── Hidden input to capture mobile keyboard input in type mode ──
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (mode === 'type') {
      hiddenInputRef.current?.focus();
    }
  }, [mode]);

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      // Skip modifier combos (let browser handle Ctrl+C, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // On the memorize screen the only INPUT is the hidden type-mode capture
      // element (aria-hidden, never user-facing). Do NOT skip events from it —
      // that would block Escape and Arrow keys while in type mode.

      // ── Escape always works (closes help or exits type mode / goes back) ──
      if (e.key === 'Escape') {
        e.preventDefault();
        if (helpOpen) { setHelpOpen(false); return; }
        if (mode === 'type') { setMode('click'); return; }
        backToInput();
        return;
      }

      // ── While the help modal is open, swallow nothing else ──
      if (helpOpen) return;

      // ── Shortcuts active in both modes (non-printable keys only) ──

      if (e.key === 'ArrowLeft') {
        // Guard: only move if there is a previous stage to go to
        if (stage > 0) { e.preventDefault(); handlePrevStage(); }
        return;
      }
      if (e.key === 'ArrowRight') {
        // Guard: only move if there is a next stage to go to
        if (stage < 3) { e.preventDefault(); handleNextStage(); }
        return;
      }

      // ── Click-mode-only single-key shortcuts ──
      // (In type mode, printable keys are consumed by the typing validator)
      if (mode !== 'click') return;

      switch (e.key) {
        case '1': e.preventDefault(); setStage(0); break;
        case '2': e.preventDefault(); setStage(1); break;
        case '3': e.preventDefault(); setStage(2); break;
        case '4': e.preventDefault(); setStage(3); break;
        case 'm': case 'M':
          e.preventDefault(); setMode('type'); break;
        case 'r': case 'R':
          e.preventDefault(); reset(); break;
        case 'a': case 'A':
          if (stage > 0) { e.preventDefault(); revealAll(); }
          break;
        case 'w': case 'W':
          if (stage > 0 && substage < NUM_SUBSTAGES) { e.preventDefault(); nextSubstage(); }
          break;
        case 't': case 'T':
          e.preventDefault(); toggleTheme(); break;
        case 'f': case 'F':
          e.preventDefault(); cycleFontSize(); break;
        case '?':
          e.preventDefault(); setHelpOpen(h => !h); break;
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [
    mode, stage, substage, helpOpen,
    handlePrevStage, handleNextStage,
    setStage, setMode, reset, revealAll, nextSubstage,
    backToInput, toggleTheme, cycleFontSize,
  ]);

  return (
    <div className={styles.screen}>
      {helpOpen && <KeyboardHelp onClose={() => setHelpOpen(false)} />}

      {/* Hidden input captures mobile soft-keyboard events in type mode */}
      {mode === 'type' && (
        <input
          ref={hiddenInputRef}
          className={styles.hiddenInput}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-hidden="true"
          onInput={e => { (e.target as HTMLInputElement).value = ''; }}
        />
      )}

      <header className={styles.header}>
        <div className={styles.titleRow}>
          {title && <h1 className={styles.title}>{title}</h1>}
          <span className={styles.appName}>Scripture Tower</span>
        </div>
        <StageBar stage={stage} onStageChange={setStage} />
      </header>

      <main className={styles.main}>
        {mode === 'type' && stage > 0 && (
          <div className={styles.typingHint}>
            ⌨ Type mode — step {substage}/{NUM_SUBSTAGES}: type the blanked words.
          </div>
        )}

        <TextDisplay
          tokens={tokens}
          stage={stage}
          mode={mode}
          revealed={revealed}
          blankedWordIds={blankedWordIds}
          cursorWordId={cursorWordId}
          typedWordIds={typedWordIds}
          wordProgress={wordProgress}
          typingError={typingError}
          onReveal={revealWord}
        />

        <ProgressCounter
          revealed={revealedCount}
          total={totalWords}
          stage={stage}
          mode={mode}
          typingCursor={typingCursor}
          charArray={charArray}
        />
      </main>

      <footer className={styles.footer}>
        <Controls
          stage={stage}
          substage={substage}
          numSubstages={NUM_SUBSTAGES}
          mode={mode}
          theme={theme}
          fontSize={fontSize}
          onPrevStage={handlePrevStage}
          onNextStage={handleNextStage}
          onSetMode={setMode}
          onRevealAll={revealAll}
          onReset={reset}
          onNextSubstage={nextSubstage}
          onBack={backToInput}
          onToggleTheme={toggleTheme}
          onCycleFontSize={cycleFontSize}
          onShowHelp={() => setHelpOpen(true)}
        />
      </footer>
    </div>
  );
}
