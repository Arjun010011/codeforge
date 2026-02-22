'use client';

import { useUser } from '@clerk/nextjs';
import styles from './AnonymousWarning.module.css';

export default function AnonymousWarning() {
    const { isLoaded, isSignedIn } = useUser();

    if (!isLoaded || isSignedIn) return null;

    return (
        <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>☁️</span>
            <div>
                <strong>You are typing anonymously.</strong>
                <p>Sign in to track your stats, view your history, and save learning progress to the cloud.</p>
            </div>
        </div>
    );
}
