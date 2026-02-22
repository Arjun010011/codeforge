'use client';

// =====================================================
// TypeForge — Key Progress Indicator
// =====================================================

import { KeyProficiency } from '@/types';
import { getProficiencyColor, FINGER_MAP, FINGER_COLORS } from '@/engine/adaptiveEngine';
import styles from './KeyProgress.module.css';

interface KeyProgressProps {
    proficiencyMap: Record<string, KeyProficiency>;
    unlockedKeys: string[];
}

export default function KeyProgress({ proficiencyMap, unlockedKeys }: KeyProgressProps) {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Key Proficiency</h3>
            <div className={styles.keyGrid}>
                {unlockedKeys.map((key) => {
                    const prof = proficiencyMap[key];
                    const confidence = prof?.confidence || 0;
                    const attempts = prof?.totalAttempts || 0;
                    const finger = FINGER_MAP[key];
                    const fingerColor = finger ? FINGER_COLORS[finger] : '#6b7280';

                    return (
                        <div key={key} className={styles.keyItem}>
                            <div className={styles.keyTop}>
                                <span
                                    className={styles.keyChar}
                                    style={{ borderBottomColor: fingerColor }}
                                >
                                    {key.toUpperCase()}
                                </span>
                                <span className={styles.keyPercent}>
                                    {Math.round(confidence * 100)}%
                                </span>
                            </div>
                            <div className={styles.barBg}>
                                <div
                                    className={styles.barFill}
                                    style={{
                                        width: `${Math.round(confidence * 100)}%`,
                                        backgroundColor: getProficiencyColor(confidence),
                                    }}
                                />
                            </div>
                            {attempts > 0 && (
                                <span className={styles.keyAttempts}>
                                    {attempts} tries
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
