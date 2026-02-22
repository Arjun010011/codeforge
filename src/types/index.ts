// =====================================================
// TypeForge — Core Type Definitions
// =====================================================

// --- Typing Engine Types ---

export type LetterStatus = 'pending' | 'correct' | 'incorrect' | 'extra';

export interface LetterState {
  char: string;
  status: LetterStatus;
  typed?: string;
}

export interface WordState {
  letters: LetterState[];
  isCompleted: boolean;
}

export type TestMode = 'time' | 'words' | 'quote' | 'zen';

export type TestStatus = 'idle' | 'ready' | 'typing' | 'finished';

export interface TestConfig {
  mode: TestMode;
  timeLimit?: number;    // seconds (for time mode)
  wordCount?: number;    // word count (for words mode)
  punctuation: boolean;
  numbers: boolean;
  language: string;
}

export interface TestResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalChars: number;
  testDurationMs: number;
  timeline: TimelineEntry[];
  mode: TestMode;
  config: TestConfig;
  timestamp: number;
}

export interface TimelineEntry {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

// --- Settings Types ---

export type CaretStyle = 'line' | 'block' | 'underline' | 'outline';
export type ThemeName = 'dark' | 'light' | 'serika-dark';

export interface UserSettings {
  theme: ThemeName;
  fontFamily: string;
  fontSize: number;
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  showLiveWpm: boolean;
  showTimer: boolean;
  soundEnabled: boolean;
  soundVolume: number;
}

// --- Navigation ---

export type NavTab = 'practice' | 'learn';

// --- Learning Engine Types ---

export interface KeyProficiency {
  key: string;
  totalAttempts: number;
  correctAttempts: number;
  avgTimeMs: number;
  accuracy: number;
  confidence: number;       // 0-1 composite score
  isUnlocked: boolean;
}

export type Finger = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'left-thumb'
  | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky' | 'right-thumb';

export interface LessonDefinition {
  id: string;
  title: string;
  description: string;
  targetKeys: string[];      // keys this lesson focuses on
  minWpm: number;
  minAccuracy: number;
  starThresholds: [number, number, number]; // WPM thresholds for 1, 2, 3 stars
}

export interface CourseDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: LessonDefinition[];
}

export interface LessonResult {
  lessonId: string;
  courseId?: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  stars: number;             // 0-3
  keyStats: KeyLessonStat[];
  testDurationMs: number;
  timestamp: number;
}

export interface KeyLessonStat {
  key: string;
  attempts: number;
  correct: number;
  avgTimeMs: number;
}

export type LearningStatus = 'idle' | 'ready' | 'typing' | 'finished';
