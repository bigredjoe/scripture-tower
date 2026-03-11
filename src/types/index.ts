export interface WordItem {
  id: number;
  type: 'word';
  text: string;
  core: string;
  prefix: string;
  suffix: string;
  firstLetter: string;
  blankLen: number;
}

export interface NewlineItem {
  type: 'newline';
}

export interface ParagraphItem {
  type: 'paragraph';
}

export type Token = WordItem | NewlineItem | ParagraphItem;

export interface CharEntry {
  char: string;
  wordId: number | null;
  isSpace: boolean;
  isPunctuation: boolean;
}

export type Stage = 0 | 1 | 2 | 3;
export type Mode = 'click' | 'type';
export type Screen = 'input' | 'memorize';

export interface MemorizeState {
  screen: Screen;
  title: string;
  rawText: string;
  tokens: Token[];
  charArray: CharEntry[];
  wordBatchMap: Record<number, number>;
  stage: Stage;
  substage: number;
  mode: Mode;
  revealed: Set<number>;
  typingCursor: number;
  typingError: boolean;
}

export interface MemorizeHookResult extends MemorizeState {
  totalWords: number;
  revealedCount: number;
  progress: number;
  cursorWordId: number | null;
  start: (title: string, rawText: string) => void;
  setStage: (stage: Stage) => void;
  setMode: (mode: Mode) => void;
  revealWord: (id: number) => void;
  revealAll: () => void;
  reset: () => void;
  nextSubstage: () => void;
  backToInput: () => void;
}
