'use client';

import Link from 'next/link';
import { useAppState } from '@/context/AppStateContext';
import styles from './TopNav.module.css';

export default function TopNav() {
  const { currentUser } = useAppState();
  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🦴</span>
          <span className={styles.logoText}>KneeAI <span className={styles.logoSub}>Assist</span></span>
        </Link>
        <div className={styles.badge}>ResNet-34 · 5-fold · 12 findings</div>
      </div>
      <div className={styles.right}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>{currentUser.name.split(' ').map(n => n[0]).join('')}</div>
          <div>
            <div className={styles.userName}>{currentUser.name}</div>
            <div className={styles.userRole}>{currentUser.role}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
