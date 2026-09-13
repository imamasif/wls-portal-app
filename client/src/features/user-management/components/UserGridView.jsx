import React from 'react';
import styles from './UserGridView.module.css';

export function UserGridView() {
  return (
    <div className={styles.card}>
      <div className={styles.tableWrapper}>
        <table className={styles.styledTable}>
          {/* Table contents */}
        </table>
      </div>
    </div>
  );
}