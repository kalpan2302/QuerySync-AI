'use client';

/**
 * Answer Form component for replying to questions
 */

import { useState } from 'react';
import { api } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

interface AnswerFormProps {
    questionId: number;
    onAnswerCreated?: () => void;
}

export default function AnswerForm({ questionId, onAnswerCreated }: AnswerFormProps) {
    const [message, setMessage] = useState('');
    const [guestName, setGuestName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isLoggedIn = isAuthenticated();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!message.trim()) {
            setError('Please enter your answer');
            return;
        }

        if (!isLoggedIn && !guestName.trim()) {
            setError('Please enter your name');
            return;
        }

        setIsSubmitting(true);

        try {
            await api.createAnswer(questionId, {
                message: message.trim(),
                guest_name: isLoggedIn ? undefined : guestName,
            });

            setMessage('');
            setGuestName('');
            onAnswerCreated?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {!isLoggedIn && (
                <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 mb-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your name"
                    maxLength={100}
                />
            )}

            <div className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Write your answer..."
                    maxLength={5000}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg
                   hover:bg-indigo-600 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? '...' : 'Reply'}
                </button>
            </div>

            {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
        </form>
    );
}
