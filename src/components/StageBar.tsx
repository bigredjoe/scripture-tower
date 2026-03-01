import type { Stage } from '../types';
import styles from './StageBar.module.css';

const STAGES = [
  { label: 'Read',          desc: 'Full text visible' },
  { label: 'First Letters', desc: 'l─── hints' },
  { label: 'Blanks',        desc: '──── hints' },
  { label: 'Recall',        desc: 'No hints' },
];

interface StageBarProps {
  stage: Stage;
  onStageChange: (stage: Stage) => void;
}

export default function StageBar({ stage, onStageChange }: StageBarProps) {
  return (
    <nav className={styles.bar} aria-label="Memorization stages">
      {STAGES.map((s, i) => {
        const isActive    = i === stage;
        const isCompleted = i < stage;
        return (
          <button
            key={i}
            className={[
              styles.step,
              isActive    ? styles.active    : '',
              isCompleted ? styles.completed : '',
            ].join(' ')}
            onClick={() => onStageChange(i as Stage)}
            aria-current={isActive ? 'step' : undefined}
            title={s.desc}
          >
            <span className={styles.circle}>
              {isCompleted ? '✓' : i}
            </span>
            <span className={styles.label}>{s.label}</span>
          </button>
        );
      })}
      <div
        className={styles.track}
        aria-hidden="true"
      >
        <div
          className={styles.fill}
          style={{ width: `${(stage / (STAGES.length - 1)) * 100}%` }}
        />
      </div>
    </nav>
  );
}
