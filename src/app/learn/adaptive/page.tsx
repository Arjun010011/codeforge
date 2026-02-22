'use client';

// =====================================================
// TypeForge — Adaptive Learning Page
// =====================================================

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useLearningStore } from '@/stores/learningStore';
import LessonView from '@/components/learn/LessonView';
import KeyProgress from '@/components/learn/KeyProgress';
import styles from './page.module.css';

export default function AdaptivePage() {
    const adaptiveWords = useLearningStore((s) => s.adaptiveWords);
    const adaptiveStatus = useLearningStore((s) => s.adaptiveStatus);
    const adaptiveResult = useLearningStore((s) => s.adaptiveResult);
    const generateAdaptiveLesson = useLearningStore((s) => s.generateAdaptiveLesson);
    const resetAdaptive = useLearningStore((s) => s.resetAdaptive);
    const getUnlocked = useLearningStore((s) => s.getUnlocked);
    const proficiencyMap = useLearningStore((s) => s.proficiencyMap);

    const unlockedKeys = getUnlocked();

    useEffect(() => {
        if (adaptiveStatus === 'idle') {
            generateAdaptiveLesson();
        }
    }, [adaptiveStatus, generateAdaptiveLesson]);

    const handleRestart = useCallback(() => {
        resetAdaptive();
        setTimeout(() => {
            generateAdaptiveLesson();
        }, 50);
    }, [resetAdaptive, generateAdaptiveLesson]);

    // Finished state
    if (adaptiveStatus === 'finished' && adaptiveResult) {
        return (
            <div className={styles.page}>
                <div className={styles.resultsCard}>
                    <h2 className={styles.resultsTitle}>Lesson Complete! 🎉</h2>

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{adaptiveResult.wpm}</span>
                            <span className={styles.statLabel}>wpm</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{adaptiveResult.rawWpm}</span>
                            <span className={styles.statLabel}>raw wpm</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{adaptiveResult.accuracy.toFixed(1)}%</span>
                            <span className={styles.statLabel}>accuracy</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{adaptiveResult.consistency.toFixed(0)}%</span>
                            <span className={styles.statLabel}>consistency</span>
                        </div>
                    </div>

                    {/* Per-key breakdown */}
                    {adaptiveResult.keyStats.length > 0 && (
                        <div className={styles.keyBreakdown}>
                            <h3 className={styles.breakdownTitle}>Per-Key Breakdown</h3>
                            <div className={styles.keyStatsGrid}>
                                {adaptiveResult.keyStats.map((stat) => (
                                    <div key={stat.key} className={styles.keyStat}>
                                        <span className={styles.keyStatChar}>{stat.key.toUpperCase()}</span>
                                        <span className={styles.keyStatAcc}>
                                            {stat.attempts > 0
                                                ? `${Math.round((stat.correct / stat.attempts) * 100)}%`
                                                : '—'}
                                        </span>
                                        <span className={styles.keyStatTime}>
                                            {stat.avgTimeMs > 0 ? `${stat.avgTimeMs}ms` : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button onClick={handleRestart} className={styles.primaryBtn}>
                            Next Lesson →
                        </button>
                        <Link href="/learn" className={styles.secondaryBtn}>
                            ← Back to Learn
                        </Link>
                    </div>
                </div>

                <KeyProgress proficiencyMap={proficiencyMap} unlockedKeys={unlockedKeys} />
            </div>
        );
    }

    // Loading / Ready state
    if (adaptiveWords.length === 0) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Generating lesson...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/learn" className={styles.backLink}>← learn</Link>
                <h1 className={styles.title}>Adaptive Practice</h1>
                <p className={styles.subtitle}>
                    Practicing with {unlockedKeys.length} unlocked keys • Weak keys weighted 3×
                </p>
            </div>

            <LessonView
                words={adaptiveWords}
                targetKeys={unlockedKeys}
                lessonId={`adaptive-${Date.now()}`}
                showHandGuide={unlockedKeys.length <= 10}
            />
        </div>
    );
}
