# Frontend Product Plan: Progressive Memorization Web App

## 1) Product goal
Build a web app that helps users memorize a verse, script, or poem by progressively hiding words and prompting active recall.

## 2) Core user flow
1. User lands on a simple input screen.
2. User pastes text and optionally gives it a title.
3. User taps “Start practice” (no setup required).
4. User enters a memorization session.
5. App progressively hides words/phrases each round.
6. User attempts recall and self-checks (or checks via typed answer mode).
7. Session ends with summary stats and suggested next session.

## 3) Feature scope (MVP)

### A. Text intake and preparation
- Paste large text block (multiline).
- Auto-segment into stanzas/verses/paragraphs.
- Tokenization that preserves punctuation and capitalization.
- Built-in forgiving check behavior (case/spacing tolerant) enabled by default.

### B. Memorization session engine
- Round-based progression.
- One default hide strategy for MVP: progressive fade (hide more words each round).
- Reveal controls:
  - Reveal one word.
  - Reset round.
- Session pacing:
  - Manual next round.

### C. Answer and feedback modes
- **Self-check mode**: user mentally recalls and taps “I got it”.
- **Type-check mode**:
  - User types missing words or full line.
  - Lightweight correctness matching with tolerance for spacing/case.
  - Immediate visual feedback (correct/incorrect highlights).

### D. Progress tracking
- Per-text progress:
  - Best completion level.
  - Accuracy trend (if typing mode used).
  - Last practiced date.
- Session summary:
  - Hidden-word percent reached.
  - Correctness score.
  - Time spent.

### E. Text library
- Save multiple memorization texts locally.
- Search/filter by title/tags.
- Duplicate and edit existing entries.

## 4) UX design principles
- Keep interface minimal and distraction-free.
- Large readable typography (especially for mobile).
- High-contrast hidden-word placeholders.
- One clear primary action per step.
- Keyboard shortcuts for power users:
  - Next round.
  - Reveal hint.
  - Submit answer.

## 5) Information architecture
- `/` Home + “Start memorizing”.
- `/new` Create/import text.
- `/session/:id` Active memorization session.
- `/library` Saved texts and progress.

## 6) State and data model (frontend-first)

### Entities
- `TextItem`
  - id, title, body, createdAt, updatedAt, tags.
- `SessionConfig`
  - checkMode (self-check or type-check).
- `SessionState`
  - currentRound, hiddenTokenIndices, attempts, hintsUsed, elapsedMs.
- `SessionResult`
  - textId, reachedHiddenPercent, accuracy, durationMs, completedAt.

### Storage strategy
- Start with local persistence (`localStorage` or IndexedDB).
- Abstract data access with a repository layer so cloud sync can be added later.

## 7) Technical architecture (recommended)
- Framework: React + TypeScript.
- Build stack: Vite.
- UI: Tailwind or component library + custom typography styles.
- Routing: React Router.
- State:
  - Local component state for session interactions.
  - Global lightweight store (Zustand/Redux Toolkit) for library/progress.
- Testing:
  - Unit tests for tokenization and hide/reveal algorithms.
  - Component tests for session interactions.
  - End-to-end smoke flow: create text → run session → save result.

## 8) Memorization algorithm plan
1. Parse text into token array with metadata (word/punctuation/line-break).
2. Determine target hidden ratio for each round.
3. Choose tokens to hide using the default progressive fade strategy while avoiding over-hiding in same line early.
4. Persist hidden indices and user attempts.
5. For type-check mode, compute token-level diff and normalized match score.
6. Adapt next round:
   - If score high, increase hidden ratio.
   - If low, repeat ratio or reduce slightly.

## 9) Accessibility and inclusivity
- WCAG-friendly color contrast.
- Full keyboard navigation.
- Screen-reader labels for hidden/revealed states.
- Optional dyslexia-friendly font toggle and line spacing options.

## 10) Milestone roadmap

### Milestone 1: Foundation (1 week)
- App shell, routes, text input form.
- Tokenization utility.
- Basic session screen with manual hide progression.

### Milestone 2: Core memorization loop (1–2 weeks)
- Default progressive hide strategy.
- Round progression controls.
- Self-check and type-check modes.

### Milestone 3: Progress + library (1 week)
- Save texts.
- Session summary and historical progress.
- Basic filter/search.

### Milestone 4: Polish + QA (1 week)
- Accessibility pass.
- Mobile responsiveness.
- Performance tuning for long passages.
- Test hardening + bug fixes.

## 11) Risks and mitigations
- **Risk:** Hide logic feels unfair/random.
  - **Mitigation:** deterministic seeded random option + preview of next difficulty.
- **Risk:** Typing correctness too strict.
  - **Mitigation:** normalization + configurable tolerance.
- **Risk:** Long texts become hard to render.
  - **Mitigation:** memoization, virtualized rendering for very large passages.
