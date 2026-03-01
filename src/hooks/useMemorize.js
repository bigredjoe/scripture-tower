import { useReducer, useEffect, useCallback } from 'react';
import { parseText, countWords } from '../utils/parseText.js';
import { buildCharArray } from '../utils/wordUtils.js';

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

// ── Initial State ──────────────────────────────────────────
const initialState = {
  screen:        'input',
  title:         '',
  rawText:       '',
  tokens:        [],
  charArray:     [],    // flat char-level array for typing mode
  stage:         0,
  mode:          'click',
  revealed:      new Set(),
  typingCursor:  0,
  typingError:   false, // triggers shake/flash animation
};

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
        mode:      'click',
        revealed:  new Set(),
        typingCursor: 0,
      };
    }

    case SET_STAGE:
      return {
        ...state,
        stage:        action.stage,
        revealed:     new Set(),
        typingCursor: 0,
        typingError:  false,
      };

    case SET_MODE:
      return {
        ...state,
        mode:         action.mode,
        revealed:     new Set(),
        typingCursor: 0,
        typingError:  false,
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
        typingCursor: 0,
        typingError:  false,
      };

    case ADVANCE_CURSOR: {
      const next = action.nextCursor;
      // Determine which wordId covers position `next` and mark it revealed
      // (words are revealed as soon as their last char is typed)
      const revealed = new Set(state.revealed);

      // Check if we just completed a word: find wordId at positions before next
      // that is no longer at next
      const charArray = state.charArray;
      if (next > 0) {
        const prevEntry = charArray[next - 1];
        if (prevEntry && prevEntry.wordId !== null) {
          // Check if the word ends at next-1 (i.e. next char is different wordId or space)
          const nextEntry = charArray[next];
          if (!nextEntry || nextEntry.wordId !== prevEntry.wordId) {
            revealed.add(prevEntry.wordId);
          }
        }
      }

      return { ...state, typingCursor: next, revealed, typingError: false };
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

      const { charArray, typingCursor } = state;

      // Skip spaces and punctuation — users only type core word characters
      let cursor = typingCursor;
      while (cursor < charArray.length &&
             (charArray[cursor].isSpace || charArray[cursor].isPunctuation)) {
        cursor++;
      }

      if (cursor >= charArray.length) return; // finished

      const expected = charArray[cursor].char;

      if (e.key.toLowerCase() === expected.toLowerCase()) {
        e.preventDefault();
        // Advance past this char, then skip to the next typeable (non-space, non-punct) position
        let next = cursor + 1;
        while (next < charArray.length &&
               (charArray[next].isSpace || charArray[next].isPunctuation)) {
          next++;
        }
        dispatch({ type: ADVANCE_CURSOR, nextCursor: next });
      } else {
        e.preventDefault();
        dispatch({ type: SET_ERROR, value: true });
        // Clear error flag after animation
        setTimeout(() => dispatch({ type: SET_ERROR, value: false }), 400);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.screen, state.mode, state.charArray, state.typingCursor]);

  // ── Derived values ──
  const totalWords   = countWords(state.tokens);
  const revealedCount = state.revealed.size;
  const progress     = totalWords > 0 ? revealedCount / totalWords : 0;

  // In type mode, compute which wordId the cursor is currently at.
  // Skip spaces and punctuation — cursor always sits on a core char.
  const cursorWordId = (() => {
    if (state.mode !== 'type' || state.screen !== 'memorize') return null;
    const { charArray, typingCursor } = state;
    let i = typingCursor;
    while (i < charArray.length &&
           (charArray[i].isSpace || charArray[i].isPunctuation)) i++;
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
    backToInput,
  };
}
