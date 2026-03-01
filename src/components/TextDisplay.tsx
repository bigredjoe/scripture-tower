import React, { useMemo } from 'react';
import WordToken from './WordToken';
import type { Token, WordItem, Stage, Mode } from '../types';
import styles from './TextDisplay.module.css';

/**
 * Renders the full token array as a block of flowing text, with newlines
 * and paragraph breaks preserved.
 *
 * Props:
 *   tokens        - Token[]
 *   stage         - 0|1|2|3
 *   mode          - 'click'|'type'
 *   revealed      - Set<number> of revealed word ids (click mode)
 *   blankedWordIds - Set<number> of words hidden at the current substage level
 *   cursorWordId  - number|null — the word id currently at the typing cursor
 *   typedWordIds  - Set<number> — words whose chars have all been typed past
 *   typingError   - boolean — flashes the cursor word
 *   onReveal      - (id: number) => void
 */
interface TextDisplayProps {
  tokens: Token[];
  stage: Stage;
  mode: Mode;
  revealed: Set<number>;
  blankedWordIds: Set<number>;
  cursorWordId: number | null;
  typedWordIds: Set<number>;
  wordProgress: Map<number, number> | null;
  typingError: boolean;
  onReveal: (id: number) => void;
}

export default function TextDisplay({
  tokens,
  stage,
  mode,
  revealed,
  blankedWordIds,
  cursorWordId,
  typedWordIds,
  wordProgress,
  typingError,
  onReveal,
}: TextDisplayProps) {
  const elements = useMemo(() => {
    const out: React.ReactElement[] = [];
    let lineKey = 0;
    let lineChildren: React.ReactElement[] = [];

    function flushLine(type = 'line') {
      if (lineChildren.length > 0 || type === 'para') {
        out.push(
          <span key={`line-${lineKey++}`} className={styles.line}>
            {lineChildren}
          </span>
        );
        lineChildren = [];
      }
    }

    tokens.forEach((token) => {
      if (token.type === 'newline') {
        flushLine('line');
        return;
      }
      if (token.type === 'paragraph') {
        flushLine('line');
        out.push(<div key={`para-${lineKey++}`} className={styles.paraBreak} aria-hidden="true" />);
        return;
      }

      // word token — TypeScript narrows Token to WordItem here
      const wordToken = token as WordItem;
      const isRevealed = revealed.has(wordToken.id);
      const isTyped    = typedWordIds ? typedWordIds.has(wordToken.id) : false;
      const isCursor   = cursorWordId === wordToken.id;

      // Words not yet in the current batch are shown at stage 0 (fully visible).
      // Words that are blanked at the current substage level use the real stage.
      const effectiveStage =
        stage > 0 && blankedWordIds && !blankedWordIds.has(wordToken.id) ? 0 : stage;

      // How many characters of token.core have been typed so far.
      // wordProgress counts total chars typed in the whole token text (prefix+core+suffix).
      // Subtract prefix length to get into the core.
      const totalTypedInWord = wordProgress ? (wordProgress.get(wordToken.id) || 0) : 0;
      const coreCharsTyped   = Math.max(0, Math.min(
        totalTypedInWord - wordToken.prefix.length,
        wordToken.core.length
      ));

      lineChildren.push(
        <React.Fragment key={wordToken.id}>
          <WordToken
            token={wordToken}
            stage={effectiveStage}
            mode={mode}
            isRevealed={isRevealed}
            isCursor={isCursor}
            isTyped={isTyped}
            coreCharsTyped={coreCharsTyped}
            onReveal={onReveal}
            typingError={typingError && isCursor}
          />
          {' '}
        </React.Fragment>
      );
    });

    flushLine('line');
    return out;
  }, [tokens, stage, mode, revealed, blankedWordIds, cursorWordId, typedWordIds, wordProgress, typingError, onReveal]);

  return (
    <div
      className={styles.display}
      tabIndex={mode === 'type' ? 0 : -1}
      aria-label="Text to memorize"
    >
      {elements}
    </div>
  );
}
