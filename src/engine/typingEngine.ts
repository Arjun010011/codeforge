// =====================================================
// TypeForge — Core Typing Engine (pure logic, no React)
// =====================================================

import {
    WordState,
    LetterState,
    LetterStatus,
    TestConfig,
    TestResult,
    TimelineEntry,
} from '@/types';
import {
    calculateWPM,
    calculateRawWPM,
    calculateAccuracy,
    calculateConsistency,
} from './metrics';

export interface EngineState {
    words: WordState[];
    currentWordIndex: number;
    currentCharIndex: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    missedChars: number;
    totalTypedChars: number;
    startTime: number | null;
    endTime: number | null;
    timeline: TimelineEntry[];
    lastSecondTimestamp: number;
    lastSecondCorrect: number;
    lastSecondTotal: number;
}

/**
 * Create initial engine state from a list of words
 */
export function createEngineState(wordStrings: string[]): EngineState {
    const words: WordState[] = wordStrings.map((word) => ({
        letters: word.split('').map((char) => ({
            char,
            status: 'pending' as LetterStatus,
        })),
        isCompleted: false,
    }));

    return {
        words,
        currentWordIndex: 0,
        currentCharIndex: 0,
        correctChars: 0,
        incorrectChars: 0,
        extraChars: 0,
        missedChars: 0,
        totalTypedChars: 0,
        startTime: null,
        endTime: null,
        timeline: [],
        lastSecondTimestamp: 0,
        lastSecondCorrect: 0,
        lastSecondTotal: 0,
    };
}

/**
 * Process a character input and return the updated state
 * This is the main function called on every keystroke
 */
export function processInput(
    state: EngineState,
    char: string,
    now: number
): EngineState {
    const newState = { ...state };

    // Start timer on first input
    if (newState.startTime === null) {
        newState.startTime = now;
        newState.lastSecondTimestamp = now;
        newState.lastSecondCorrect = 0;
        newState.lastSecondTotal = 0;
    }

    // Record timeline entry every second
    const elapsed = now - newState.startTime;
    const currentSecond = Math.floor(elapsed / 1000);
    if (currentSecond > 0 && currentSecond > newState.timeline.length) {
        const secCorrect = newState.correctChars - newState.lastSecondCorrect;
        const secTotal = newState.totalTypedChars - newState.lastSecondTotal;
        newState.timeline = [
            ...newState.timeline,
            {
                second: currentSecond,
                wpm: calculateWPM(newState.correctChars, elapsed),
                rawWpm: calculateRawWPM(newState.totalTypedChars, elapsed),
                errors: secTotal - secCorrect,
            },
        ];
        newState.lastSecondCorrect = newState.correctChars;
        newState.lastSecondTotal = newState.totalTypedChars;
    }

    const currentWord = newState.words[newState.currentWordIndex];
    if (!currentWord) return newState;

    // Deep clone the current word
    const updatedWord: WordState = {
        letters: currentWord.letters.map((l) => ({ ...l })),
        isCompleted: currentWord.isCompleted,
    };

    // Handle space — move to next word
    if (char === ' ') {
        if (newState.currentCharIndex > 0) {
            // Mark remaining untyped chars as missed
            for (let i = newState.currentCharIndex; i < updatedWord.letters.length; i++) {
                updatedWord.letters[i].status = 'incorrect';
                newState.missedChars++;
            }
            updatedWord.isCompleted = true;
            newState.words = newState.words.map((w, i) =>
                i === newState.currentWordIndex ? updatedWord : w
            );
            newState.currentWordIndex++;
            newState.currentCharIndex = 0;
            newState.totalTypedChars++;
            newState.correctChars++; // Space counts as a correct keystroke
        }
        return newState;
    }

    // Type a character
    if (newState.currentCharIndex < updatedWord.letters.length) {
        // Normal character position
        const letter = updatedWord.letters[newState.currentCharIndex];
        if (char === letter.char) {
            updatedWord.letters[newState.currentCharIndex] = {
                ...letter,
                status: 'correct',
                typed: char,
            };
            newState.correctChars++;
        } else {
            updatedWord.letters[newState.currentCharIndex] = {
                ...letter,
                status: 'incorrect',
                typed: char,
            };
            newState.incorrectChars++;
        }
        newState.currentCharIndex++;
    } else {
        // Extra character beyond word length
        updatedWord.letters.push({
            char: '',
            status: 'extra',
            typed: char,
        });
        newState.extraChars++;
        newState.currentCharIndex++;
    }

    newState.totalTypedChars++;
    newState.words = newState.words.map((w, i) =>
        i === newState.currentWordIndex ? updatedWord : w
    );

    return newState;
}

/**
 * Process backspace and return updated state
 */
