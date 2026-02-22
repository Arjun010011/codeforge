'use client';

// =====================================================
// TypeForge — Typing Store (Zustand)
// =====================================================

import { create } from 'zustand';
import {
    TestConfig,
    TestResult,
    TestStatus,
    WordState,
} from '@/types';
import {
    createEngineState,
    processInput,
    processBackspace,
    isTestComplete,
    finishTest,
    EngineState,
} from '@/engine/typingEngine';
import { calculateWPM, calculateRawWPM } from '@/engine/metrics';

declare global {
    interface Window {
        Clerk?: {
            user?: {
                id: string;
            };
        };
    }
}

interface TypingStore {
    // Test configuration
    config: TestConfig;
    setConfig: (config: Partial<TestConfig>) => void;

    // Test state
    status: TestStatus;
    engine: EngineState;
    result: TestResult | null;

    // Timer
    timeLeft: number;
    elapsedMs: number;
    timerInterval: ReturnType<typeof setInterval> | null;

    // Live metrics
    liveWpm: number;
    liveRawWpm: number;

    // Actions
    generateTest: (wordList: string[]) => void;
    handleKeyPress: (char: string) => void;
    handleBackspace: () => void;
    startTimer: () => void;
    tick: () => void;
    finishCurrentTest: () => void;
    restart: (wordList: string[]) => void;
    reset: () => void;
}

const DEFAULT_CONFIG: TestConfig = {
    mode: 'time',
    timeLimit: 30,
    wordCount: 25,
    punctuation: false,
    numbers: false,
    language: 'english',
};

/**
 * Pick N random words from a word list
 */
function pickWords(wordList: string[], count: number): string[] {
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
        words.push(wordList[Math.floor(Math.random() * wordList.length)]);
    }
    return words;
}

/**
 * Get enough words for a time-based test (generous buffer)
 */
function getWordsForTimeMode(wordList: string[], timeLimit: number): string[] {
    // Average typist: ~40 WPM, ~5 chars/word → ~200 chars/min
    // We generate extra words to ensure we never run out
    const estimatedWords = Math.ceil((timeLimit / 60) * 80);
    return pickWords(wordList, Math.max(estimatedWords, 50));
}

export const useTypingStore = create<TypingStore>((set, get) => ({
    config: DEFAULT_CONFIG,
    status: 'idle',
    engine: createEngineState([]),
    result: null,
    timeLeft: DEFAULT_CONFIG.timeLimit || 30,
    elapsedMs: 0,
    timerInterval: null,
    liveWpm: 0,
    liveRawWpm: 0,

    setConfig: (partial) => {
        const newConfig = { ...get().config, ...partial };
        set({
            config: newConfig,
            timeLeft: newConfig.timeLimit || 30,
        });
    },

    generateTest: (wordList) => {
        const { config } = get();
        let words: string[];

        if (config.mode === 'time') {
            words = getWordsForTimeMode(wordList, config.timeLimit || 30);
        } else if (config.mode === 'words') {
            words = pickWords(wordList, config.wordCount || 25);
        } else {
            words = pickWords(wordList, 50);
        }

        set({
            engine: createEngineState(words),
            status: 'ready',
            result: null,
            timeLeft: config.timeLimit || 30,
            elapsedMs: 0,
            liveWpm: 0,
            liveRawWpm: 0,
        });
    },

    handleKeyPress: (char) => {
        const { status, engine, config } = get();
        if (status === 'finished') return;

        const now = Date.now();
        const newEngine = processInput(engine, char, now);

        // Start test on first keypress
        if (status === 'ready' || status === 'idle') {
            set({ status: 'typing' });
            get().startTimer();
        }

        // Calculate live metrics
        const elapsed = now - (newEngine.startTime || now);
        const liveWpm = calculateWPM(newEngine.correctChars, elapsed);
        const liveRawWpm = calculateRawWPM(newEngine.totalTypedChars, elapsed);

        set({ engine: newEngine, liveWpm, liveRawWpm });

        // Check if word-mode test is complete
        if (isTestComplete(newEngine, config)) {
            get().finishCurrentTest();
        }
    },

    handleBackspace: () => {
        const { status, engine } = get();
        if (status !== 'typing') return;

        const newEngine = processBackspace(engine);
        set({ engine: newEngine });
    },

    startTimer: () => {
        const { config, timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);

        if (config.mode === 'time') {
            const interval = setInterval(() => {
                get().tick();
            }, 100);
            set({ timerInterval: interval });
        } else {
            // For non-time modes, just track elapsed time
            const interval = setInterval(() => {
                const { engine } = get();
                if (engine.startTime) {
                    set({ elapsedMs: Date.now() - engine.startTime });
                }
            }, 100);
            set({ timerInterval: interval });
        }
    },

    tick: () => {
        const { engine, config, timeLeft } = get();
        if (!engine.startTime) return;

        const elapsed = Date.now() - engine.startTime;
        const limit = (config.timeLimit || 30) * 1000;
        const remaining = Math.max(0, Math.ceil((limit - elapsed) / 1000));

        set({
            timeLeft: remaining,
            elapsedMs: elapsed,
        });

        if (remaining <= 0) {
            get().finishCurrentTest();
        }
    },

    finishCurrentTest: () => {
        const { engine, config, timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);

        const now = Date.now();
        const result = finishTest(engine, config, now);

        set({
            status: 'finished',
            result,
            timerInterval: null,
        });

        // Fire & forget sync to Supabase if logged in
        if (typeof window !== 'undefined' && window.Clerk && window.Clerk.user) {
            import('@/lib/supabase').then(({ saveTestResult }) => {
                if (window.Clerk && window.Clerk.user) {
                    saveTestResult(window.Clerk.user.id, result);
                }
            });
        }
    },

    restart: (wordList) => {
        const { timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);

        set({
            status: 'idle',
            result: null,
            timerInterval: null,
            liveWpm: 0,
            liveRawWpm: 0,
        });

        // Small delay to allow state to settle
        setTimeout(() => {
            get().generateTest(wordList);
        }, 10);
    },

    reset: () => {
        const { timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);

        set({
            config: DEFAULT_CONFIG,
            status: 'idle',
            engine: createEngineState([]),
            result: null,
            timeLeft: DEFAULT_CONFIG.timeLimit || 30,
            elapsedMs: 0,
            timerInterval: null,
            liveWpm: 0,
            liveRawWpm: 0,
        });
    },
}));
