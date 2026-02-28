import React, { useMemo } from 'react';
import WordToken from './WordToken.jsx';
import styles from './TextDisplay.module.css';

/**
 * Renders the full token array as a block of flowing text, with newlines
 * and paragraph breaks preserved.
 *
 * Props:
 *   tokens       - Token[]
 *   stage        - 0|1|2|3
 *   mode         - 'click'|'type'
 *   revealed     - Set<number> of revealed word ids (click mode)
 *   cursorWordId - number|null — the word id currently at the typing cursor
 *   typedWordIds - Set<number> — words whose chars have all been typed past
 *   typingError  - boolean — flashes the cursor word
 *   onReveal     - (id: number) => void
 */
export default function TextDisplay({
  tokens,
  stage,
  mode,
  revealed,
  cursorWordId,
  typedWordIds,
  typingError,
  onReveal,
}) {
  const elements = useMemo(() => {
    const out = [];
    let lineKey = 0;
    let lineChildren = [];

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

    tokens.forEach((token, idx) => {
      if (token.type === 'newline') {
        flushLine('line');
        return;
      }
      if (token.type === 'paragraph') {
        flushLine('line');
        out.push(<div key={`para-${lineKey++}`} className={styles.paraBreak} aria-hidden="true" />);
        return;
      }

      // word token
      const isRevealed = revealed.has(token.id);
      const isTyped    = typedWordIds ? typedWordIds.has(token.id) : false;
      const isCursor   = cursorWordId === token.id;

      lineChildren.push(
        <React.Fragment key={token.id}>
          <WordToken
            token={token}
            stage={stage}
            mode={mode}
            isRevealed={isRevealed}
            isCursor={isCursor}
            isTyped={isTyped}
            onReveal={onReveal}
            typingError={typingError && isCursor}
          />
          {' '}
        </React.Fragment>
      );
    });

    flushLine('line');
    return out;
  }, [tokens, stage, mode, revealed, cursorWordId, typedWordIds, typingError, onReveal]);

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
