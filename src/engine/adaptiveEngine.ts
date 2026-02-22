// =====================================================
// TypeForge — Adaptive Learning Engine
// =====================================================
//
// Per-key proficiency tracking and character unlock logic.
// Follows ergonomic touch-typing progression from home row
// through numbers and symbols.
// =====================================================

import { KeyProficiency, Finger } from '@/types';

/**
 * Character unlock order — ergonomic touch-typing progression.
 */
export const UNLOCK_ORDER: string[][] = [
    // Phase 1: Home Row Core
    ['f', 'j'],
    ['d', 'k'],
    ['s', 'l'],
    ['a', ';'],
    // Phase 2: Home Row Extensions
    ['g', 'h'],
    // Phase 3: Top Row
    ['r', 'u'],
    ['e', 'i'],
    ['w', 'o'],
    ['t', 'y'],
    ['q', 'p'],
    // Phase 4: Bottom Row
    ['v', 'm'],
    ['c', ','],
    ['x', '.'],
    ['z', '/'],
    ['b', 'n'],
    // Phase 5: Numbers
    ['1', '2', '3', '4', '5'],
    ['6', '7', '8', '9', '0'],
    // Phase 6: Symbols
    ['!', '@', '#', '$', '%'],
    ['^', '&', '*', '(', ')'],
    ['-', '=', '_', '+'],
];

/**
 * Finger-to-key mapping for touch typing.
 */
export const FINGER_MAP: Record<string, Finger> = {
    // Left hand
    '`': 'left-pinky', '1': 'left-pinky', 'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky',
    '~': 'left-pinky', '!': 'left-pinky',
    '2': 'left-ring', 'w': 'left-ring', 's': 'left-ring', 'x': 'left-ring',
    '@': 'left-ring',
    '3': 'left-middle', 'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle',
    '#': 'left-middle',
    '4': 'left-index', 'r': 'left-index', 'f': 'left-index', 'v': 'left-index',
    '5': 'left-index', 't': 'left-index', 'g': 'left-index', 'b': 'left-index',
    '$': 'left-index', '%': 'left-index',
    ' ': 'left-thumb',
    // Right hand
    '6': 'right-index', 'y': 'right-index', 'h': 'right-index', 'n': 'right-index',
    '7': 'right-index', 'u': 'right-index', 'j': 'right-index', 'm': 'right-index',
    '^': 'right-index', '&': 'right-index',
    '8': 'right-middle', 'i': 'right-middle', 'k': 'right-middle', ',': 'right-middle',
    '*': 'right-middle',
    '9': 'right-ring', 'o': 'right-ring', 'l': 'right-ring', '.': 'right-ring',
    '(': 'right-ring',
    '0': 'right-pinky', 'p': 'right-pinky', ';': 'right-pinky', '/': 'right-pinky',
    '-': 'right-pinky', '=': 'right-pinky', '[': 'right-pinky', ']': 'right-pinky',
    '\\': 'right-pinky', '\'': 'right-pinky',
    ')': 'right-pinky', '_': 'right-pinky', '+': 'right-pinky',
};

/**
 * Finger display names and colors for UI.
 */
export const FINGER_COLORS: Record<Finger, string> = {
    'left-pinky': '#a855f7',    // purple
    'left-ring': '#3b82f6',     // blue
    'left-middle': '#22c55e',   // green
    'left-index': '#f59e0b',    // amber/orange
    'left-thumb': '#6b7280',    // gray
    'right-index': '#f59e0b',   // amber/orange
    'right-middle': '#22c55e',  // green
    'right-ring': '#3b82f6',    // blue
    'right-pinky': '#a855f7',   // purple
    'right-thumb': '#6b7280',   // gray
};

// Thresholds for key unlock
const ACCURACY_THRESHOLD = 0.95;
const SPEED_THRESHOLD_MS = 400;
const CONFIDENCE_THRESHOLD = 0.8;
const MIN_ATTEMPTS = 10;

/**
 * Create initial proficiency for a key.
 */
export function createKeyProficiency(key: string, isUnlocked: boolean = false): KeyProficiency {
    return {
        key,
        totalAttempts: 0,
        correctAttempts: 0,
        avgTimeMs: 0,
        accuracy: 0,
        confidence: 0,
        isUnlocked,
    };
}

