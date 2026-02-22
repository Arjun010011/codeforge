// =====================================================
// TypeForge — Pseudoword Generator
// =====================================================
//
// Generates pronounceable pseudo-words from a set of
// unlocked characters. Weak keys are weighted to appear
// 2-3x more frequently for targeted practice.
// =====================================================

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Generate pseudowords from a set of available characters.
 * Weak keys appear more frequently for targeted practice.
 */
export function generatePseudowords(
    unlockedKeys: string[],
    weakKeys: string[],
    wordCount: number = 20,
    minLength: number = 3,
    maxLength: number = 7
): string[] {
    const available = unlockedKeys.map((k) => k.toLowerCase());
    const vowels = available.filter((c) => VOWELS.has(c));
    const consonants = available.filter((c) => !VOWELS.has(c));

    // If we don't have both vowels and consonants, fall back to simple sequences
    if (vowels.length === 0 || consonants.length === 0) {
        return generateSimpleWords(available, weakKeys, wordCount, minLength, maxLength);
    }

    // Build weighted pools: weak keys appear 3x more often
    const weakSet = new Set(weakKeys.map((k) => k.toLowerCase()));
    const weightedVowels = buildWeightedPool(vowels, weakSet);
    const weightedConsonants = buildWeightedPool(consonants, weakSet);

    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
        const length = minLength + Math.floor(Math.random() * (maxLength - minLength + 1));
        words.push(generateWord(weightedVowels, weightedConsonants, length));
    }

    return words;
}

/**
 * Build a weighted pool where weak keys appear 3x more often.
 */
function buildWeightedPool(chars: string[], weakSet: Set<string>): string[] {
    const pool: string[] = [];
    for (const c of chars) {
        pool.push(c);
        if (weakSet.has(c)) {
            pool.push(c, c); // 3x total for weak keys
        }
    }
    return pool;
}

/**
 * Generate a single pronounceable word using CV patterns.
 * Patterns: CV, CVC, CVCV, CVCCV, etc.
 */
function generateWord(vowels: string[], consonants: string[], length: number): string {
    let word = '';
    // Start with consonant ~70% of the time
    let useConsonant = Math.random() < 0.7;

    for (let i = 0; i < length; i++) {
        if (useConsonant) {
            word += pick(consonants);
        } else {
            word += pick(vowels);
        }

        // Alternate, but occasionally allow double consonants or vowels
        if (useConsonant) {
            // After consonant, usually a vowel (85%)
            useConsonant = Math.random() < 0.15;
        } else {
            // After vowel, usually a consonant (90%)
            useConsonant = Math.random() < 0.9;
        }
    }

    return word;
}

/**
 * Fallback: generate words from characters without vowel/consonant distinction.
 */
function generateSimpleWords(
    chars: string[],
    weakKeys: string[],
    wordCount: number,
    minLength: number,
    maxLength: number
): string[] {
    const weakSet = new Set(weakKeys.map((k) => k.toLowerCase()));
    const pool = buildWeightedPool(chars, weakSet);

    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
        const length = minLength + Math.floor(Math.random() * (maxLength - minLength + 1));
        let word = '';
        for (let j = 0; j < length; j++) {
            word += pick(pool);
        }
        words.push(word);
    }
    return words;
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
