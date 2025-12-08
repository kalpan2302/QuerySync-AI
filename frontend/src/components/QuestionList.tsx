'use client';

/**
 * Question List component with real-time updates and filtering
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Question, api } from '@/lib/api';
import { wsClient } from '@/lib/ws';
import { isAdmin } from '@/lib/auth';
import { addToast } from './Toast';
import QuestionCard from './QuestionCard';

type FilterStatus = 'ALL' | 'ESCALATED' | 'PENDING' | 'ANSWERED';

const FILTER_OPTIONS: { value: FilterStatus; label: string; color: string }[] = [
    { value: 'ALL', label: 'All', color: 'bg-gray-500' },
    { value: 'ESCALATED', label: 'Escalated', color: 'bg-red-500' },
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'ANSWERED', label: 'Answered', color: 'bg-green-500' },
];

export default function QuestionList() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('ALL');

    // Sort questions: ESCALATED first, then by created_at (newest first)
    const sortQuestions = useCallback((list: Question[]): Question[] => {
        return [...list].sort((a, b) => {
            // Escalated first
            if (a.status === 'ESCALATED' && b.status !== 'ESCALATED') return -1;
            if (b.status === 'ESCALATED' && a.status !== 'ESCALATED') return 1;
            // Then by created_at (newest first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, []);

    // Filter questions based on selected status
    const filteredQuestions = useMemo(() => {
        if (filter === 'ALL') return questions;
        return questions.filter(q => q.status === filter);
    }, [questions, filter]);

    // Get counts for each status
    const statusCounts = useMemo(() => {
        return {
            ALL: questions.length,
            ESCALATED: questions.filter(q => q.status === 'ESCALATED').length,
            PENDING: questions.filter(q => q.status === 'PENDING').length,
            ANSWERED: questions.filter(q => q.status === 'ANSWERED').length,
        };
    }, [questions]);

    // Load initial questions
    const loadQuestions = useCallback(async () => {
        try {
            const data = await api.getQuestions();
            setQuestions(sortQuestions(data));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load questions');
        } finally {
            setIsLoading(false);
        }
    }, [sortQuestions]);

    useEffect(() => {
        loadQuestions();

        // Connect to WebSocket
        wsClient.connect();

        // Subscribe to events
        const unsubNewQuestion = wsClient.on('new_question', (data) => {
            const newQuestion = data as Question;
            setQuestions((prev) => sortQuestions([newQuestion, ...prev]));
        });

        const unsubStatusChange = wsClient.on('status_change', (data) => {
            const { question_id, status, escalated_at, answered_at } = data as {
                question_id: number;
                status: 'PENDING' | 'ESCALATED' | 'ANSWERED';
                escalated_at: string | null;
                answered_at: string | null;
            };
            setQuestions((prev) =>
                sortQuestions(
                    prev.map((q) =>
                        q.id === question_id
                            ? { ...q, status, escalated_at, answered_at }
                            : q
                    )
                )
            );
        });

        const unsubNewAnswer = wsClient.on('new_answer', (data) => {
            const { question_id } = data as { question_id: number };
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === question_id
                        ? { ...q, answers_count: (q.answers_count || 0) + 1 }
                        : q
                )
            );
        });

        // Handle urgent question notifications for admins
        const unsubUrgentQuestion = wsClient.on('urgent_question', (data) => {
            const { guest_name, message, question_id } = data as {
                question_id: number;
                guest_name: string;
                message: string;
                created_at: string;
            };

            // Only show popup to admins
            if (isAdmin()) {
                addToast({
                    type: 'urgent',
                    title: `🚨 Urgent Question from ${guest_name}`,
                    message: `"${message}" - Please resolve ASAP! (Question #${question_id})`,
                });
            }
        });

        // Cleanup
        return () => {
            unsubNewQuestion();
            unsubStatusChange();
            unsubNewAnswer();
            unsubUrgentQuestion();
            wsClient.disconnect();
        };
    }, [loadQuestions, sortQuestions]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 dark:text-red-400">{error}</p>
                <button
                    onClick={loadQuestions}
                    className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {FILTER_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setFilter(option.value)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                            flex items-center gap-2
                            ${filter === option.value
                                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                            }
                        `}
                    >
                        <span className={`w-2 h-2 rounded-full ${option.color}`}></span>
                        {option.label}
                        <span className={`
                            px-2 py-0.5 rounded-full text-xs
                            ${filter === option.value
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }
                        `}>
                            {statusCounts[option.value]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                    <p className="text-gray-500 dark:text-gray-400">
                        {filter === 'ALL'
                            ? 'No questions yet. Be the first to ask!'
                            : `No ${filter.toLowerCase()} questions found.`}
                    </p>
                    {filter !== 'ALL' && (
                        <button
                            onClick={() => setFilter('ALL')}
                            className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                            View all questions
                        </button>
                    )}
                </div>
            ) : (
                filteredQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                ))
            )}
        </div>
    );
}
