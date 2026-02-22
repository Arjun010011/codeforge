'use client';

import { useEffect, useCallback } from 'react';
import { useTypingStore } from '@/stores/typingStore';
import ModeSelector from '@/components/typing/ModeSelector';
import TypingArea from '@/components/typing/TypingArea';
import ResultsCard from '@/components/results/ResultsCard';
import AnonymousWarning from '@/components/ui/AnonymousWarning';
import wordList from '@/lib/wordlists/english200.json';
import styles from './page.module.css';

export default function Home() {
  const generateTest = useTypingStore((s) => s.generateTest);
  const restart = useTypingStore((s) => s.restart);
  const status = useTypingStore((s) => s.status);
  const result = useTypingStore((s) => s.result);

  // Generate initial test on mount
  useEffect(() => {
    generateTest(wordList);
  }, [generateTest]);

  // Handle Tab+Enter to restart
  useEffect(() => {
    let tabPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        tabPressed = true;
        e.preventDefault();
      }
      if (e.key === 'Enter' && tabPressed) {
        e.preventDefault();
        restart(wordList);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        tabPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [restart]);

  const handleConfigChange = useCallback(() => {
    generateTest(wordList);
  }, [generateTest]);

  const handleRestart = useCallback(() => {
    restart(wordList);
  }, [restart]);

  return (
    <div className={styles.page}>
      {status !== 'finished' ? (
        <>
          <AnonymousWarning />
          <ModeSelector onConfigChange={handleConfigChange} />
          <TypingArea />
        </>
      ) : (
        result && (
          <ResultsCard result={result} onRestart={handleRestart} />
        )
      )}
    </div>
  );
}
