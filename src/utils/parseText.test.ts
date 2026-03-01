import { describe, it, expect } from 'vitest';
import { parseText, countWords } from './parseText';

describe('parseText', () => {
  it('tokenises simple words', () => {
    const tokens = parseText('hello world');
    const words = tokens.filter(t => t.type === 'word');
    expect(words).toHaveLength(2);
    expect(words[0]).toMatchObject({ type: 'word', core: 'hello', prefix: '', suffix: '' });
    expect(words[1]).toMatchObject({ type: 'word', core: 'world', prefix: '', suffix: '' });
  });

  it('strips leading and trailing punctuation into prefix/suffix', () => {
    const tokens = parseText('"hello," world!');
    const words = tokens.filter(t => t.type === 'word');
    expect(words[0]).toMatchObject({ core: 'hello', prefix: '"', suffix: ',"' });
    expect(words[1]).toMatchObject({ core: 'world', suffix: '!' });
  });

  it('emits a newline token between lines within a paragraph', () => {
    const tokens = parseText('line1\nline2');
    expect(tokens.some(t => t.type === 'newline')).toBe(true);
    expect(tokens.filter(t => t.type === 'word')).toHaveLength(2);
  });

  it('emits a paragraph token on double newline', () => {
    const tokens = parseText('para1\n\npara2');
    expect(tokens.some(t => t.type === 'paragraph')).toBe(true);
  });

  it('assigns sequential ids to word tokens starting at 0', () => {
    const tokens = parseText('a b c');
    const words = tokens.filter(t => t.type === 'word');
    expect(words.map(w => w.id)).toEqual([0, 1, 2]);
  });

  it('sets firstLetter and blankLen from the core', () => {
    const tokens = parseText('hello');
    const word = tokens.find(t => t.type === 'word');
    expect(word?.firstLetter).toBe('h');
    expect(word?.blankLen).toBe(5);
  });

  it('handles apostrophes in contractions (suffix)', () => {
    const tokens = parseText("don't");
    const words = tokens.filter(t => t.type === 'word');
    // "don't" — trailing apostrophe is treated as suffix punctuation
    expect(words).toHaveLength(1);
    expect(words[0].core?.length).toBeGreaterThan(0);
  });

  it('produces no word tokens for an empty string', () => {
    const tokens = parseText('   ');
    expect(tokens.filter(t => t.type === 'word')).toHaveLength(0);
  });
});

describe('countWords', () => {
  it('counts only word tokens, not newline or paragraph tokens', () => {
    const tokens = parseText('a\nb\n\nc');
    expect(countWords(tokens)).toBe(3);
  });

  it('returns 0 for empty text', () => {
    expect(countWords([])).toBe(0);
  });
});
