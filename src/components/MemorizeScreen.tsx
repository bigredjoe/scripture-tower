import { useMemo } from 'react';
import StageBar        from './StageBar';
import Controls        from './Controls';
import ProgressCounter from './ProgressCounter';
import TextDisplay     from './TextDisplay';
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

  // Set of word ids that are blanked (hidden) at the current substage level.
  const blankedWordIds = useMemo(() => {
    const wordTokens = tokens.filter((t): t is WordItem => t.type === 'word');
    return new Set(
      wordTokens.filter(wt => isWordBlanked(wt.id, substage, wordBatchMap)).map(wt => wt.id)
    );
  }, [tokens, substage, wordBatchMap]);

  // Build the set of word ids that have been fully typed past (cursor is beyond them)
  const typedWordIds = useMemo(() => {
    if (mode !== 'type') return new Set<number>();
    const typed = new Set<number>();
    for (let i = 0; i < typingCursor && i < charArray.length; i++) {
      const entry = charArray[i];
      if (entry && entry.wordId !== null) {
        typed.add(entry.wordId);
      }
    }
    // Remove the cursorWordId — it's still in progress
    if (cursorWordId !== null) typed.delete(cursorWordId);
    return typed;
  }, [mode, typingCursor, charArray, cursorWordId]);

  // Count how many characters of each word's text have been typed so far.
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

  const handlePrevStage = () => setStage(Math.max(0, stage - 1) as Stage);
  const handleNextStage = () => setStage(Math.min(3, stage + 1) as Stage);

  return (
    <div className={styles.screen}>
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
          onPrevStage={handlePrevStage}
          onNextStage={handleNextStage}
          onSetMode={setMode}
          onRevealAll={revealAll}
          onReset={reset}
          onNextSubstage={nextSubstage}
          onBack={backToInput}
        />
      </footer>
    </div>
  );
}
