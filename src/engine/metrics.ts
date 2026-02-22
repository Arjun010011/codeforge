// =====================================================
// TypeForge — Metrics Calculation Engine
// =====================================================

import { TimelineEntry } from '@/types';

/**
 * Calculate WPM (Words Per Minute)
 * Standard: 1 word = 5 characters
 */
export function calculateWPM(correctChars: number, elapsedMs: number): number {
    if (elapsedMs <= 0) return 0;
    const minutes = elapsedMs / 60000;
    const words = correctChars / 5;
    return Math.round(words / minutes);
}

/**
 * Calculate Raw WPM (includes incorrect characters)
 */
export function calculateRawWPM(totalChars: number, elapsedMs: number): number {
    if (elapsedMs <= 0) return 0;
    const minutes = elapsedMs / 60000;
    const words = totalChars / 5;
    return Math.round(words / minutes);
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
    if (totalChars <= 0) return 100;
    return Math.round((correctChars / totalChars) * 10000) / 100;
}

/**
 * Calculate consistency (100 - coefficient of variation of per-second WPM)
 * Higher = more consistent typing speed
 */
export function calculateConsistency(timeline: TimelineEntry[]): number {
    if (timeline.length < 2) return 100;

    const wpmValues = timeline.map((t) => t.wpm).filter((w) => w > 0);
    if (wpmValues.length < 2) return 100;

    const mean = wpmValues.reduce((sum, v) => sum + v, 0) / wpmValues.length;
    if (mean === 0) return 0;

    const variance =
        wpmValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        wpmValues.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;

    return Math.round(Math.max(0, Math.min(100, 100 - cv)));
}
