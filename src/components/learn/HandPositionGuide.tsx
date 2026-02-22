'use client';

// =====================================================
// TypeForge — Hand Position Guide
// =====================================================

import { useState } from 'react';
import Image from 'next/image';
import { Finger } from '@/types';
import { FINGER_COLORS } from '@/engine/adaptiveEngine';
import styles from './HandPositionGuide.module.css';

interface HandPositionGuideProps {
    highlightFinger?: Finger | null;
    collapsed?: boolean;
}

const FINGER_LABELS: { finger: Finger; label: string; keys: string }[] = [
    { finger: 'left-pinky', label: 'Left Pinky', keys: 'Q A Z 1' },
    { finger: 'left-ring', label: 'Left Ring', keys: 'W S X 2' },
    { finger: 'left-middle', label: 'Left Middle', keys: 'E D C 3' },
    { finger: 'left-index', label: 'Left Index', keys: 'R F V T G B 4 5' },
    { finger: 'right-index', label: 'Right Index', keys: 'Y H N U J M 6 7' },
    { finger: 'right-middle', label: 'Right Middle', keys: 'I K , 8' },
    { finger: 'right-ring', label: 'Right Ring', keys: 'O L . 9' },
    { finger: 'right-pinky', label: 'Right Pinky', keys: 'P ; / 0' },
];

export default function HandPositionGuide({
    highlightFinger = null,
    collapsed: initialCollapsed = false,
}: HandPositionGuideProps) {
    const [collapsed, setCollapsed] = useState(initialCollapsed);

    return (
        <div className={styles.container}>
            <button
                className={styles.toggleBtn}
                onClick={() => setCollapsed(!collapsed)}
            >
                <span className={styles.toggleIcon}>{collapsed ? '👐' : '👐'}</span>
                <span>Hand Position Guide</span>
                <span className={styles.chevron}>{collapsed ? '▼' : '▲'}</span>
            </button>

            {!collapsed && (
                <div className={styles.content}>
                    <div className={styles.imageContainer}>
                        <Image
                            src="/images/hand-position-guide.png"
                            alt="Proper hand positioning for touch typing — fingers on home row ASDF JKL;"
                            width={500}
                            height={400}
                            className={styles.guideImage}
                            priority={false}
                        />
                    </div>

                    <div className={styles.fingerGrid}>
                        {FINGER_LABELS.map(({ finger, label, keys }) => (
                            <div
                                key={finger}
                                className={`${styles.fingerCard} ${highlightFinger === finger ? styles.fingerHighlighted : ''}`}
                                style={{
                                    borderColor: highlightFinger === finger
                                        ? FINGER_COLORS[finger]
                                        : 'var(--border-color)',
                                }}
                            >
                                <div
                                    className={styles.fingerDot}
                                    style={{ backgroundColor: FINGER_COLORS[finger] }}
                                />
                                <div className={styles.fingerInfo}>
                                    <span className={styles.fingerLabel}>{label}</span>
                                    <span className={styles.fingerKeys}>{keys}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.tips}>
                        <h4 className={styles.tipsTitle}>💡 Tips</h4>
                        <ul className={styles.tipsList}>
                            <li>Keep your fingers on the <strong>home row</strong> (ASDF JKL;) at rest</li>
                            <li>Feel the <strong>bumps on F and J</strong> — they guide your index fingers</li>
                            <li>Each finger stays in its <strong>color zone</strong> — never cross zones</li>
                            <li>Keep your <strong>wrists relaxed</strong> and slightly elevated</li>
                            <li>Look at the <strong>screen, not the keyboard</strong></li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
