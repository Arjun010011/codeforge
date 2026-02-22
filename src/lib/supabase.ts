import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
// Only initialize if keys are present so the app doesn't crash on boot without them
export const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// =====================================================
// TypeForge — Data Sync Service
// =====================================================

import { TestResult, KeyLessonStat, KeyProficiency } from '@/types';

/**
 * Saves a completed typing test result to Supabase
 */
export async function saveTestResult(
    userId: string,
    result: TestResult
) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };

    const { data, error } = await supabase
        .from('test_results')
        .insert({
            user_id: userId,
            wpm: result.wpm,
            raw_wpm: result.rawWpm,
            accuracy: result.accuracy,
            consistency: result.consistency,
            mode: result.mode || 'time',
            created_at: new Date(result.timestamp || Date.now()).toISOString(),
        });

    if (error) {
        console.error('Error saving test result:', error);
    }
    return { data, error };
}

/**
 * Saves completed lesson progress to Supabase
 */
export async function saveLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    stars: number,
    bestWpm: number,
    bestAccuracy: number
) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };

    const { data, error } = await supabase
        .from('learning_progress')
        .upsert({
            user_id: userId,
            course_id: courseId,
            lesson_id: lessonId,
            stars,
            best_wpm: bestWpm,
            best_accuracy: bestAccuracy,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, course_id, lesson_id'
        });

    if (error) {
        console.error('Error saving lesson progress:', error);
    }
    return { data, error };
}

/**
 * Syncs batch of key proficiency updates to Supabase
 */
export async function syncKeyProficiency(
    userId: string,
    keyStats: KeyLessonStat[],
    fullMap: Record<string, KeyProficiency>
) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };

    const rows = keyStats.map(stat => {
        const key = stat.key.toLowerCase();
        const prof = fullMap[key];
        return {
            user_id: userId,
            key: key,
            attempts: prof.totalAttempts,
            correct: prof.correctAttempts,
            avg_time_ms: prof.avgTimeMs,
            accuracy: prof.accuracy,
            confidence: prof.confidence,
            is_unlocked: prof.isUnlocked,
            updated_at: new Date().toISOString()
        };
    });

    const { data, error } = await supabase
        .from('key_proficiency')
        .upsert(rows, { onConflict: 'user_id, key' });

    if (error) {
        console.error('Error syncing key proficiency:', error);
    }
    return { data, error };
}

/**
 * Loads all learning data for a user from Supabase
 * Returns formatted data ready to be merged into Zustand
 */
export async function loadUserDataFromSupabase(userId: string) {
    if (!supabase) return { lessonProgressMap: {}, proficiencyMap: {} };

    // 1. Fetch lesson progress
    const { data: progressData, error: progressErr } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId);

    if (progressErr) console.error('Error loading lesson progress:', progressErr);

    // 2. Fetch key proficiency
    const { data: profData, error: profErr } = await supabase
        .from('key_proficiency')
        .select('*')
        .eq('user_id', userId);

    if (profErr) console.error('Error loading key proficiency:', profErr);

    // Format for Zustand Map
    const lessonProgressMap: Record<string, any> = {};
    if (progressData) {
        for (const row of progressData) {
            const mapKey = `${row.course_id}:${row.lesson_id}`;
            lessonProgressMap[mapKey] = {
                courseId: row.course_id,
                lessonId: row.lesson_id,
                stars: row.stars,
                bestWpm: row.best_wpm,
                bestAccuracy: row.best_accuracy,
                completedAt: new Date(row.updated_at || row.created_at).getTime(),
            };
        }
    }

    // Format for Zustand Map
    const proficiencyMap: Record<string, KeyProficiency> = {};
    if (profData) {
        for (const row of profData) {
            // Reconstruct the key object using properties mapped to our shape
            proficiencyMap[row.key] = {
                key: row.key,
                totalAttempts: row.attempts,
                correctAttempts: row.correct,
                avgTimeMs: row.avg_time_ms,
                accuracy: row.accuracy,
                confidence: row.confidence,
                isUnlocked: row.is_unlocked,
            };
        }
    }

    return { lessonProgressMap, proficiencyMap };
}

/**
 * Fetches the user's recent typing tests for the Profile page
 */
export async function fetchUserTestHistory(userId: string, limit = 50) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching test history:', error);
        return [];
    }
    return data;
}
