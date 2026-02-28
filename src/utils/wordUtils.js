/**
 * Helpers for per-word display logic and typing-mode cursor.
 */

/**
 * Returns the display string for a hidden word at the given stage.
 *   Stage 1: first letter + dashes  e.g. "l────"  (first letter + length hint)
 *   Stage 2: dashes sized to word   e.g. "─────"  (length hint only)
 *   Stage 3: null                                   (fixed-width CSS blank — no hint at all)
 */
export function getBlankDisplay(token, stage) {
  const len = token.blankLen;
  if (stage === 1) {
    return token.firstLetter + '─'.repeat(Math.max(len - 1, 0));
  }
  if (stage === 2) {
    return '─'.repeat(len);
  }
  // Stage 3: return null — WordToken will render a fixed-width CSS blank
  // so no letter, length, or character-count information leaks through.
  return null;
}

/**
 * Returns the display string for the *remaining* untyped portion of a word
 * while it is being partially filled in (type mode).
 *   Stage 1 & 2: dashes for remaining chars  e.g. "───" (3 left)
 *   Stage 3: null — fixed-width CSS blank (still no length info)
 */
export function getPartialBlankDisplay(remainingLen, stage) {
  if (remainingLen <= 0) return '';
  if (stage === 3) return null;
  return '─'.repeat(remainingLen);
}

/**
 * Build a flat character array from the raw text, mapping each
 * character position to its word token id (or null for whitespace/newlines).
 *
 * Used by the typing cursor to know which word is being typed at any position.
 *
 * Returns: Array<{ char: string, wordId: number|null }>
 */
export function buildCharMap(rawText, tokens) {
  const charMap = [];
  let rawIdx = 0;

  const wordTokens = tokens.filter(t => t.type === 'word');
  let wordTokenIdx = 0;

  while (rawIdx < rawText.length) {
    const ch = rawText[rawIdx];
    if (/\s/.test(ch)) {
      charMap.push({ char: ch, wordId: null });
      rawIdx++;
    } else {
      // Find the current word token by scanning forward
      const wt = wordTokens[wordTokenIdx];
      if (wt) {
        charMap.push({ char: ch, wordId: wt.id });
      } else {
        charMap.push({ char: ch, wordId: null });
      }
      rawIdx++;
      // Advance wordTokenIdx when we've consumed all chars of this token
      if (wt) {
        const tokenStart = rawText.indexOf(wt.text, rawIdx - wt.text.length > 0 ? rawIdx - wt.text.length : 0);
        const tokenEnd = tokenStart + wt.text.length;
        if (rawIdx >= tokenEnd) {
          wordTokenIdx++;
        }
      }
    }
  }

  return charMap;
}

/**
 * Simpler approach: return the raw text as an array of characters with their wordId.
 * Uses sequential matching against the token list.
 */
export function buildCharArray(rawText, tokens) {
  const wordTokens = tokens.filter(t => t.type === 'word');
  const result = [];
  let pos = 0;
  let wtIdx = 0;

  while (pos < rawText.length) {
    const ch = rawText[pos];
    if (/\s/.test(ch)) {
      result.push({ char: ch, wordId: null, isSpace: true });
      pos++;
    } else {
      const wt = wordTokens[wtIdx];
      if (wt && rawText.startsWith(wt.text, pos)) {
        // Emit each char of this word token with the same wordId
        for (let i = 0; i < wt.text.length; i++) {
          result.push({ char: rawText[pos + i], wordId: wt.id, isSpace: false });
        }
        pos += wt.text.length;
        wtIdx++;
      } else {
        // Fallback: single char, unknown word
        result.push({ char: ch, wordId: null, isSpace: false });
        pos++;
      }
    }
  }

  return result;
}

/**
 * Given a typingCursor (index into charArray), find which wordId
 * the cursor is currently inside (or the next word after whitespace).
 */
export function currentWordId(charArray, cursor) {
  if (cursor >= charArray.length) return null;
  // scan forward past spaces
  let i = cursor;
  while (i < charArray.length && charArray[i].isSpace) i++;
  return i < charArray.length ? charArray[i].wordId : null;
}
