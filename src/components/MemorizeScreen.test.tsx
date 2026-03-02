import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import MemorizeScreen from './MemorizeScreen';
import { parseText } from '../utils/parseText';
import { buildCharArray, computeWordBatchMap } from '../utils/wordUtils';
import type { MemorizeHookResult, Stage, Mode } from '../types';

// ── helpers ─────────────────────────────────────────────────────────────────

// Short text used by most tests
const RAW = 'hello world';

// Longer text used by stage-1 regression tests.
// With wordBatchMap { 0:0, 1:1, 2:0 } at substage 1:
//   alpha (id=0, batch=0) → BLANKED
//   beta  (id=1, batch=1) → VISIBLE
//   gamma (id=2, batch=0) → BLANKED
// charArray positions:
//   0-4  a,l,p,h,a  (wordId=0)
//   5    ' '
//   6-9  b,e,t,a    (wordId=1)
//   10   ' '
//   11-15 g,a,m,m,a (wordId=2)
// After typing all of "alpha" the cursor advances to pos 11 (skip ' ', skip "beta", skip ' ')
const RAW3     = 'alpha beta gamma';
const TOKENS3  = parseText(RAW3);
const CHARS3   = buildCharArray(RAW3, TOKENS3);
// Deterministic batch map: alpha→0, beta→1, gamma→0
const BATCH3   = { 0: 0, 1: 1, 2: 0 };

function makeMemorize(overrides: Partial<MemorizeHookResult> = {}): MemorizeHookResult {
  const tokens = parseText(RAW);
  const charArray = buildCharArray(RAW, tokens);
  const wordBatchMap = computeWordBatchMap(tokens);
  return {
    screen: 'memorize',
    title: 'Test',
    rawText: RAW,
    tokens,
    charArray,
    wordBatchMap,
    stage: 0 as Stage,
    substage: 1,
    mode: 'click' as Mode,
    revealed: new Set<number>(),
    typingCursor: 0,
    typingError: false,
    totalWords: 2,
    revealedCount: 0,
    progress: 0,
    cursorWordId: null,
    start: vi.fn(),
    setStage: vi.fn(),
    setMode: vi.fn(),
    revealWord: vi.fn(),
    revealAll: vi.fn(),
    reset: vi.fn(),
    nextSubstage: vi.fn(),
    backToInput: vi.fn(),
    ...overrides,
  };
}

/** Returns the hidden input element, or null if absent. */
function hiddenInput(): HTMLInputElement | null {
  return document.querySelector('input[aria-hidden="true"]');
}

// ── tests ────────────────────────────────────────────────────────────────────

// ── Stage 1 type mode: visible words must not turn green ─────────────────────

describe('MemorizeScreen — stage 1 type mode: non-blanked words stay plain', () => {
  /**
   * Simulates the state after the user has fully typed the first blanked word
   * ("alpha", id=0) and the cursor has advanced to the second blanked word
   * ("gamma", id=2).  The word between them — "beta" (id=1) — is visible
   * (not blanked) and was silently skipped by the cursor.
   *
   * Before the fix, typedWordIds erroneously included id=1 because all
   * charArray entries from 0 to typingCursor (11) were added regardless of
   * whether the word was ever blanked, making "beta" render as confirmed.
   */
  it('visible word between two blanks stays plain after first blank is typed', () => {
    render(
      <MemorizeScreen
        memorize={makeMemorize({
          rawText: RAW3,
          tokens: TOKENS3,
          charArray: CHARS3,
          wordBatchMap: BATCH3,
          stage: 1 as Stage,
          substage: 1,
          mode: 'type',
          // "alpha" has been confirmed; cursor is now on "gamma"
          revealed: new Set([0]),
          typingCursor: 11,   // first char of "gamma"
          cursorWordId: 2,
          totalWords: 3,
        })}
      />
    );

    // The typed blank word "alpha" → confirmed ✓
    expect(document.querySelector('[data-word-id="0"]')).toHaveAttribute('data-state', 'confirmed');

    // The visible (non-blanked) word "beta" between the two blanks → must be plain
    expect(document.querySelector('[data-word-id="1"]')).toHaveAttribute('data-state', 'plain');

    // The next blank "gamma" → cursor ✓
    expect(document.querySelector('[data-word-id="2"]')).toHaveAttribute('data-state', 'cursor');
  });

  it('visible word BEFORE the first blank also stays plain when cursor jumps over it', () => {
    // Use batchMap where only "gamma" (id=2) is blanked:
    //   alpha→1 (not blanked), beta→1 (not blanked), gamma→0 (blanked at substage 1)
    // After typing "gamma" the cursor would be beyond it, but here we set
    // typingCursor=0 so the cursor jumps all the way to "gamma" on the first keypress.
    // Even before any typing, typingCursor=0 means typedWordIds should be empty
    // and the two visible words ahead should be plain, not confirmed.
    render(
      <MemorizeScreen
        memorize={makeMemorize({
          rawText: RAW3,
          tokens: TOKENS3,
          charArray: CHARS3,
          wordBatchMap: { 0: 1, 1: 1, 2: 0 },
          stage: 1 as Stage,
          substage: 1,
          mode: 'type',
          revealed: new Set<number>(),
          typingCursor: 0,
          cursorWordId: 2,  // cursor already on "gamma" (skipped over alpha, beta)
          totalWords: 3,
        })}
      />
    );

    expect(document.querySelector('[data-word-id="0"]')).toHaveAttribute('data-state', 'plain');
    expect(document.querySelector('[data-word-id="1"]')).toHaveAttribute('data-state', 'plain');
    expect(document.querySelector('[data-word-id="2"]')).toHaveAttribute('data-state', 'cursor');
  });
});

// ── Mobile keyboard hidden input ─────────────────────────────────────────────

describe('MemorizeScreen — mobile keyboard hidden input', () => {
  it('does not render a hidden input in click mode', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'click' })} />);
    expect(hiddenInput()).toBeNull();
  });

  it('renders a hidden input in type mode', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    expect(hiddenInput()).toBeInTheDocument();
  });

  it('hidden input has aria-hidden to exclude it from the accessibility tree', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    expect(hiddenInput()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('hidden input has autocomplete="off" to suppress browser autofill', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    expect(hiddenInput()?.getAttribute('autocomplete')).toBe('off');
  });

  it('hidden input has autocorrect="off" to suppress iOS autocorrect', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    expect(hiddenInput()?.getAttribute('autocorrect')).toBe('off');
  });

  it('hidden input has autocapitalize="off" to suppress iOS capitalisation', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    expect(hiddenInput()?.getAttribute('autocapitalize')).toBe('off');
  });

  it('hidden input has spellcheck disabled', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    // React serialises spellCheck={false} → spellcheck="false" content attribute
    expect(hiddenInput()?.getAttribute('spellcheck')).toBe('false');
  });

  it('hidden input is focused immediately when type mode mounts', async () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    // Allow the useEffect that calls .focus() to run
    await act(async () => {});
    expect(document.activeElement).toBe(hiddenInput());
  });

  it('hidden input clears its value on every input event (prevents text build-up)', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    const input = hiddenInput() as HTMLInputElement;
    // Simulate the browser inserting a character via soft keyboard
    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('');
  });

  it('clearing happens for every character — repeated events all result in empty value', () => {
    render(<MemorizeScreen memorize={makeMemorize({ mode: 'type' })} />);
    const input = hiddenInput() as HTMLInputElement;
    for (const ch of 'hello') {
      input.value = ch;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(input.value).toBe('');
    }
  });
});
