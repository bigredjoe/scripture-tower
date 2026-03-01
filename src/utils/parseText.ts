/**
 * Splits raw pasted text into an array of tokens.
 * Tokens are either word objects or newline/paragraph markers.
 *
 * Token shape:
 * {
 *   id:          number   — sequential, words only
 *   type:        'word' | 'newline' | 'paragraph'
 *   text:        string   — full original token (e.g. "loved,")
 *   core:        string   — stripped of surrounding punctuation (e.g. "loved")
 *   prefix:      string   — leading punctuation (e.g. '"')
 *   suffix:      string   — trailing punctuation (e.g. ',"')
 *   firstLetter: string   — first letter of core (lowercase)
 *   blankLen:    number   — character count for blank display
 * }
 */

import type { Token, WordItem, NewlineItem, ParagraphItem } from '../types';

const LEADING_PUNCT  = /^["""'''\u2018\u2019\u201C\u201D([\-–—]*/;
const TRAILING_PUNCT = /["""'''\u2018\u2019\u201C\u201D)\],.!?;:\-–—]*/;

function splitWordParts(raw: string): { prefix: string; suffix: string; core: string } {
  const prefixMatch  = raw.match(LEADING_PUNCT);
  const prefix       = prefixMatch ? prefixMatch[0] : '';
  const afterPrefix  = raw.slice(prefix.length);
  const suffixMatch  = afterPrefix.match(new RegExp(TRAILING_PUNCT.source + '$'));
  const suffix       = suffixMatch ? suffixMatch[0] : '';
  const core         = afterPrefix.slice(0, afterPrefix.length - suffix.length);
  return { prefix, suffix, core };
}

export function parseText(rawText: string): Token[] {
  const tokens: Token[] = [];
  let wordId = 0;

  // Normalise line endings
  const normalised = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into paragraphs (double newline) first
  const paragraphs = normalised.split(/\n{2,}/);

  paragraphs.forEach((para, paraIdx) => {
    if (paraIdx > 0) {
      const p: ParagraphItem = { type: 'paragraph' };
      tokens.push(p);
    }

    const lines = para.split('\n');

    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        const n: NewlineItem = { type: 'newline' };
        tokens.push(n);
      }

      const words = line.split(/\s+/).filter(Boolean);
      words.forEach(raw => {
        const { prefix, suffix, core } = splitWordParts(raw);
        const w: WordItem = {
          id:          wordId++,
          type:        'word',
          text:        raw,
          core:        core || raw,   // fallback to full token if no core remains
          prefix,
          suffix,
          firstLetter: (core || raw).charAt(0),
          blankLen:    Math.max((core || raw).length, 1),
        };
        tokens.push(w);
      });
    });
  });

  return tokens;
}

/** Total number of word tokens in a token list */
export function countWords(tokens: Token[]): number {
  return tokens.filter(t => t.type === 'word').length;
}
