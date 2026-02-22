'use client';

// =====================================================
// TypeForge — AuthSync Component
// =====================================================

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { loadUserDataFromSupabase } from '@/lib/supabase';
import { useLearningStore } from '@/stores/learningStore';

export default function AuthSync() {
    const { user, isLoaded, isSignedIn } = useUser();
    const hasSyncedRef = useRef(false);

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && user && !hasSyncedRef.current) {
            console.log('User signed in, syncing data from Supabase for:', user.id);
            hasSyncedRef.current = true;

            // Fetch remote data and hydrate stores
            loadUserDataFromSupabase(user.id).then(({ lessonProgressMap, proficiencyMap }) => {
                useLearningStore.getState().hydrateFromSupabase(lessonProgressMap, proficiencyMap);
                console.log('Successfully hydrated Zustand from Supabase');
            }).catch(err => {
                console.error('Failed to load user data from Supabase:', err);
                hasSyncedRef.current = false; // Allow retry
            });

        } else if (!isSignedIn) {
            // User signed out
            if (hasSyncedRef.current) {
                console.log('User signed out, clearing sync state');
                hasSyncedRef.current = false;
            }
        }
    }, [isLoaded, isSignedIn, user]);

    return null; // Invisible component
}
