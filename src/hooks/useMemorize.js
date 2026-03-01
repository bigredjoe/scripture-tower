import { useReducer, useEffect, useCallback } from 'react';
import { parseText, countWords } from '../utils/parseText.js';
import { buildCharArray, isWordBlanked, NUM_SUBSTAGES } from '../utils/wordUtils.js';

// ── Action Types ───────────────────────────────────────────
const START          = 'START';
const SET_STAGE      = 'SET_STAGE';
const SET_MODE       = 'SET_MODE';
const REVEAL_WORD    = 'REVEAL_WORD';
const REVEAL_ALL     = 'REVEAL_ALL';
const RESET          = 'RESET';
const ADVANCE_CURSOR = 'ADVANCE_CURSOR';
const SET_ERROR      = 'SET_ERROR';
const BACK_TO_INPUT  = 'BACK_TO_INPUT';
const NEXT_SUBSTAGE  = 'NEXT_SUBSTAGE';

// ── Initial State ──────────────────────────────────────────
const initialState = {
  screen:        'input',
  title:         '',
  rawText:       '',
  tokens:        [],
  charArray:     [],    // flat char-level array for typing mode
  stage:         0,
  substage:      0,     // 1..NUM_SUBSTAGES within each stage; 0 means no stage entered yet
  mode:          'click',
  revealed:      new Set(),
  typingCursor:  0,
  typingError:   false,
};

// ── Helper: should this charArray entry be skipped by the typing cursor? ──
// Spaces, punctuation, non-blanked words (per substage), and already-revealed
// words are all auto-skipped.  Stage 0 skips nothing (type the full text).
function shouldSkipChar(entry, stage, substage, revealed) {
  if (entry.isSpace || entry.isPunctuation) return true;
  if (entry.wordId === null) return true;
  if (stage === 0) return false;
  if (revealed.has(entry.wordId)) return true;
  return !isWordBlanked(entry.wordId, substage);
}

// ── Reducer ────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case START: {
      const tokens    = parseText(action.rawText);
      const charArray = buildCharArray(action.rawText, tokens);
      return {
        ...initialState,
        screen:    'memorize',
        title:     action.title,
        rawText:   action.rawText,
        tokens,
        charArray,
        stage:     0,
        substage:  0,
        mode:      'click',
        revealed:  new Set(),
        typingCursor: 0,
      };
    }

    case SET_STAGE:
      return {
        ...state,
        stage:        action.stage,
        substage:     action.stage > 0 ? 1 : 0,
        revealed:     new Set(),
        typingCursor: 0,
        typingError:  false,
      };

    case SET_MODE:
      return {
        ...state,
        mode:         action.mode,
        typingCursor: 0,
        typingError:  false,
        // Keep revealed and substage — progress persists across mode switches
      };

    case REVEAL_WORD: {
      const revealed = new Set(state.revealed);
      revealed.add(action.id);
      return { ...state, revealed };
    }

    case REVEAL_ALL: {
      const wordIds = state.tokens
        .filter(t => t.type === 'word')
        .map(t => t.id);
      return { ...state, revealed: new Set(wordIds) };
    }

    case RESET:
      return {
        ...state,
        revealed:     new Set(),
        substage:     state.stage > 0 ? 1 : 0,
        typingCursor: 0,
        typingError:  false,
      };

    case NEXT_SUBSTAGE:
      return {
        ...state,
        substage:     Math.min(state.substage + 1, NUM_SUBSTAGES),
        typingCursor: 0,
        typingError:  false,
        // Keep revealed — already-typed/clicked words stay green
      };

    case ADVANCE_CURSOR: {
      const { nextCursor, justTyped } = action;
      const revealed  = new Set(state.revealed);
      const charArray = state.charArray;

      // Mark the word that was just completed as revealed so it stays green
      // across mode switches and substage advances.
      if (justTyped >= 0 && justTyped < charArray.length) {
        const entry = charArray[justTyped];
        if (entry && entry.wordId !== null && !entry.isPunctuation) {
          const wordId = entry.wordId;
          // No more core chars for this word between justTyped+1 and nextCursor
          const hasMoreCore = charArray
            .slice(justTyped + 1, nextCursor)
            .some(e => e.wordId === wordId && !e.isSpace && !e.isPunctuation);
          if (!hasMoreCore) revealed.add(wordId);
        }
      }

      // In type mode: auto-advance substage when all blanked words are typed
      if (state.mode === 'type' && state.stage > 0 && state.substage < NUM_SUBSTAGES) {
        const { stage, substage } = state;
        const anyRemaining = charArray.slice(nextCursor).some(
          e => !e.isSpace && !e.isPunctuation && e.wordId !== null
               && isWordBlanked(e.wordId, substage) && !revealed.has(e.wordId)
        );
        if (!anyRemaining) {
          return {
            ...state,
            substage:     substage + 1,
            typingCursor: 0,
            revealed,
            typingError:  false,
          };
        }
      }

      return { ...state, typingCursor: nextCursor, revealed, typingError: false };
    }

    case SET_ERROR:
      return { ...state, typingError: action.value };

    case BACK_TO_INPUT:
      return { ...initialState };

    default:
      return state;
  }
}