/**
 * Update proficiency for a key after a typing session.
 */
export function updateKeyProficiency(
    prof: KeyProficiency,
    attempts: number,
    correct: number,
    avgTimeMs: number
): KeyProficiency {
    const newTotal = prof.totalAttempts + attempts;
    const newCorrect = prof.correctAttempts + correct;
    const newAccuracy = newTotal > 0 ? newCorrect / newTotal : 0;

    // Weighted average of time (recent data weighted more)
    const newAvgTime = prof.totalAttempts > 0
        ? (prof.avgTimeMs * prof.totalAttempts + avgTimeMs * attempts) / newTotal
        : avgTimeMs;

    // Confidence: composite of accuracy and speed
    const accuracyScore = Math.min(1, newAccuracy / ACCURACY_THRESHOLD);
    const speedScore = newAvgTime > 0 ? Math.min(1, SPEED_THRESHOLD_MS / newAvgTime) : 0;
    const attemptsFactor = Math.min(1, newTotal / MIN_ATTEMPTS);

    const confidence = (accuracyScore * 0.5 + speedScore * 0.3 + attemptsFactor * 0.2);

    return {
        ...prof,
        totalAttempts: newTotal,
        correctAttempts: newCorrect,
        avgTimeMs: Math.round(newAvgTime),
        accuracy: Math.round(newAccuracy * 10000) / 10000,
        confidence: Math.round(confidence * 1000) / 1000,
    };
}

/**
 * Get the list of currently unlocked keys based on proficiency data.
 */
export function getUnlockedKeys(proficiencyMap: Record<string, KeyProficiency>): string[] {
    return Object.values(proficiencyMap)
        .filter((p) => p.isUnlocked)
        .map((p) => p.key);
}

/**
 * Get keys that the user is weak at (below confidence threshold).
 */
export function getWeakKeys(
    proficiencyMap: Record<string, KeyProficiency>,
    threshold: number = 0.6
): string[] {
    return Object.values(proficiencyMap)
        .filter((p) => p.isUnlocked && p.confidence < threshold && p.totalAttempts > 0)
        .sort((a, b) => a.confidence - b.confidence)
        .map((p) => p.key);
}

/**
 * Check if the next set of keys should be unlocked.
 * Returns the keys to unlock, or empty array if not ready.
 */
export function checkForUnlocks(proficiencyMap: Record<string, KeyProficiency>): string[] {
    const unlocked = new Set(getUnlockedKeys(proficiencyMap));

    for (const group of UNLOCK_ORDER) {
        const allUnlocked = group.every((k) => unlocked.has(k));
        if (!allUnlocked) {
            // Check if all previously unlocked keys meet the threshold
            const allReady = Array.from(unlocked).every((k) => {
                const prof = proficiencyMap[k];
                return !prof || prof.confidence >= CONFIDENCE_THRESHOLD || prof.totalAttempts === 0;
            });

            if (allReady) {
                // Return keys from this group that aren't yet unlocked
                return group.filter((k) => !unlocked.has(k));
            }
            return [];
        }
    }
    return [];
}

/**
 * Get the initial set of unlocked keys (home row core: f, j).
 */
export function getInitialProficiencyMap(): Record<string, KeyProficiency> {
    const map: Record<string, KeyProficiency> = {};
    // Unlock the first group by default
    const initialKeys = UNLOCK_ORDER[0];
    for (const key of initialKeys) {
        map[key] = createKeyProficiency(key, true);
    }
    return map;
}

/**
 * Get which finger should press a given key.
 */
export function getFingerForKey(key: string): Finger | undefined {
    return FINGER_MAP[key.toLowerCase()];
}

/**
 * Get a proficiency color (green → yellow → red) based on confidence.
 */
export function getProficiencyColor(confidence: number): string {
    if (confidence >= 0.8) return '#22c55e';  // green
    if (confidence >= 0.5) return '#f59e0b';  // amber
    if (confidence >= 0.3) return '#ef4444';  // red
    return '#6b7280';                          // gray (untested)
}
