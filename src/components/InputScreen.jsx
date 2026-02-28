import React, { useState, useCallback } from 'react';
import styles from './InputScreen.module.css';

const EXAMPLE = `For God so loved the world, that he gave his only Son,
that whoever believes in him should not perish
but have eternal life.
— John 3:16`;

export default function InputScreen({ onStart }) {
  const [title,   setTitle]   = useState('');
  const [rawText, setRawText] = useState('');
  const [error,   setError]   = useState('');

  const handleStart = useCallback(() => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      setError('Please paste some text to memorize.');
      return;
    }
    if (trimmed.split(/\s+/).length < 2) {
      setError('Please enter at least a couple of words.');
      return;
    }
    setError('');
    onStart(title.trim(), trimmed);
  }, [rawText, title, onStart]);

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleStart();
    }
  }, [handleStart]);

  const loadExample = useCallback(() => {
    setTitle('John 3:16');
    setRawText(EXAMPLE);
    setError('');
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📖</span>
          <h1 className={styles.logoText}>Scripture Tower</h1>
        </div>
        <p className={styles.tagline}>
          Memorize any verse, poem, or script — one stage at a time.
        </p>
      </header>

      <section className={styles.card}>
        <div className={styles.field}>
          <label htmlFor="title" className={styles.label}>
            Title <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. John 3:16 or Sonnet 18"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.titleInput}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="text" className={styles.label}>
            Your text
          </label>
          <textarea
            id="text"
            placeholder="Paste your verse, poem, or script here…"
            value={rawText}
            onChange={e => { setRawText(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            rows={8}
            className={styles.textarea}
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.actions}>
          <button className="btn-primary" onClick={handleStart}>
            Start Memorizing →
          </button>
          <button className="btn-ghost" onClick={loadExample}>
            Load example
          </button>
        </div>

        <p className={styles.hint}>
          Tip: <kbd>⌘ Enter</kbd> or <kbd>Ctrl Enter</kbd> to begin
        </p>
      </section>

      <section className={styles.howItWorks}>
        <h2 className={styles.howTitle}>How it works</h2>
        <ol className={styles.stageList}>
          <li>
            <span className={styles.stageBadge} data-stage="0">0</span>
            <div>
              <strong>Read</strong> — See the full text. Read it aloud.
            </div>
          </li>
          <li>
            <span className={styles.stageBadge} data-stage="1">1</span>
            <div>
              <strong>First Letters</strong> — Words shown as <code>f───</code>.
              Click or type to recall each one.
            </div>
          </li>
          <li>
            <span className={styles.stageBadge} data-stage="2">2</span>
            <div>
              <strong>Blanks</strong> — Only the word length remains as a hint.
            </div>
          </li>
          <li>
            <span className={styles.stageBadge} data-stage="3">3</span>
            <div>
              <strong>Recall</strong> — No hints. Pure memory.
            </div>
          </li>
        </ol>
        <p className={styles.modeNote}>
          In <strong>Type mode</strong>, each key you press is checked — wrong keys
          are blocked so you can only advance by typing the correct character.
        </p>
      </section>
    </main>
  );
}
