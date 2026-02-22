'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useSettingsStore } from '@/stores/settingsStore';
import { ThemeName } from '@/types';
import styles from './Navbar.module.css';

const THEMES: ThemeName[] = ['dark', 'serika-dark', 'light'];

export default function Navbar() {
    const pathname = usePathname();
    const theme = useSettingsStore((s) => s.theme);
    const setTheme = useSettingsStore((s) => s.setTheme);

    const cycleTheme = () => {
        const currentIndex = THEMES.indexOf(theme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        setTheme(THEMES[nextIndex]);
    };

    const isPractice = pathname === '/';
    const isLearn = pathname.startsWith('/learn');

    return (
        <nav className={styles.navbar}>
            <div className={styles.leftSection}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>⌨</span>
                    <div>
                        <span>typeforge</span>
                        <div className={styles.logoSub}>typing reimagined</div>
                    </div>
                </Link>

                <div className={styles.navTabs}>
                    <Link
                        href="/"
                        className={`${styles.navTab} ${isPractice ? styles.navTabActive : ''}`}
                    >
                        practice
                    </Link>
                    <Link
                        href="/learn"
                        className={`${styles.navTab} ${isLearn ? styles.navTabActive : ''}`}
                    >
                        learn
                    </Link>
                </div>
            </div>

            <div className={styles.rightSection}>
                <span className={styles.commandHint}>ctrl+k</span>
                <button
                    className={styles.themeBtn}
                    onClick={cycleTheme}
                    title={`Theme: ${theme}`}
                >
                    {theme === 'light' ? '☀' : '🌙'}
                </button>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className={styles.signInBtn}>sign in</button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <Link href="/profile" className={styles.profileBtn}>
                        profile
                    </Link>
                    <UserButton
                        appearance={{
                            elements: {
                                userButtonAvatarBox: {
                                    width: '32px',
                                    height: '32px',
                                }
                            }
                        }}
                    />
                </SignedIn>
            </div>
        </nav>
    );
}
