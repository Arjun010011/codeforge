'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Synchronizes the stored theme to the HTML data-theme attribute on mount.
 * This prevents a flash of wrong theme on page load.
 */
export function ThemeInitializer() {
    const theme = useSettingsStore((s) => s.theme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return null;
}
