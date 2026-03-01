import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import MemorizeScreen from './MemorizeScreen';
import { parseText } from '../utils/parseText';
import { buildCharArray, computeWordBatchMap } from '../utils/wordUtils';
import type { MemorizeHookResult, Stage, Mode } from '../types';

// ── helpers ─────────────────────────────────────────────────────────────────

const RAW = 'hello world';

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
