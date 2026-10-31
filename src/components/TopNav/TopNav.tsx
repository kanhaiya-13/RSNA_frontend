'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppState } from '@/context/AppStateContext';
import UploadModal from '@/components/UploadModal/UploadModal';
import styles from './TopNav.module.css';

export default function TopNav() {
  const { currentUser } = useAppState();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🦴</span>
            <span className={styles.logoText}>KneeSight AI <span className={styles.logoSub}>Assist</span></span>
          </Link>
          <div className={styles.badge}>ResNet-34 · 5-fold · 12 findings</div>
        </div>
        <div className={styles.right}>
          <button
            className="btn btn-primary"
            onClick={() => setIsUploadOpen(true)}
            style={{ fontSize: '13px', padding: '6px 14px', gap: '6px' }}
          >
            <span>⚡</span>
            <span>Upload MRI</span>
          </button>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{currentUser.name.split(' ').map(n => n[0]).join('')}</div>
            <div>
              <div className={styles.userName}>{currentUser.name}</div>
              <div className={styles.userRole}>{currentUser.role}</div>
            </div>
          </div>
        </div>
      </nav>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </>
  );
}
