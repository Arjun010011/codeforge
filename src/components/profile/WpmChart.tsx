'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import styles from './WpmChart.module.css';

interface TestData {
    id: string;
    wpm: number;
    raw_wpm: number;
    accuracy: number;
    created_at: string;
}

export default function WpmChart({ data }: { data: TestData[] }) {
    if (!data || data.length === 0) return null;

    // Sort chronologically for the chart
    const chartData = [...data]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((d, index) => ({
            index: index + 1,
            wpm: Math.round(d.wpm),
            raw: Math.round(d.raw_wpm),
            acc: Math.round(d.accuracy),
            date: new Date(d.created_at).toLocaleDateString(),
        }));

    return (
        <div className={styles.container}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis
                        dataKey="index"
                        stroke="var(--sub-color)"
                        tick={{ fill: 'var(--sub-color)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="var(--sub-color)"
                        tick={{ fill: 'var(--sub-color)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="var(--sub-color)"
                        tick={{ fill: 'var(--sub-color)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-color)'
                        }}
                        itemStyle={{ color: 'var(--text-color)' }}
                        labelStyle={{ display: 'none' }}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="wpm"
                        stroke="var(--main-color)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-color)' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--main-color)' }}
                        isAnimationActive={false}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="raw"
                        stroke="var(--sub-color)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
