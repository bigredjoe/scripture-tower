import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemorize } from './useMemorize';

// ── helpers ────────────────────────────────────────────────────────────────

const TEXT = 'hello world';

function setup(text = TEXT) {
  const { result } = renderHook(() => useMemorize());
  act(() => { result.current.start('Test', text); });
  return result;
}

/** Enable type mode (also resets cursor to 0). */
function enableTypeMode(result: ReturnType<typeof setup>) {
  act(() => { result.current.setMode('type'); });
}

/** Dispatch a single keydown event on window (simulates a key press). */
function typeKey(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

/** Type every character in a string one by one. */
function typeWord(word: string) {
  for (const ch of word) typeKey(ch);
}

// ── reducer actions ────────────────────────────────────────────────────────

describe('useMemorize reducer — action results', () => {
  it('START sets screen to memorize and counts words', () => {
    const result = setup();
    expect(result.current.screen).toBe('memorize');
    expect(result.current.stage).toBe(0);
    expect(result.current.mode).toBe('click');
    expect(result.current.totalWords).toBe(2);
    expect(result.current.revealedCount).toBe(0);
  });

  it('SET_STAGE clears revealed words and initialises substage', () => {
    const result = setup();
    // Manually reveal a word first so we can confirm it gets cleared
    act(() => { result.current.setStage(1); });
    act(() => { result.current.revealWord(0); });
    expect(result.current.revealedCount).toBe(1);

    act(() => { result.current.setStage(2); });
    expect(result.current.stage).toBe(2);
    expect(result.current.substage).toBe(1);
    expect(result.current.revealedCount).toBe(0);
  });

  it('SET_STAGE to 0 sets substage to 0', () => {
    const result = setup();
    act(() => { result.current.setStage(1); });
    act(() => { result.current.setStage(0); });
    expect(result.current.substage).toBe(0);
  });

  it('SET_MODE preserves revealed count and resets typingCursor', () => {
    const result = setup();
    act(() => { result.current.setStage(1); });
    act(() => { result.current.revealWord(0); });
    expect(result.current.revealedCount).toBe(1);

    act(() => { result.current.setMode('type'); });
    expect(result.current.revealedCount).toBe(1); // preserved
    expect(result.current.typingCursor).toBe(0);  // reset
  });

  it('REVEAL_WORD adds a specific word id to revealed', () => {
    const result = setup();
    act(() => { result.current.setStage(1); });
    act(() => { result.current.revealWord(0); });
    expect(result.current.revealed.has(0)).toBe(true);
    expect(result.current.revealed.has(1)).toBe(false);
  });

  it('REVEAL_ALL marks every word as revealed', () => {
    const result = setup();
    act(() => { result.current.setStage(1); });
    act(() => { result.current.revealAll(); });
    expect(result.current.revealedCount).toBe(2);
  });

  it('RESET clears revealed and resets cursor but keeps stage', () => {
    const result = setup();
    act(() => { result.current.setStage(1); });
    act(() => { result.current.revealAll(); });

    act(() => { result.current.reset(); });
    expect(result.current.revealedCount).toBe(0);
    expect(result.current.typingCursor).toBe(0);
    expect(result.current.stage).toBe(1); // stage unchanged
  });

  it('NEXT_SUBSTAGE increments substage and resets cursor', () => {
    const result = setup();
    act(() => { result.current.setStage(1); });
    expect(result.current.substage).toBe(1);
    act(() => { result.current.nextSubstage(); });
    expect(result.current.substage).toBe(2);
    expect(result.current.typingCursor).toBe(0);
  });

  it('BACK_TO_INPUT returns to input screen', () => {
    const result = setup();
    act(() => { result.current.backToInput(); });
    expect(result.current.screen).toBe('input');
  });
});

// ── typing mode — stage 0 ──────────────────────────────────────────────────

describe('useMemorize typing mode — stage 0', () => {
  it('cursorWordId starts on the first word', () => {
    const result = setup();
    enableTypeMode(result);
    expect(result.current.cursorWordId).toBe(0);
  });

  it('partial typing does NOT confirm a word (bug-fix: hasMoreCore)', () => {
    const result = setup();
    enableTypeMode(result);

    typeKey('h'); // only the first letter — 'ello' still remain
    expect(result.current.revealed.has(0)).toBe(false);
    // Cursor must still be on word 0
    expect(result.current.cursorWordId).toBe(0);
  });

  it('word is confirmed only after all core letters are typed', () => {
    const result = setup();
    enableTypeMode(result);

    typeWord('hello');
    expect(result.current.revealed.has(0)).toBe(true);
  });

  it('after completing a word cursor moves to the next word', () => {
    const result = setup();
    enableTypeMode(result);

    typeWord('hello');
    expect(result.current.cursorWordId).toBe(1);
  });

  it('wrong key does not advance the typing cursor', () => {
    const result = setup();
    enableTypeMode(result);

    const cursorBefore = result.current.typingCursor;
    typeKey('z'); // 'z' ≠ 'h'
    expect(result.current.typingCursor).toBe(cursorBefore);
  });

  it('all words confirmed after typing the full text', () => {
    const result = setup();
    enableTypeMode(result);

    typeWord('hello');
    typeWord('world');
    expect(result.current.revealedCount).toBe(2);
  });

  it('already-confirmed words are skipped by the cursor', () => {
    const result = setup();
    enableTypeMode(result);

    typeWord('hello'); // confirms word 0
    // cursor should now be on word 1, not looping back to word 0
    expect(result.current.cursorWordId).toBe(1);
    typeWord('world');
    expect(result.current.cursorWordId).toBeNull(); // all done
  });
});

// ── typing mode — stage 1+ ─────────────────────────────────────────────────

describe('useMemorize typing mode — stage 1', () => {
  // Build a deterministic batchMap so word 0 is in batch 0 (blanked at substage 1).
  // We do this by using a text long enough that at least one word is in batch 0,
  // then checking which words are actually blanked rather than hard-coding indices.

  it('partial typing does NOT confirm a blanked word (same hasMoreCore bug path)', () => {
    // Use a 4-word text to ensure at least one is blanked at substage 1
    const result = setup('alpha beta gamma delta');
    act(() => { result.current.setStage(1); });
    enableTypeMode(result);

    // Find which word the cursor is sitting on — that's the first blanked word
    const firstBlankedId = result.current.cursorWordId;
    expect(firstBlankedId).not.toBeNull();

    // Retrieve that word's core text from tokens
    const token = result.current.tokens.find(t => t.type === 'word' && t.id === firstBlankedId);
    const core = (token as { core: string } | undefined)?.core ?? '';
    const [firstChar] = core;

    typeKey(firstChar); // partial — should NOT confirm
    expect(result.current.revealed.has(firstBlankedId!)).toBe(false);
    expect(result.current.cursorWordId).toBe(firstBlankedId);
  });

  it('word is confirmed after typing all its letters at stage 1', () => {
    const result = setup('alpha beta gamma delta');
    act(() => { result.current.setStage(1); });
    enableTypeMode(result);

    const firstBlankedId = result.current.cursorWordId;
    const token = result.current.tokens.find(t => t.type === 'word' && t.id === firstBlankedId);
    const core = (token as { core: string } | undefined)?.core ?? '';

    typeWord(core);
    expect(result.current.revealed.has(firstBlankedId!)).toBe(true);
  });
});