// ── Hook ───────────────────────────────────────────────────
export function useMemorize() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Actions ──
  const start = useCallback((title, rawText) => {
    dispatch({ type: START, title, rawText });
  }, []);

  const setStage = useCallback(stage => {
    dispatch({ type: SET_STAGE, stage });
  }, []);

  const setMode = useCallback(mode => {
    dispatch({ type: SET_MODE, mode });
  }, []);

  const revealWord = useCallback(id => {
    dispatch({ type: REVEAL_WORD, id });
  }, []);

  const revealAll = useCallback(() => {
    dispatch({ type: REVEAL_ALL });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: RESET });
  }, []);

  const nextSubstage = useCallback(() => {
    dispatch({ type: NEXT_SUBSTAGE });
  }, []);

  const backToInput = useCallback(() => {
    dispatch({ type: BACK_TO_INPUT });
  }, []);

  // ── Keyboard handler for type mode ──
  useEffect(() => {
    if (state.screen !== 'memorize' || state.mode !== 'type') return;

    function handleKeyDown(e) {
      // Ignore modifier-key combos (Ctrl+C etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Only handle printable single characters
      if (e.key.length !== 1) return;

      const { charArray, typingCursor, stage, substage, revealed } = state;

      // Find the next character the user needs to type, skipping over
      // spaces, punctuation, non-blanked words, and already-revealed words.
      let cursor = typingCursor;
      while (cursor < charArray.length &&
             shouldSkipChar(charArray[cursor], stage, substage, revealed)) {
        cursor++;
      }

      if (cursor >= charArray.length) return; // nothing left to type

      const expected = charArray[cursor].char;

      if (e.key.toLowerCase() === expected.toLowerCase()) {
        e.preventDefault();
        // Advance past this char, then skip to next typeable position
        let next = cursor + 1;
        while (next < charArray.length &&
               shouldSkipChar(charArray[next], stage, substage, revealed)) {
          next++;
        }
        dispatch({ type: ADVANCE_CURSOR, nextCursor: next, justTyped: cursor });
      } else {
        e.preventDefault();
        dispatch({ type: SET_ERROR, value: true });
        setTimeout(() => dispatch({ type: SET_ERROR, value: false }), 400);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.screen, state.mode, state.charArray, state.typingCursor,
      state.stage, state.substage, state.revealed]);

  // ── Derived values ──
  const totalWords    = countWords(state.tokens);
  const revealedCount = state.revealed.size;
  const progress      = totalWords > 0 ? revealedCount / totalWords : 0;

  // In type mode, the cursor sits on the next blanked-and-untyped core char.
  // Skip spaces, punctuation, non-blanked words, and already-revealed words.
  const cursorWordId = (() => {
    if (state.mode !== 'type' || state.screen !== 'memorize') return null;
    const { charArray, typingCursor, stage, substage, revealed } = state;
    let i = typingCursor;
    while (i < charArray.length &&
           shouldSkipChar(charArray[i], stage, substage, revealed)) i++;
    return i < charArray.length ? charArray[i].wordId : null;
  })();

  return {
    ...state,
    totalWords,
    revealedCount,
    progress,
    cursorWordId,
    // Actions
    start,
    setStage,
    setMode,
    revealWord,
    revealAll,
    reset,
    nextSubstage,
    backToInput,
  };
}
