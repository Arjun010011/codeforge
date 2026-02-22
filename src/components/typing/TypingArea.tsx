"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTypingStore } from "@/stores/typingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./TypingArea.module.css";

export default function TypingArea() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(true);

  const engine = useTypingStore((s) => s.engine);
  const status = useTypingStore((s) => s.status);
  const config = useTypingStore((s) => s.config);
  const timeLeft = useTypingStore((s) => s.timeLeft);
  const liveWpm = useTypingStore((s) => s.liveWpm);
  const handleKeyPress = useTypingStore((s) => s.handleKeyPress);
  const handleBackspace = useTypingStore((s) => s.handleBackspace);
  const smoothCaret = useSettingsStore((s) => s.smoothCaret);
  const showLiveWpm = useSettingsStore((s) => s.showLiveWpm);
  const showTimer = useSettingsStore((s) => s.showTimer);

  // Focus management
  const focus = useCallback(() => {
    // Focus the hidden input instead of the wrapper
    const inputEl = wrapperRef.current?.querySelector('input');
    if (inputEl) {
      inputEl.focus();
    } else {
      wrapperRef.current?.focus();
    }
    setIsFocused(true);
  }, []);

  useEffect(() => {
    focus();
  }, [focus, status]);

  // Handle generic keydown events (desktop, backspace, etc)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (status === "finished") return;

      // Tab + Enter to restart (handled by parent)
      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault(); // Prevent navigating back in browser
        handleBackspace();
        return;
      }
    },
    [status, handleBackspace],
  );

  // Handle mobile and generic character input
  const onMobileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'finished') return;

    const val = e.target.value;
    if (!val) return; // Empty value means nothing typed or backspace handled elsewhere

    const char = val.charAt(val.length - 1);

    // Clear the input so it doesn't build up a massive string
    e.target.value = '';

    if (char === ' ') {
      handleKeyPress(' ');
    } else {
      handleKeyPress(char);
    }
  }, [status, handleKeyPress]);

  // Caret positioning
  useEffect(() => {
    if (!caretRef.current || !wordsRef.current) return;

    const wordElements = wordsRef.current.querySelectorAll("[data-word]");
    const currentWordEl = wordElements[engine.currentWordIndex];
    if (!currentWordEl) return;

    const letterElements = currentWordEl.querySelectorAll("[data-letter]");
    const wordsRect = wordsRef.current.getBoundingClientRect();

    let left: number;
    let top: number;
    const scrollTop = wordsRef.current.scrollTop;

    if (engine.currentCharIndex < letterElements.length) {
      const letterRect =
        letterElements[engine.currentCharIndex].getBoundingClientRect();
      left = letterRect.left - wordsRect.left;
      top = letterRect.top - wordsRect.top + scrollTop;
    } else if (letterElements.length > 0) {
      const lastLetterRect =
        letterElements[letterElements.length - 1].getBoundingClientRect();
      left = lastLetterRect.right - wordsRect.left;
      top = lastLetterRect.top - wordsRect.top + scrollTop;
    } else {
      const wordRect = currentWordEl.getBoundingClientRect();
      left = wordRect.left - wordsRect.left;
      top = wordRect.top - wordsRect.top + scrollTop;
    }

    caretRef.current.style.left = `${left}px`;
    caretRef.current.style.top = `${top}px`;
  }, [engine.currentWordIndex, engine.currentCharIndex, engine.words]);

  // Scroll words into view
  useEffect(() => {
    if (!wordsRef.current) return;
    const wordElements = wordsRef.current.querySelectorAll("[data-word]");
    const currentWordEl = wordElements[engine.currentWordIndex] as HTMLElement;
    if (!currentWordEl) return;

    const containerRect = wordsRef.current.getBoundingClientRect();
    const wordRect = currentWordEl.getBoundingClientRect();
    const relativeTop = wordRect.top - containerRect.top;

    // If the current word is below the visible area, scroll
    if (relativeTop > containerRect.height * 0.6) {
      const scrollAmount = relativeTop - containerRect.height * 0.3;
      wordsRef.current.scrollTo({
        top: wordsRef.current.scrollTop + scrollAmount,
        behavior: "smooth",
      });
    }
  }, [engine.currentWordIndex]);

  const isTyping = status === "typing";
  const showTimerDisplay =
    showTimer && config.mode === "time" && (isTyping || status === "ready");

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onClick={focus}
    >
      {/* Hidden input to trigger mobile keyboards natively */}
      <input
        type="text"
        className={styles.hiddenInput}
        onKeyDown={onKeyDown}
        onChange={onMobileInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Timer */}
      {showTimerDisplay && <div className={styles.timer}>{timeLeft}</div>}

      {/* Live WPM */}
      {showLiveWpm && isTyping && (
        <div className={styles.liveWpm}>{liveWpm} wpm</div>
      )}

      {/* Words */}
      <div
        ref={wordsRef}
        className={`${styles.wordsContainer} ${!isFocused && status !== "finished" ? styles.wordsContainerBlurred : ""}`}
      >
        <div className={styles.words}>
          {/* Caret */}
          {status !== "finished" && (
            <div
              ref={caretRef}
              className={`${styles.caret} ${smoothCaret ? styles.caretSmooth : ""} ${!isTyping ? styles.caretBlink : ""}`}
            />
          )}

          {engine.words.map((word, wordIdx) => {
            const hasError =
              word.isCompleted &&
              word.letters.some(
                (l) => l.status === "incorrect" || l.status === "extra",
              );

            return (
              <div
                key={wordIdx}
                data-word
                className={`${styles.word} ${hasError ? styles.wordError : ""}`}
              >
                {word.letters.map((letter, letterIdx) => {
                  let letterClass = styles.letterPending;
                  if (letter.status === "correct")
                    letterClass = styles.letterCorrect;
                  else if (letter.status === "incorrect")
                    letterClass = styles.letterIncorrect;
                  else if (letter.status === "extra")
                    letterClass = styles.letterExtra;

                  return (
                    <span
                      key={letterIdx}
                      data-letter
                      className={`${styles.letter} ${letterClass}`}
                    >
                      {letter.status === "extra" ? letter.typed : letter.char}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Focus overlay */}
        {!isFocused && status !== "finished" && (
          <div className={styles.focusOverlay} onClick={focus}>
            <span className={styles.focusText}>
              👆 Click here or press any key to focus
            </span>
          </div>
        )}
      </div>

      {/* Restart hint */}
      {(status === "ready" || status === "typing") && (
        <div className={styles.restartHint}>
          <kbd>tab</kbd> + <kbd>enter</kbd> to restart
        </div>
      )}
    </div>
  );
}
