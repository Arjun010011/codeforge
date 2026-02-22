'use client';

// =====================================================
// TypeForge — Lesson View (shared lesson typing UI)
// =====================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { KeyLessonStat } from '@/types';
import {
    createEngineState,
    processInput,
    processBackspace,
    EngineState,
} from '@/engine/typingEngine';
import {
    calculateWPM,
    calculateRawWPM,
    calculateAccuracy,
    calculateConsistency,
} from '@/engine/metrics';
import { getFingerForKey } from '@/engine/adaptiveEngine';
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard';
import HandPositionGuide from './HandPositionGuide';
import styles from './LessonView.module.css';
import { useLearningStore } from '@/stores/learningStore';

interface LessonViewProps {
    words: string[];
    targetKeys: string[];
    lessonId: string;
    courseId?: string;
    onComplete?: () => void;
    showHandGuide?: boolean;
}

interface PerKeyTracker {
    [key: string]: {
        attempts: number;
        correct: number;
        times: number[];
        lastTimestamp: number;
    };
}

export default function LessonView({
    words,
    targetKeys,
    lessonId,
    courseId,
    onComplete,
    showHandGuide = true,
}: LessonViewProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const wordsRef = useRef<HTMLDivElement>(null);
    const caretRef = useRef<HTMLDivElement>(null);

    const [engine, setEngine] = useState<EngineState>(() =>
        createEngineState(words)
    );
    const [status, setStatus] = useState<'ready' | 'typing' | 'finished'>('ready');
    const [isFocused, setIsFocused] = useState(true);
    const [liveWpm, setLiveWpm] = useState(0);

    const keyTrackerRef = useRef<PerKeyTracker>({});
    const proficiencyMap = useLearningStore((s) => s.proficiencyMap);
    const completeLessonWithStats = useLearningStore((s) => s.completeLessonWithStats);

    // Reset when words change
    useEffect(() => {
        setEngine(createEngineState(words));
        setStatus('ready');
        setLiveWpm(0);
        keyTrackerRef.current = {};
    }, [words]);

    // Focus management
    const focus = useCallback(() => {
        wrapperRef.current?.focus();
        setIsFocused(true);
    }, []);

    useEffect(() => {
        focus();
    }, [focus, status]);

    // Handle keyboard input
    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (status === 'finished') return;

            if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') {
                e.preventDefault();
            }

            if (e.key === 'Backspace') {
                setEngine((prev) => processBackspace(prev));
                return;
            }

            if (e.key === ' ' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                const now = Date.now();
                const char = e.key;

                setEngine((prev) => {
                    const newEngine = processInput(prev, char, now);

                    if (status === 'ready') {
                        setStatus('typing');
                    }

                    // Track per-key stats
                    if (char !== ' ' && char.length === 1) {
                        const tracker = keyTrackerRef.current;
                        const key = char.toLowerCase();
                        if (!tracker[key]) {
                            tracker[key] = { attempts: 0, correct: 0, times: [], lastTimestamp: now };
                        }
                        tracker[key].attempts++;

                        // Check if it was correct
                        const currentWord = prev.words[prev.currentWordIndex];
                        if (currentWord && prev.currentCharIndex < currentWord.letters.length) {
                            const expected = currentWord.letters[prev.currentCharIndex].char;
                            if (char === expected) {
                                tracker[key].correct++;
                            }
                        }

                        // Track time between keystrokes
                        const timeDiff = now - tracker[key].lastTimestamp;
                        if (timeDiff < 2000 && timeDiff > 50) {
                            tracker[key].times.push(timeDiff);
                        }
                        tracker[key].lastTimestamp = now;
                    }

                    // Update live WPM
                    if (newEngine.startTime) {
                        const elapsed = now - newEngine.startTime;
                        setLiveWpm(calculateWPM(newEngine.correctChars, elapsed));
                    }

                    // Check if all words completed
                    if (newEngine.currentWordIndex >= newEngine.words.length) {
                        const endTime = now;
                        const duration = endTime - (newEngine.startTime || endTime);

                        // Compile per-key stats
                        const keyStats: KeyLessonStat[] = Object.entries(keyTrackerRef.current).map(
                            ([key, data]) => ({
                                key,
                                attempts: data.attempts,
                                correct: data.correct,
                                avgTimeMs:
                                    data.times.length > 0
                                        ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
                                        : 0,
                            })
                        );

                        const wpm = calculateWPM(newEngine.correctChars, duration);
                        const rawWpm = calculateRawWPM(newEngine.totalTypedChars, duration);
                        const accuracy = calculateAccuracy(newEngine.correctChars, newEngine.totalTypedChars);
                        const consistency = calculateConsistency(newEngine.timeline);

                        completeLessonWithStats(
                            lessonId, courseId, wpm, rawWpm, accuracy, consistency, keyStats, duration
                        );

                        setStatus('finished');
                        onComplete?.();
                    }

                    return newEngine;
                });
            }
        },
        [status, lessonId, courseId, completeLessonWithStats, onComplete]
    );

    // Caret positioning
    useEffect(() => {
        if (!caretRef.current || !wordsRef.current) return;

        const wordElements = wordsRef.current.querySelectorAll('[data-word]');
        const currentWordEl = wordElements[engine.currentWordIndex];
        if (!currentWordEl) return;

        const letterElements = currentWordEl.querySelectorAll('[data-letter]');
        const wordsRect = wordsRef.current.getBoundingClientRect();
        const scrollTop = wordsRef.current.scrollTop;

        let left: number;
        let top: number;

        if (engine.currentCharIndex < letterElements.length) {
            const letterRect = letterElements[engine.currentCharIndex].getBoundingClientRect();
            left = letterRect.left - wordsRect.left;
            top = letterRect.top - wordsRect.top + scrollTop;
        } else if (letterElements.length > 0) {
            const lastRect = letterElements[letterElements.length - 1].getBoundingClientRect();
            left = lastRect.right - wordsRect.left;
            top = lastRect.top - wordsRect.top + scrollTop;
        } else {
            const wordRect = currentWordEl.getBoundingClientRect();
            left = wordRect.left - wordsRect.left;
            top = wordRect.top - wordsRect.top + scrollTop;
        }

        caretRef.current.style.left = `${left}px`;
        caretRef.current.style.top = `${top}px`;
    }, [engine.currentWordIndex, engine.currentCharIndex, engine.words]);

    // Current character's finger highlight
    const currentFinger = (() => {
        const currentWord = engine.words[engine.currentWordIndex];
        if (!currentWord || engine.currentCharIndex >= currentWord.letters.length) return null;
        const char = currentWord.letters[engine.currentCharIndex].char;
        return getFingerForKey(char) || null;
    })();

    return (
        <div className={styles.wrapper}>
            {/* Live WPM */}
            {status === 'typing' && (
                <div className={styles.liveWpm}>{liveWpm} wpm</div>
            )}

            {/* Target Keys Display */}
            <div className={styles.targetKeys}>
                <span className={styles.targetLabel}>target keys:</span>
                {targetKeys.slice(0, 12).map((k) => (
                    <span key={k} className={styles.targetKey}>{k.toUpperCase()}</span>
                ))}
                {targetKeys.length > 12 && (
                    <span className={styles.targetMore}>+{targetKeys.length - 12}</span>
                )}
            </div>

            {/* Typing Area */}
            <div
                ref={wrapperRef}
                className={styles.typingWrapper}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            >
                <div
                    ref={wordsRef}
                    className={`${styles.wordsContainer} ${!isFocused && status !== 'finished' ? styles.wordsBlurred : ''}`}
                >
                    <div className={styles.words}>
                        {/* Caret */}
                        {status !== 'finished' && (
                            <div ref={caretRef} className={styles.caret} />
                        )}

                        {engine.words.map((word, wordIdx) => {
                            const hasError =
                                word.isCompleted &&
                                word.letters.some((l) => l.status === 'incorrect' || l.status === 'extra');

                            return (
                                <div
                                    key={wordIdx}
                                    data-word
                                    className={`${styles.word} ${hasError ? styles.wordError : ''}`}
                                >
                                    {word.letters.map((letter, letterIdx) => {
                                        let letterClass = styles.letterPending;
                                        if (letter.status === 'correct') letterClass = styles.letterCorrect;
                                        else if (letter.status === 'incorrect') letterClass = styles.letterIncorrect;
                                        else if (letter.status === 'extra') letterClass = styles.letterExtra;

                                        return (
                                            <span
                                                key={letterIdx}
                                                data-letter
                                                className={`${styles.letter} ${letterClass}`}
                                            >
                                                {letter.status === 'extra' ? letter.typed : letter.char}
                                            </span>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {!isFocused && status !== 'finished' && (
                        <div className={styles.focusOverlay} onClick={focus}>
                            <span className={styles.focusText}>👆 Click to focus</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Virtual Keyboard */}
            <div className={styles.keyboardSection}>
                <VirtualKeyboard
                    proficiencyMap={proficiencyMap}
                    targetKeys={targetKeys}
                    highlightFinger={currentFinger}
                    showFingerZones={status === 'ready'}
                />
            </div>

            {/* Hand Position Guide */}
            {showHandGuide && (
                <HandPositionGuide
                    highlightFinger={currentFinger}
                    collapsed={status === 'typing'}
                />
            )}
        </div>
    );
}
