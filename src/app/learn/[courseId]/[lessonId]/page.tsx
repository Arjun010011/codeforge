'use client';

// =====================================================
// TypeForge — Course Lesson Page
// =====================================================

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useLearningStore } from '@/stores/learningStore';
import { getCourse, getLesson } from '@/lib/courses';
import { generatePseudowords } from '@/engine/pseudowordGen';
import LessonView from '@/components/learn/LessonView';
import styles from './page.module.css';

export default function CourseLessonPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const lessonId = params.lessonId as string;

    const proficiencyMap = useLearningStore((s) => s.proficiencyMap);
    const adaptiveResult = useLearningStore((s) => s.adaptiveResult);
    const getLessonProgress = useLearningStore((s) => s.getLessonProgress);
    const isLessonUnlocked = useLearningStore((s) => s.isLessonUnlocked);

    const course = getCourse(courseId);
    const lesson = getLesson(courseId, lessonId);

    const words = useMemo(() => {
        if (!lesson) return [];
        return generatePseudowords(lesson.targetKeys, [], 20, 3, 6);
    }, [lesson]);

    const progress = getLessonProgress(courseId, lessonId);

    // Check if lesson is unlocked
    const unlocked = course && lesson ? isLessonUnlocked(courseId, lessonId) : false;

    // Find next lesson
    const nextLesson = useMemo(() => {
        if (!course || !lesson) return null;
        const idx = course.lessons.findIndex((l) => l.id === lessonId);
        return idx < course.lessons.length - 1 ? course.lessons[idx + 1] : null;
    }, [course, lesson, lessonId]);

    const handleComplete = useCallback(() => {
        // Lesson completion is handled by LessonView → learningStore
    }, []);

    const handleNext = useCallback(() => {
        if (nextLesson) {
            router.push(`/learn/${courseId}/${nextLesson.id}`);
            useLearningStore.getState().resetAdaptive();
        }
    }, [nextLesson, courseId, router]);

    const handleRetry = useCallback(() => {
        useLearningStore.getState().resetAdaptive();
        router.refresh();
    }, [router]);

    if (!course || !lesson) {
        return (
            <div className={styles.page}>
                <div className={styles.error}>
                    <h2>Lesson not found</h2>
                    <Link href="/learn" className={styles.backLink}>← Back to Learn</Link>
                </div>
            </div>
        );
    }

    // Locked lesson gate
    if (!unlocked) {
        const lessonIdx = course.lessons.findIndex((l) => l.id === lessonId);
        const prevLesson = lessonIdx > 0 ? course.lessons[lessonIdx - 1] : null;

        return (
            <div className={styles.page}>
                <div className={styles.resultsCard}>
                    <h2 className={styles.lessonTitle}>🔒 Lesson Locked</h2>
                    <p className={styles.lessonDesc}>
                        Complete the previous lesson to unlock this one.
                    </p>
                    {prevLesson && (
                        <div className={styles.actions}>
                            <Link
                                href={`/learn/${courseId}/${prevLesson.id}`}
                                className={styles.primaryBtn}
                            >
                                ← Go to: {prevLesson.title}
                            </Link>
                        </div>
                    )}
                    <div className={styles.actions} style={{ marginTop: '0.5rem' }}>
                        <Link href="/learn" className={styles.secondaryBtn}>
                            ← Back to Learn
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // If lesson just finished, show results
    if (adaptiveResult && adaptiveResult.lessonId === lessonId) {
        const passed = adaptiveResult.stars > 0;

        return (
            <div className={styles.page}>
                <div className={styles.resultsCard}>
                    <h2 className={styles.lessonTitle}>{lesson.title}</h2>
                    <p className={styles.lessonComplete}>
                        {passed
                            ? `Lesson Complete! ${'⭐'.repeat(adaptiveResult.stars)}`
                            : '❌ Not quite — keep practicing!'}
                    </p>

                    <div className={styles.statsRow}>
                        <div className={styles.stat}>
                            <span className={styles.statVal}>{adaptiveResult.wpm}</span>
                            <span className={styles.statLbl}>wpm {!passed && `(need ${lesson.minWpm})`}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statVal}>{adaptiveResult.accuracy.toFixed(1)}%</span>
                            <span className={styles.statLbl}>accuracy {!passed && `(need ${lesson.minAccuracy}%)`}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statVal}>{adaptiveResult.stars}</span>
                            <span className={styles.statLbl}>stars</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {passed && nextLesson ? (
                            <button onClick={handleNext} className={styles.primaryBtn}>
                                Next: {nextLesson.title} →
                            </button>
                        ) : passed && !nextLesson ? (
                            <Link href="/learn" className={styles.primaryBtn}>
                                🎉 Course Complete! →
                            </Link>
                        ) : (
                            <button onClick={handleRetry} className={styles.primaryBtn}>
                                Retry Lesson →
                            </button>
                        )}
                        <Link href="/learn" className={styles.secondaryBtn}>
                            ← Back to Learn
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Current lesson index
    const lessonIdx = course.lessons.findIndex((l) => l.id === lessonId);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/learn" className={styles.backLink}>← {course.title}</Link>
                <h1 className={styles.lessonTitle}>
                    {course.icon} Lesson {lessonIdx + 1}: {lesson.title}
                </h1>
                <p className={styles.lessonDesc}>{lesson.description}</p>
                <div className={styles.requirements}>
                    <span>Min: {lesson.minWpm} WPM</span>
                    <span>•</span>
                    <span>{lesson.minAccuracy}% accuracy</span>
                    {progress && (
                        <>
                            <span>•</span>
                            <span>Best: {progress.bestWpm} WPM ⭐{progress.stars}</span>
                        </>
                    )}
                </div>
            </div>

            <LessonView
                words={words}
                targetKeys={lesson.targetKeys}
                lessonId={lessonId}
                courseId={courseId}
                onComplete={handleComplete}
                showHandGuide={lessonIdx < 6}
            />
        </div>
    );
}