export function processBackspace(state: EngineState): EngineState {
    const newState = { ...state };
    const currentWord = newState.words[newState.currentWordIndex];
    if (!currentWord) return newState;

    if (newState.currentCharIndex > 0) {
        // --- BACKSPACE WITHIN CURRENT WORD ---
        const updatedWord: WordState = {
            letters: [...currentWord.letters.map((l) => ({ ...l }))],
            isCompleted: currentWord.isCompleted,
        };

        newState.currentCharIndex--;

        const lastLetter = updatedWord.letters[newState.currentCharIndex];
        if (lastLetter) {
            if (lastLetter.status === 'extra') {
                // Delete extra character entirely
                updatedWord.letters.splice(newState.currentCharIndex, 1);
                newState.extraChars = Math.max(0, newState.extraChars - 1);
            } else {
                // Revert normal character to pending
                if (lastLetter.status === 'correct') {
                    newState.correctChars = Math.max(0, newState.correctChars - 1);
                } else if (lastLetter.status === 'incorrect') {
                    // It was an actively typed incorrect character (not missed, because we are within word)
                    newState.incorrectChars = Math.max(0, newState.incorrectChars - 1);
                }
                updatedWord.letters[newState.currentCharIndex] = {
                    char: lastLetter.char,
                    status: 'pending',
                };
            }
        }

        newState.totalTypedChars = Math.max(0, newState.totalTypedChars - 1);
        newState.words = newState.words.map((w, i) =>
            i === newState.currentWordIndex ? updatedWord : w
        );

    } else if (newState.currentWordIndex > 0) {
        // --- BACKSPACE TO PREVIOUS WORD ---
        const prevWord = newState.words[newState.currentWordIndex - 1];

        // Only allow backspacing if the previous word has errors (incorrect marks or extra characters)
        const hasErrors = prevWord.letters.some(l => l.status === 'incorrect' || l.status === 'extra');

        if (hasErrors) {
            // Undo the spacebar stroke
            newState.totalTypedChars = Math.max(0, newState.totalTypedChars - 1);
            newState.correctChars = Math.max(0, newState.correctChars - 1);

            newState.currentWordIndex--;

            const updatedPrevWord: WordState = {
                letters: [...prevWord.letters.map((l) => ({ ...l }))],
                isCompleted: false, // Re-open the word
            };

            // Determine where the cursor should land (first untyped character, or end of word if extras exist)
            let newCharIdx = updatedPrevWord.letters.length;
            for (let i = 0; i < updatedPrevWord.letters.length; i++) {
                if (updatedPrevWord.letters[i].typed === undefined && updatedPrevWord.letters[i].status !== 'extra') {
                    newCharIdx = i;
                    break;
                }
            }

            // Revert all "missed" characters (which were marked 'incorrect' by spacebar) back to 'pending'
            for (let i = newCharIdx; i < updatedPrevWord.letters.length; i++) {
                if (updatedPrevWord.letters[i].status === 'incorrect') {
                    updatedPrevWord.letters[i].status = 'pending';
                    newState.missedChars = Math.max(0, newState.missedChars - 1);
                }
            }

            newState.currentCharIndex = newCharIdx;

            newState.words = newState.words.map((w, i) =>
                i === newState.currentWordIndex ? updatedPrevWord : w
            );
        }
    }

    return newState;
}

/**
 * Check if test should end (for words mode)
 */
export function isTestComplete(state: EngineState, config: TestConfig): boolean {
    if (config.mode === 'words' || config.mode === 'quote') {
        // Did we finish the last word entirely?
        if (state.currentWordIndex === state.words.length - 1) {
            const currentWord = state.words[state.currentWordIndex];
            if (state.currentCharIndex >= currentWord.letters.length) {
                return true;
            }
        }
        return state.currentWordIndex >= state.words.length;
    }
    return false;
}

/**
 * Finalize the test and calculate results
 */
export function finishTest(state: EngineState, config: TestConfig, now: number): TestResult {
    const endTime = now;
    const duration = endTime - (state.startTime || endTime);

    const totalOps = state.correctChars + state.incorrectChars + state.extraChars + state.missedChars;

    return {
        wpm: calculateWPM(state.correctChars, duration),
        rawWpm: calculateRawWPM(state.totalTypedChars, duration),
        accuracy: calculateAccuracy(state.correctChars, totalOps),
        consistency: calculateConsistency(state.timeline),
        correctChars: state.correctChars,
        incorrectChars: state.incorrectChars,
        extraChars: state.extraChars,
        missedChars: state.missedChars,
        totalChars: state.totalTypedChars,
        testDurationMs: duration,
        timeline: state.timeline,
        mode: config.mode,
        config,
        timestamp: endTime,
    };
}
