'use client';

import { TestResult } from '@/types';
import { motion } from 'framer-motion';
import styles from './ResultsCard.module.css';

interface ResultsCardProps {
    result: TestResult;
    onRestart: () => void;
}

export default function ResultsCard({ result, onRestart }: ResultsCardProps) {
    const modeLabel =
        result.config.mode === 'time'
            ? `time ${result.config.timeLimit}s`
            : result.config.mode === 'words'
                ? `words ${result.config.wordCount}`
                : result.config.mode;

    const durationSec = Math.round(result.testDurationMs / 1000);

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.headerMode}>{modeLabel}</span>
                </div>

                {/* Big Stats */}
                <div className={styles.mainStats}>
                    <div className={styles.bigStat}>
                        <span className={styles.bigStatLabel}>wpm</span>
                        <span className={styles.bigStatValue}>{result.wpm}</span>
                    </div>
                    <div className={styles.bigStat}>
                        <span className={styles.bigStatLabel}>accuracy</span>
                        <span className={styles.bigStatValueSecondary}>
                            {result.accuracy}%
                        </span>
                    </div>
                </div>

                {/* Detail Grid */}
                <div className={styles.detailGrid}>
                    <div className={styles.detailStat}>
                        <span className={styles.detailLabel}>raw wpm</span>
                        <span className={styles.detailValue}>{result.rawWpm}</span>
                    </div>
                    <div className={styles.detailStat}>
                        <span className={styles.detailLabel}>consistency</span>
                        <span className={styles.detailValue}>{result.consistency}%</span>
                    </div>
                    <div className={styles.detailStat}>
                        <span className={styles.detailLabel}>characters</span>
                        <span className={styles.detailValue}>{result.totalChars}</span>
                    </div>
                    <div className={styles.detailStat}>
                        <span className={styles.detailLabel}>time</span>
                        <span className={styles.detailValue}>{durationSec}s</span>
                    </div>
                </div>

                {/* Character Breakdown */}
                <div className={styles.charBreakdown}>
                    <div className={styles.charItem}>
                        <span className={styles.charCorrect}>{result.correctChars}</span>
                        <span className={styles.charLabel}>correct</span>
                    </div>
                    <div className={styles.charItem}>
                        <span className={styles.charIncorrect}>
                            {result.incorrectChars}
                        </span>
                        <span className={styles.charLabel}>incorrect</span>
                    </div>
                    <div className={styles.charItem}>
                        <span className={styles.charExtra}>{result.extraChars}</span>
                        <span className={styles.charLabel}>extra</span>
                    </div>
                    <div className={styles.charItem}>
                        <span className={styles.charMissed}>{result.missedChars}</span>
                        <span className={styles.charLabel}>missed</span>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button className={styles.restartBtn} onClick={onRestart}>
                        ↻ next test
                    </button>
                </div>

                {/* Login prompt (placeholder for anonymous users) */}
                <div className={styles.loginPrompt}>
                    <p className={styles.loginText}>
                        Sign in to save your results and track progress
                    </p>
                    <button className={styles.loginBtn}>Sign in with Google</button>
                </div>
            </motion.div>
        </motion.div>
    );
}
