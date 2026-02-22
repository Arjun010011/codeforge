'use client';

// =====================================================
// TypeForge — Virtual Keyboard with Accuracy Heatmap
// =====================================================

import { KeyProficiency, Finger } from '@/types';
import { FINGER_MAP, FINGER_COLORS, getProficiencyColor } from '@/engine/adaptiveEngine';
import styles from './VirtualKeyboard.module.css';

interface VirtualKeyboardProps {
    proficiencyMap: Record<string, KeyProficiency>;
    targetKeys?: string[];
    highlightFinger?: Finger | null;
    showFingerZones?: boolean;
}

const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
];

export default function VirtualKeyboard({
    proficiencyMap,
    targetKeys = [],
    highlightFinger = null,
    showFingerZones = false,
}: VirtualKeyboardProps) {
    const targetSet = new Set(targetKeys.map(k => k.toLowerCase()));

    return (
        <div className={styles.keyboard}>
            {KEYBOARD_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className={styles.row} style={{ paddingLeft: `${rowIdx * 1.2}em` }}>
                    {row.map((key) => {
                        const prof = proficiencyMap[key];
                        const finger = FINGER_MAP[key];
                        const isTarget = targetSet.has(key);
                        const isUnlocked = prof?.isUnlocked ?? false;
                        const isHighlightedFinger = highlightFinger && finger === highlightFinger;

                        // Determine key color
                        let bgColor: string;
                        if (showFingerZones && finger) {
                            bgColor = FINGER_COLORS[finger] + '30'; // 30 = ~19% opacity hex
                        } else if (prof && prof.totalAttempts > 0) {
                            bgColor = getProficiencyColor(prof.confidence) + '40';
                        } else {
                            bgColor = 'var(--surface-color)';
                        }

                        const borderColor = isTarget
                            ? 'var(--main-color)'
                            : isHighlightedFinger
                                ? FINGER_COLORS[finger!]
                                : 'transparent';

                        return (
                            <div
                                key={key}
                                className={`${styles.key} ${!isUnlocked && !isTarget ? styles.keyLocked : ''} ${isTarget ? styles.keyTarget : ''}`}
                                style={{
                                    backgroundColor: bgColor,
                                    borderColor,
                                }}
                                title={
                                    prof
                                        ? `${key}: ${Math.round(prof.confidence * 100)}% confidence, ${prof.totalAttempts} attempts`
                                        : `${key}: not yet practiced`
                                }
                            >
                                <span className={styles.keyLabel}>{key.toUpperCase()}</span>
                                {prof && prof.totalAttempts > 0 && (
                                    <div
                                        className={styles.confidenceBar}
                                        style={{
                                            width: `${Math.round(prof.confidence * 100)}%`,
                                            backgroundColor: getProficiencyColor(prof.confidence),
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Space bar */}
            <div className={styles.row} style={{ justifyContent: 'center' }}>
                <div className={styles.spaceBar}>
                    <span className={styles.keyLabel}>SPACE</span>
                </div>
            </div>
        </div>
    );
}
