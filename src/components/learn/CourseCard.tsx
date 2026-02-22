'use client';

// =====================================================
// TypeForge — Course Card with Lesson List
// =====================================================

import Link from 'next/link';
import { CourseDefinition } from '@/types';
import { useLearningStore } from '@/stores/learningStore';
import styles from './CourseCard.module.css';

interface CourseCardProps {
    course: CourseDefinition;
    completedLessons: number;
}

export default function CourseCard({ course, completedLessons }: CourseCardProps) {
    const totalLessons = course.lessons.length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const isLessonUnlocked = useLearningStore((s) => s.isLessonUnlocked);
    const getLessonProgress = useLearningStore((s) => s.getLessonProgress);

    // Find the next lesson the user should do
    const nextLessonIdx = course.lessons.findIndex(
        (l) => !getLessonProgress(course.id, l.id)?.stars
    );
    const nextLessonId = nextLessonIdx >= 0
        ? course.lessons[nextLessonIdx].id
        : course.lessons[0].id;

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.icon}>{course.icon}</div>
                <div className={styles.headerInfo}>
                    <h3 className={styles.title}>{course.title}</h3>
                    <p className={styles.description}>{course.description}</p>
                    <div className={styles.meta}>
                        <span className={styles.lessonCount}>
                            {completedLessons}/{totalLessons} lessons
                        </span>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lesson List */}
            <div className={styles.lessonList}>
                {course.lessons.map((lesson, idx) => {
                    const unlocked = isLessonUnlocked(course.id, lesson.id);
                    const lessonProg = getLessonProgress(course.id, lesson.id);
                    const completed = lessonProg && lessonProg.stars > 0;
                    const isNext = lesson.id === nextLessonId;

                    return unlocked ? (
                        <Link
                            key={lesson.id}
                            href={`/learn/${course.id}/${lesson.id}`}
                            className={`${styles.lessonItem} ${completed ? styles.lessonCompleted : ''} ${isNext ? styles.lessonNext : ''}`}
                        >
                            <span className={styles.lessonNum}>{idx + 1}</span>
                            <span className={styles.lessonTitle}>{lesson.title}</span>
                            <span className={styles.lessonStatus}>
                                {completed
                                    ? `⭐${lessonProg!.stars}`
                                    : isNext
                                        ? '→'
                                        : ''}
                            </span>
                        </Link>
                    ) : (
                        <div
                            key={lesson.id}
                            className={`${styles.lessonItem} ${styles.lessonLocked}`}
                        >
                            <span className={styles.lessonNum}>{idx + 1}</span>
                            <span className={styles.lessonTitle}>{lesson.title}</span>
                            <span className={styles.lessonStatus}>🔒</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
