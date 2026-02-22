'use client';

// =====================================================
// TypeForge — Settings Store (Zustand with persistence)
// =====================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, ThemeName, CaretStyle } from '@/types';

interface SettingsStore extends UserSettings {
    setTheme: (theme: ThemeName) => void;
    setFontFamily: (font: string) => void;
    setFontSize: (size: number) => void;
    setCaretStyle: (style: CaretStyle) => void;
    setSmoothCaret: (smooth: boolean) => void;
    setShowLiveWpm: (show: boolean) => void;
    setShowTimer: (show: boolean) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setSoundVolume: (volume: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            // Defaults
            theme: 'dark',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 24,
            caretStyle: 'line',
            smoothCaret: true,
            showLiveWpm: false,
            showTimer: true,
            soundEnabled: false,
            soundVolume: 0.5,

            // Setters
            setTheme: (theme) => {
                set({ theme });
                if (typeof document !== 'undefined') {
                    document.documentElement.setAttribute('data-theme', theme);
                }
            },
            setFontFamily: (fontFamily) => set({ fontFamily }),
            setFontSize: (fontSize) => set({ fontSize }),
            setCaretStyle: (caretStyle) => set({ caretStyle }),
            setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
            setShowLiveWpm: (showLiveWpm) => set({ showLiveWpm }),
            setShowTimer: (showTimer) => set({ showTimer }),
            setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
            setSoundVolume: (soundVolume) => set({ soundVolume }),
        }),
        {
            name: 'typeforge-settings',
        }
    )
);
