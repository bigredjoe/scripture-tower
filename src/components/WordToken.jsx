import React, { useCallback } from 'react';
import { getBlankDisplay } from '../utils/wordUtils.js';
import styles from './WordToken.module.css';

/**
 * Renders a single word token in the appropriate state for the current
 * stage and mode.
 *
 * States:
 *   - visible    (stage 0, or word has been revealed, or before typing cursor)
 *   - firstLetter (stage 1, hidden, click mode)
 *   - blank      (stage 2, hidden, click mode)
 *   - recall     (stage 3, hidden, click mode)
 *   - cursor     (current typing cursor position, type mode)
 *   - typed      (already typed past in type mode — same as revealed)
 *   - typing-pending (stage 1-3, type mode, not yet typed)
 */
export default function WordToken({
  token,
  stage,
  mode,
  isRevealed,
  isCursor,    // true if the typing cursor is currently on this word
  isTyped,     // true if typing cursor has passed this word completely
  onReveal,
  typingError,
}) {
  const { prefix, suffix, core, firstLetter, blankLen } = token;

  const handleClick = useCallback(() => {
    if (stage > 0 && mode === 'click' && !isRevealed) {
      onReveal(token.id);
    }
  }, [stage, mode, isRevealed, onReveal, token.id]);

  // Stage 0 — always fully visible
  if (stage === 0) {
    return (
      <span className={styles.word}>
        {prefix}
        <span className={styles.core}>{core}</span>
        {suffix}
      </span>
    );
  }

  // Already revealed (by click) or already typed past
  if (isRevealed || isTyped) {
    return (
      <span className={styles.word}>
        {prefix}
        <span className={[styles.core, styles.revealed].join(' ')}>{core}</span>
        {suffix}
      </span>
    );
  }

  // Type mode — show blank with cursor highlight on the active word
  if (mode === 'type') {
    return (
      <span className={styles.word}>
        {prefix}
        <span
          className={[
            styles.blank,
            isCursor ? styles.cursorWord : '',
            isCursor && typingError ? styles.errorFlash : '',
          ].join(' ')}
          aria-label={`Hidden word, ${blankLen} characters`}
          style={{ '--blank-len': blankLen }}
        >
          {getBlankDisplay(token, stage)}
        </span>
        {suffix}
      </span>
    );
  }

  // Click mode — hidden word
  return (
    <span className={styles.word}>
      {prefix}
      <span
        className={[styles.blank, styles.clickable].join(' ')}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Hidden word, click to reveal`}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        style={{ '--blank-len': blankLen }}
      >
        {getBlankDisplay(token, stage)}
      </span>
      {suffix}
    </span>
  );
}
