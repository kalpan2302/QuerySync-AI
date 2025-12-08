'use client';

/**
 * Question List component with real-time updates
 */

import { useEffect, useState, useCallback } from 'react';
import { Question, api } from '@/lib/api';
import { wsClient } from '@/lib/ws';
import { isAdmin } from '@/lib/auth';
import { addToast } from './Toast';
import QuestionCard from './QuestionCard';

export default function QuestionList() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (questions.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                <p className="text-gray-500 dark:text-gray-400">
                    No questions yet. Be the first to ask!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {questions.map((question) => (
                <QuestionCard key={question.id} question={question} />
            ))}
        </div>
    );
}
