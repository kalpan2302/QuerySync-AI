'use client';

/**
 * Analytics Dashboard for admin users
 */

import { useEffect, useState } from 'react';
import { Stats, api } from '@/lib/api';

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await api.getStats();
                setStats(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load stats');
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return null; // Hide if not admin or error
    }

    const statCards = [
        {
            label: 'Total Questions',
            value: stats.total,
            color: 'bg-gradient-to-br from-blue-500 to-blue-600',
            icon: '📊',
        },
        {
            label: 'Pending',
            value: stats.pending,
            color: 'bg-gradient-to-br from-amber-500 to-orange-500',
            icon: '⏳',
        },
        {
            label: 'Escalated',
            value: stats.escalated,
            color: 'bg-gradient-to-br from-red-500 to-rose-600',
            icon: '⚠️',
        },
        {
            label: 'Answered',
            value: stats.answered,
            color: 'bg-gradient-to-br from-green-500 to-emerald-600',
            icon: '✅',
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📈 Analytics Dashboard
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className={`${stat.color} rounded-xl p-4 text-white shadow-lg`}
                    >
                        <p className="text-2xl mb-1">{stat.icon}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm opacity-90">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Average time to answer:</span>{' '}
                    {stats.avg_time_to_answer_minutes > 0
                        ? `${stats.avg_time_to_answer_minutes.toFixed(1)} minutes`
                        : 'N/A'}
                </p>
            </div>
        </div>
    );
}
