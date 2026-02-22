'use client';

// =====================================================
// TypeForge — Learning Store (Zustand with persistence)
// =====================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    KeyProficiency,
    LessonResult,
    LearningStatus,
    KeyLessonStat,
} from '@/types';

declare global {
    interface Window {
        Clerk?: {
            user?: {
                id: string;
            };
        };
    }
}

import { getCourse } from '@/lib/courses';
import {
    getInitialProficiencyMap,
    updateKeyProficiency,
    getUnlockedKeys,
    getWeakKeys,
    checkForUnlocks,
    createKeyProficiency,
} from '@/engine/adaptiveEngine';
import { generatePseudowords } from '@/engine/pseudowordGen';

interface LessonProgress {
    courseId: string;
    lessonId: string;
    stars: number;
    bestWpm: number;
    bestAccuracy: number;
    completedAt?: number;
}

interface LearningStore {
    // Per-key proficiency
    proficiencyMap: Record<string, KeyProficiency>;

    // Lesson progress per course
    lessonProgressMap: Record<string, LessonProgress>; // key = "courseId:lessonId"

    // Current adaptive lesson state
    adaptiveWords: string[];
    adaptiveStatus: LearningStatus;
    adaptiveResult: LessonResult | null;

    // Actions
    generateAdaptiveLesson: (wordCount?: number) => void;
    completeLessonWithStats: (
        lessonId: string,
        courseId: string | undefined,
        wpm: number,
        rawWpm: number,
        accuracy: number,
        consistency: number,
        keyStats: KeyLessonStat[],
        durationMs: number
    ) => void;
    updateProficiency: (keyStats: KeyLessonStat[]) => void;
    getUnlocked: () => string[];
    getWeak: () => string[];
    setAdaptiveStatus: (status: LearningStatus) => void;
    resetAdaptive: () => void;
    getLessonProgress: (courseId: string, lessonId: string) => LessonProgress | undefined;
    isLessonUnlocked: (courseId: string, lessonId: string) => boolean;
    hydrateFromSupabase: (remoteProgress: Record<string, LessonProgress>, remoteProficiency: Record<string, KeyProficiency>) => void;
}

