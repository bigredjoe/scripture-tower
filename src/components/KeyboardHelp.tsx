import { useEffect, useRef } from 'react';
import styles from './KeyboardHelp.module.css';

interface ShortcutRow {
  key: string;
  action: string;
}

const BOTH_MODES: ShortcutRow[] = [
  { key: '← →',   action: 'Previous / Next stage' },
  { key: 'Esc',   action: 'Exit type mode (→ click mode) / Back to input' },
];

const CLICK_MODE: ShortcutRow[] = [
  { key: '1 – 4', action: 'Jump to stage Read / First Letters / Blanks / Recall' },
  { key: 'M',     action: 'Switch to Type mode' },
  { key: 'A',     action: 'Reveal all hidden words' },
  { key: 'W',     action: 'Show more words (next batch)' },
  { key: 'R',     action: 'Reset — hide all words again' },
  { key: 'T',     action: 'Toggle dark / light theme' },
  { key: 'F',     action: 'Cycle font size (S → M → L)' },
  { key: '?',     action: 'Show / hide this help' },
];

const INPUT_SCREEN: ShortcutRow[] = [
  { key: '⌘ Enter / Ctrl Enter', action: 'Start memorizing' },
];

interface KeyboardHelpProps {
  onClose: () => void;
}

export default function KeyboardHelp({ onClose }: KeyboardHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal and close on Escape
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    first?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Keyboard shortcuts</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          <Section heading="Both modes" rows={BOTH_MODES} />
          <Section heading="Click mode only" rows={CLICK_MODE} />
          <Section heading="Input screen" rows={INPUT_SCREEN} />
        </div>
      </div>
    </div>
  );
}

function Section({ heading, rows }: { heading: string; rows: ShortcutRow[] }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionHeading}>{heading}</h3>
      <dl className={styles.list}>
        {rows.map(({ key, action }) => (
          <div className={styles.row} key={key}>
            <dt><kbd className={styles.kbd}>{key}</kbd></dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
