'use client';

// =====================================================
// TypeForge — Learn Hub Page
// =====================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLearningStore } from '@/stores/learningStore';
import { COURSES } from '@/lib/courses';
import CourseCard from '@/components/learn/CourseCard';
import KeyProgress from '@/components/learn/KeyProgress';
import HandPositionGuide from '@/components/learn/HandPositionGuide';
import styles from './page.module.css';

export default function LearnPage() {
    const [hydrated, setHydrated] = useState(false);
    const proficiencyMap = useLearningStore((s) => s.proficiencyMap);
    const lessonProgressMap = useLearningStore((s) => s.lessonProgressMap);
    const getUnlocked = useLearningStore((s) => s.getUnlocked);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const unlockedKeys = getUnlocked();

    return (
        <div className={styles.page}>
            {/* Hero: Adaptive Practice */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroIcon}>🧠</div>
                    <div>
                        <h1 className={styles.heroTitle}>Adaptive Practice</h1>
                        <p className={styles.heroDesc}>
                            AI-powered lessons that adapt to your weaknesses. The more you practice,
                            the smarter the lessons get.
                        </p>
                    </div>
                </div>
                <div className={styles.heroMeta}>
                    <span className={styles.heroStat} suppressHydrationWarning>
                        <strong suppressHydrationWarning>{hydrated ? unlockedKeys.length : '—'}</strong> keys unlocked
                    </span>
                    <Link href="/learn/adaptive" className={styles.startBtn}>
                        Start Practice →
                    </Link>
                </div>
            </section>

            {/* Key Progress */}
            {hydrated && unlockedKeys.length > 0 && (
                <section className={styles.section}>
                    <KeyProgress proficiencyMap={proficiencyMap} unlockedKeys={unlockedKeys} />
                </section>
            )}

            {/* Structured Courses */}
            {hydrated && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Structured Courses</h2>
                    <div className={styles.courseGrid}>
                        {COURSES.map((course) => {
                            const completedCount = course.lessons.filter((lesson) => {
                                const key = `${course.id}:${lesson.id}`;
                                return lessonProgressMap[key]?.stars > 0;
                            }).length;

                            return (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    completedLessons={completedCount}
                                />
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Hand Position Guide */}
            <section className={styles.section}>
                <HandPositionGuide />
            </section>
        </div>
    );
}
