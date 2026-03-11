import { describe, it, expect } from 'vitest';
import {
  getBlankDisplay,
  getPartialBlankDisplay,
  buildCharArray,
  isWordBlanked,
  computeWordBatchMap,
  NUM_SUBSTAGES,
} from './wordUtils';
import { parseText } from './parseText';

describe('getBlankDisplay', () => {
  const token = { firstLetter: 'h', blankLen: 5 };

  it('stage 1: first letter + dashes for remaining length', () => {
    expect(getBlankDisplay(token, 1)).toBe('h────');
  });

  it('stage 2: all dashes, length-matched', () => {
    expect(getBlankDisplay(token, 2)).toBe('─────');
  });

  it('stage 3: null (fixed-width CSS blank, no text content)', () => {
    expect(getBlankDisplay(token, 3)).toBeNull();
  });

  it('stage 1 single-letter word: only the letter, no dashes', () => {
    expect(getBlankDisplay({ firstLetter: 'a', blankLen: 1 }, 1)).toBe('a');
  });
});

describe('getPartialBlankDisplay', () => {
  it('stage 1: dashes for remaining chars', () => {
    expect(getPartialBlankDisplay(3, 1)).toBe('───');
  });

  it('stage 2: dashes for remaining chars', () => {
    expect(getPartialBlankDisplay(3, 2)).toBe('───');
  });

  it('stage 3: null regardless of remaining length', () => {
    expect(getPartialBlankDisplay(3, 3)).toBeNull();
  });

  it('zero remaining: empty string', () => {
    expect(getPartialBlankDisplay(0, 1)).toBe('');
  });
});

describe('isWordBlanked', () => {
  it('substage 0: never blanked regardless of batch', () => {
    expect(isWordBlanked(0, 0, { 0: 0 })).toBe(false);
    expect(isWordBlanked(5, 0, { 5: 0 })).toBe(false);
  });

  it('batch < substage: word is blanked', () => {
    expect(isWordBlanked(5, 2, { 5: 1 })).toBe(true);
  });

  it('batch === substage: word is NOT blanked', () => {
    expect(isWordBlanked(5, 2, { 5: 2 })).toBe(false);
  });

  it('batch > substage: word is NOT blanked', () => {
    expect(isWordBlanked(5, 1, { 5: 3 })).toBe(false);
  });

  it('no batchMap: falls back to wordId % NUM_SUBSTAGES', () => {
    // wordId=1 → batch 1. substage=2 → 1 < 2 → blanked
    expect(isWordBlanked(1, 2, null)).toBe(true);
    // wordId=3 → batch 3. substage=2 → 3 >= 2 → not blanked
    expect(isWordBlanked(3, 2, null)).toBe(false);
  });
});

describe('computeWordBatchMap', () => {
  it('assigns a valid batch index (0 to NUM_SUBSTAGES-1) to every word', () => {
    const tokens = parseText('a b c d e f g h');
    const map = computeWordBatchMap(tokens);
    tokens.filter(t => t.type === 'word').forEach(w => {
      expect(map[w.id!]).toBeGreaterThanOrEqual(0);
      expect(map[w.id!]).toBeLessThan(NUM_SUBSTAGES);
    });
  });

  it('uses all NUM_SUBSTAGES batches when there are enough words', () => {
    const tokens = parseText('a b c d');
    const map = computeWordBatchMap(tokens);
    const batches = new Set(Object.values(map));
    expect(batches.size).toBe(NUM_SUBSTAGES);
  });

  it('assigns every word exactly once', () => {
    const tokens = parseText('one two three');
    const words = tokens.filter(t => t.type === 'word');
    const map = computeWordBatchMap(tokens);
    expect(Object.keys(map)).toHaveLength(words.length);
  });
});

describe('buildCharArray', () => {
  it('maps each character of a word to its word id', () => {
    const tokens = parseText('hi');
    const arr = buildCharArray('hi', tokens);
    expect(arr).toHaveLength(2);
    expect(arr[0]).toMatchObject({ char: 'h', wordId: 0, isSpace: false, isPunctuation: false });
    expect(arr[1]).toMatchObject({ char: 'i', wordId: 0, isSpace: false, isPunctuation: false });
  });

  it('marks space characters with isSpace=true and wordId=null', () => {
    const tokens = parseText('a b');
    const arr = buildCharArray('a b', tokens);
    expect(arr[1]).toMatchObject({ char: ' ', wordId: null, isSpace: true, isPunctuation: false });
  });

  it('marks prefix and suffix chars as isPunctuation=true', () => {
    const rawText = '"hello,"';
    const tokens = parseText(rawText);
    const arr = buildCharArray(rawText, tokens);
    // opening quote is prefix
    expect(arr[0]).toMatchObject({ char: '"', isPunctuation: true });
    // first core letter
    expect(arr[1]).toMatchObject({ char: 'h', isPunctuation: false });
    // trailing comma and quote are suffix
    expect(arr[6]).toMatchObject({ char: ',', isPunctuation: true });
    expect(arr[7]).toMatchObject({ char: '"', isPunctuation: true });
  });

  it('assigns distinct word ids to separate words', () => {
    const tokens = parseText('ab cd');
    const arr = buildCharArray('ab cd', tokens);
    expect(arr[0].wordId).toBe(0); // 'a'
    expect(arr[1].wordId).toBe(0); // 'b'
    expect(arr[2].isSpace).toBe(true);
    expect(arr[3].wordId).toBe(1); // 'c'
    expect(arr[4].wordId).toBe(1); // 'd'
  });

  it('handles multi-line text with newlines as spaces', () => {
    const rawText = 'a\nb';
    const tokens = parseText(rawText);
    const arr = buildCharArray(rawText, tokens);
    expect(arr[1]).toMatchObject({ char: '\n', isSpace: true });
    expect(arr[2].wordId).toBe(1);
  });
});
