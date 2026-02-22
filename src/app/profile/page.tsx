import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { fetchUserTestHistory } from '@/lib/supabase';
import WpmChart from '@/components/profile/WpmChart';
import styles from './page.module.css';

// Force dynamic rendering since we rely on current user auth & DB fetch
export const dynamic = 'force-dynamic';

function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default async function ProfilePage() {
    // 1. Authenticate user
    const user = await currentUser();
    if (!user) {
        redirect('/'); // Should be caught by middleware, but fallback
    }

    // 2. Fetch history from DB
    const testHistory = await fetchUserTestHistory(user.id, 20);

    // 3. Compute stats
    let totalTests = testHistory.length;
    let maxWpm = 0;
    let avgWpm = 0;
    let avgAcc = 0;

    if (totalTests > 0) {
        maxWpm = Math.max(...testHistory.map((t) => t.wpm));
        avgWpm = testHistory.reduce((sum, t) => sum + t.wpm, 0) / totalTests;
        avgAcc = testHistory.reduce((sum, t) => sum + t.accuracy, 0) / totalTests;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <img
                    src={user.imageUrl}
                    alt="Profile"
                    className={styles.avatar}
                />
                <div className={styles.userInfo}>
                    <h1 className={styles.userName}>
                        {user.firstName || user.username || 'Typist'}
                    </h1>
                    <p className={styles.joinedDate}>
                        Joined {formatDate(new Date(user.createdAt).toISOString())}
                    </p>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Highest WPM</div>
                    <div className={styles.statValue}>{Math.round(maxWpm)}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Average WPM</div>
                    <div className={styles.statValue}>{Math.round(avgWpm)}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Average Accuracy</div>
                    <div className={styles.statValue}>{Math.round(avgAcc)}%</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Tests Started</div>
                    <div className={styles.statValue}>{totalTests}</div>
                </div>
            </div>

            {totalTests > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Performance History</h2>
                    <WpmChart data={testHistory.map(t => ({ id: t.id, wpm: t.wpm, raw_wpm: t.raw_wpm, accuracy: t.accuracy, created_at: t.created_at }))} />
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Recent Tests</h2>
                {totalTests === 0 ? (
                    <p className={styles.emptyState}>No tests recorded yet. Go practice!</p>
                ) : (
                    <div className={styles.tableRef}>
                        <table className={styles.historyTable}>
                            <thead>
                                <tr>
                                    <th>wpm</th>
                                    <th>raw</th>
                                    <th>acc</th>
                                    <th>mode</th>
                                    <th>date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testHistory.map((test) => (
                                    <tr key={test.id}>
                                        <td className={styles.tdWpm}>{Math.round(test.wpm)}</td>
                                        <td>{Math.round(test.raw_wpm)}</td>
                                        <td>{Math.round(test.accuracy)}%</td>
                                        <td className={styles.tdMode}>{test.mode}</td>
                                        <td className={styles.tdDate}>
                                            {formatDate(test.created_at)} {formatTime(test.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