export const useLearningStore = create<LearningStore>()(
    persist(
        (set, get) => ({
            proficiencyMap: getInitialProficiencyMap(),
            lessonProgressMap: {},
            adaptiveWords: [],
            adaptiveStatus: 'idle',
            adaptiveResult: null,

            generateAdaptiveLesson: (wordCount = 25) => {
                const { proficiencyMap } = get();
                const unlocked = getUnlockedKeys(proficiencyMap);
                const weak = getWeakKeys(proficiencyMap);
                const words = generatePseudowords(unlocked, weak, wordCount, 3, 6);

                set({
                    adaptiveWords: words,
                    adaptiveStatus: 'ready',
                    adaptiveResult: null,
                });
            },

            completeLessonWithStats: (
                lessonId, courseId, wpm, rawWpm, accuracy, consistency, keyStats, durationMs
            ) => {
                const { proficiencyMap, lessonProgressMap } = get();

                // Calculate stars using course-specific thresholds
                let stars = 0;
                if (courseId) {
                    const course = getCourse(courseId);
                    const lesson = course?.lessons.find((l) => l.id === lessonId);
                    if (lesson) {
                        if (wpm >= lesson.starThresholds[0] && accuracy >= lesson.minAccuracy) stars = 1;
                        if (wpm >= lesson.starThresholds[1] && accuracy >= lesson.minAccuracy) stars = 2;
                        if (wpm >= lesson.starThresholds[2] && accuracy >= lesson.minAccuracy) stars = 3;
                    }
                } else {
                    // Adaptive mode: generic thresholds
                    if (wpm >= 15) stars = 1;
                    if (wpm >= 30) stars = 2;
                    if (wpm >= 50) stars = 3;
                }

                // Update proficiency for each key
                const newMap = { ...proficiencyMap };
                for (const stat of keyStats) {
                    const key = stat.key.toLowerCase();
                    if (!newMap[key]) {
                        newMap[key] = createKeyProficiency(key, true);
                    }
                    newMap[key] = updateKeyProficiency(
                        newMap[key],
                        stat.attempts,
                        stat.correct,
                        stat.avgTimeMs
                    );
                }

                // Check for new unlocks
                const newUnlocks = checkForUnlocks(newMap);
                for (const key of newUnlocks) {
                    newMap[key] = createKeyProficiency(key, true);
                }

                // Save result
                const result: LessonResult = {
                    lessonId,
                    courseId,
                    wpm,
                    rawWpm,
                    accuracy,
                    consistency,
                    stars,
                    keyStats,
                    testDurationMs: durationMs,
                    timestamp: Date.now(),
                };

                // Update lesson progress
                const progressKey = courseId ? `${courseId}:${lessonId}` : `adaptive:${lessonId}`;
                const existing = lessonProgressMap[progressKey];
                const newProgress: LessonProgress = {
                    courseId: courseId || 'adaptive',
                    lessonId,
                    stars: Math.max(stars, existing?.stars || 0),
                    bestWpm: Math.max(wpm, existing?.bestWpm || 0),
                    bestAccuracy: Math.max(accuracy, existing?.bestAccuracy || 0),
                    completedAt: Date.now(),
                };

                set({
                    proficiencyMap: newMap,
                    adaptiveResult: result,
                    adaptiveStatus: 'finished',
                    lessonProgressMap: {
                        ...lessonProgressMap,
                        [progressKey]: newProgress,
                    },
                });

                // Fire & forget sync to Supabase if logged in
                if (typeof window !== 'undefined' && window.Clerk && window.Clerk.user) {
                    const userId = window.Clerk.user.id;
                    import('@/lib/supabase').then(({ saveLessonProgress, syncKeyProficiency }) => {
                        // 1. Save lesson progress if it's a structured course
                        if (courseId) {
                            saveLessonProgress(userId, courseId, lessonId, newProgress.stars, newProgress.bestWpm, newProgress.bestAccuracy);
                        }
                        // 2. Sync updated key proficiencies
                        syncKeyProficiency(userId, keyStats, newMap);
                    });
                }
            },

            updateProficiency: (keyStats) => {
                const { proficiencyMap } = get();
                const newMap = { ...proficiencyMap };

                for (const stat of keyStats) {
                    const key = stat.key.toLowerCase();
                    if (!newMap[key]) {
                        newMap[key] = createKeyProficiency(key, true);
                    }
                    newMap[key] = updateKeyProficiency(
                        newMap[key],
                        stat.attempts,
                        stat.correct,
                        stat.avgTimeMs
                    );
                }

                set({ proficiencyMap: newMap });
            },

            getUnlocked: () => {
                return getUnlockedKeys(get().proficiencyMap);
            },

            getWeak: () => {
                return getWeakKeys(get().proficiencyMap);
            },

            setAdaptiveStatus: (status) => {
                set({ adaptiveStatus: status });
            },

            resetAdaptive: () => {
                set({
                    adaptiveWords: [],
                    adaptiveStatus: 'idle',
                    adaptiveResult: null,
                });
            },

            getLessonProgress: (courseId, lessonId) => {
                const key = `${courseId}:${lessonId}`;
                return get().lessonProgressMap[key];
            },

            isLessonUnlocked: (courseId, lessonId) => {
                const course = getCourse(courseId);
                if (!course) return false;

                const lessonIdx = course.lessons.findIndex((l) => l.id === lessonId);
                if (lessonIdx < 0) return false;

                // First lesson is always unlocked
                if (lessonIdx === 0) return true;

                // Check if the previous lesson has been completed (stars > 0)
                const prevLesson = course.lessons[lessonIdx - 1];
                const prevKey = `${courseId}:${prevLesson.id}`;
                const prevProgress = get().lessonProgressMap[prevKey];
                return prevProgress !== undefined && prevProgress.stars > 0;
            },

            hydrateFromSupabase: (remoteProgress, remoteProficiency) => {
                const { proficiencyMap, lessonProgressMap } = get();

                // Merge learning progress: keep whichever has the highest stars/WPM
                const mergedProgress = { ...lessonProgressMap };
                for (const [key, remoteData] of Object.entries(remoteProgress)) {
                    const localData = mergedProgress[key];
                    if (!localData ||
                        remoteData.stars > localData.stars ||
                        (remoteData.stars === localData.stars && remoteData.bestWpm > localData.bestWpm)) {
                        mergedProgress[key] = remoteData;
                    }
                }

                // Merge key proficiency: keep whichever has more total attempts
                const mergedProficiency = { ...proficiencyMap };
                for (const [key, remoteData] of Object.entries(remoteProficiency)) {
                    const localData = mergedProficiency[key];
                    if (!localData || remoteData.totalAttempts > localData.totalAttempts) {
                        mergedProficiency[key] = remoteData;
                    }
                }

                set({
                    lessonProgressMap: mergedProgress,
                    proficiencyMap: mergedProficiency
                });
            },
        }),
        {
            name: 'typeforge-learning',
        }
    )
);
