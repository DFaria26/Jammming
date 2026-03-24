import { useMemo } from 'react';
import styles from './Particles.module.css';

function Particles({ count = 20 }) {
  const specs = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 7 + Math.random() * 8.5,
      delay: Math.random() * 12,
      duration: 6 + Math.random() * 8,
      drift: -20 + Math.random() * 40,
    })),
  [count]);

  return (
    <div className={styles.container} aria-hidden="true">
      {specs.map((s) => (
        <span
          key={s.id}
          className={styles.speck}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            '--drift': `${s.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default Particles;
