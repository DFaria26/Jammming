import styles from './Skeleton.module.css';

function Skeleton({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonTrack}>
          <div className={`${styles.thumbnail} ${styles.shimmer}`} />
          <div className={styles.textGroup}>
            <div className={`${styles.titleBar} ${styles.shimmer}`} />
            <div className={`${styles.subtitleBar} ${styles.shimmer}`} />
          </div>
          <div className={`${styles.actionCircle} ${styles.shimmer}`} />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
