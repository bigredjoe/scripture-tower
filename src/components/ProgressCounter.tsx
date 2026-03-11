import type { Stage, Mode, CharEntry } from '../types';
import styles from './ProgressCounter.module.css';

interface ProgressCounterProps {
  revealed: number;
  total: number;
  stage: Stage;
  mode: Mode;
  typingCursor: number;
  charArray: CharEntry[];
}

export default function ProgressCounter({ revealed, total, stage, mode, typingCursor, charArray }: ProgressCounterProps) {
  if (stage === 0) {
    if (mode !== 'type') {
      return (
        <div className={styles.counter}>
          <span className={styles.label}>Reading mode — study the text, then advance to Stage 1</span>
        </div>
      );
    }
    const pct = total > 0 ? Math.round((revealed / total) * 100) : 0;
    return (
      <div className={styles.counter}>
        <span className={styles.label}>
          <strong>{revealed}</strong> / {total} words confirmed
        </span>
        <div className={styles.barWrap}>
          <div className={styles.bar} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  if (mode === 'type') {
    const totalChars = charArray.length;
    const pct = totalChars > 0 ? Math.round((typingCursor / totalChars) * 100) : 0;
    return (
      <div className={styles.counter}>
        <span className={styles.label}>
          Typed <strong>{pct}%</strong> of the text
        </span>
        <div className={styles.barWrap}>
          <div className={styles.bar} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  const pct = total > 0 ? Math.round((revealed / total) * 100) : 0;
  const done = revealed === total;

  return (
    <div className={styles.counter}>
      <span className={styles.label}>
        <strong>{revealed}</strong> / {total} words revealed
      </span>
      <div className={styles.barWrap}>
        <div
          className={[styles.bar, done ? styles.barDone : ''].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
