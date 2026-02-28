import React, { useCallback } from 'react';
import { getBlankDisplay, getPartialBlankDisplay } from '../utils/wordUtils.js';
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
  isCursor,        // true if the typing cursor is currently on this word
  isTyped,         // true if typing cursor has passed this word completely
  coreCharsTyped,  // number of core chars typed so far (type mode, partial progress)
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

  const display = getBlankDisplay(token, stage);
  // stage 3 returns null — use a fixed-width CSS blank with no text content
  const isRecall = display === null;

  // Type mode
  if (mode === 'type') {
    const typed        = coreCharsTyped || 0;
    const remainingLen = core.length - typed;
    const isPartial    = typed > 0 && remainingLen > 0;

    if (isPartial) {
      // Show typed characters so far + shrinking blank for the rest
      const remainingDisplay = getPartialBlankDisplay(remainingLen, stage);
      return (
        <span className={styles.word}>
          {prefix}
          <span className={styles.typedChar}>{core.slice(0, typed)}</span>
          <span
            className={[
              styles.blank,
              remainingDisplay === null ? styles.recallBlankPartial : '',
              isCursor ? styles.cursorWord : '',
              isCursor && typingError ? styles.errorFlash : '',
            ].join(' ')}
            aria-label="Hidden word"
          >
            {remainingDisplay}
          </span>
          {suffix}
        </span>
      );
    }

    // Full blank (not yet started on this word)
    return (
      <span className={styles.word}>
        {prefix}
        <span
          className={[
            styles.blank,
            isRecall    ? styles.recallBlank : '',
            isCursor    ? styles.cursorWord  : '',
            isCursor && typingError ? styles.errorFlash : '',
          ].join(' ')}
          aria-label="Hidden word"
        >
          {display}
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
        className={[
          styles.blank,
          styles.clickable,
          isRecall ? styles.recallBlank : '',
        ].join(' ')}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Hidden word, click to reveal"
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      >
        {display}
      </span>
      {suffix}
    </span>
  );
}
