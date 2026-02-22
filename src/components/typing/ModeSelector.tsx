'use client';

import { useTypingStore } from '@/stores/typingStore';
import { TestMode } from '@/types';
import styles from './ModeSelector.module.css';

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

interface ModeSelectorProps {
    onConfigChange: () => void;
}

export default function ModeSelector({ onConfigChange }: ModeSelectorProps) {
    const config = useTypingStore((s) => s.config);
    const setConfig = useTypingStore((s) => s.setConfig);
    const status = useTypingStore((s) => s.status);

    const disabled = status === 'typing';

    const handleModeChange = (mode: TestMode) => {
        if (disabled) return;
        setConfig({ mode });
        onConfigChange();
    };

    const handleTimeChange = (time: number) => {
        if (disabled) return;
        setConfig({ mode: 'time', timeLimit: time });
        onConfigChange();
    };

    const handleWordChange = (count: number) => {
        if (disabled) return;
        setConfig({ mode: 'words', wordCount: count });
        onConfigChange();
    };

    const handleToggle = (key: 'punctuation' | 'numbers') => {
        if (disabled) return;
        setConfig({ [key]: !config[key] });
        onConfigChange();
    };

    return (
        <div className={styles.modeBar} style={{ opacity: disabled ? 0.4 : 1 }}>
            {/* Feature toggles */}
            <div className={styles.toggleGroup}>
                <button
                    className={`${styles.toggle} ${config.punctuation ? styles.toggleActive : ''}`}
                    onClick={() => handleToggle('punctuation')}
                >
                    @ punctuation
                </button>
                <button
                    className={`${styles.toggle} ${config.numbers ? styles.toggleActive : ''}`}
                    onClick={() => handleToggle('numbers')}
                >
                    # numbers
                </button>
            </div>

            <div className={styles.separator} />

            {/* Mode selector */}
            <div className={styles.modeGroup}>
                {(['time', 'words', 'quote', 'zen'] as TestMode[]).map((mode) => (
                    <button
                        key={mode}
                        className={`${styles.modeBtn} ${config.mode === mode ? styles.modeBtnActive : ''}`}
                        onClick={() => handleModeChange(mode)}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            <div className={styles.separator} />

            {/* Time/Word options */}
            <div className={styles.modeGroup}>
                {config.mode === 'time' &&
                    TIME_OPTIONS.map((t) => (
                        <button
                            key={t}
                            className={`${styles.modeBtn} ${config.timeLimit === t ? styles.modeBtnActive : ''}`}
                            onClick={() => handleTimeChange(t)}
                        >
                            {t}
                        </button>
                    ))}
                {config.mode === 'words' &&
                    WORD_OPTIONS.map((w) => (
                        <button
                            key={w}
                            className={`${styles.modeBtn} ${config.wordCount === w ? styles.modeBtnActive : ''}`}
                            onClick={() => handleWordChange(w)}
                        >
                            {w}
                        </button>
                    ))}
            </div>
        </div>
    );
}
