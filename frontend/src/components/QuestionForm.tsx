'use client';

/**
 * Question Form component using AJAX XMLHttpRequest (per requirements)
 */

import { useState } from 'react';
import { submitQuestionXHR } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

interface QuestionFormProps {
    onQuestionCreated?: () => void;
}

export default function QuestionForm({ onQuestionCreated }: QuestionFormProps) {
    const [message, setMessage] = useState('');
    const [guestName, setGuestName] = useState('');
    const [isEscalated, setIsEscalated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const isLoggedIn = isAuthenticated();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Frontend validation (non-blank)
        if (!message.trim()) {
            setError('Please enter your question');
            return;
        }

        if (!isLoggedIn && !guestName.trim()) {
            setError('Please enter your name');
            return;
        }

        setIsSubmitting(true);

        try {
            // Using AJAX XMLHttpRequest as per requirements
            await submitQuestionXHR(
                message,
                isLoggedIn ? undefined : guestName,
                isEscalated
            );

            setMessage('');
            setGuestName('');
            setIsEscalated(false);
            setSuccess(true);
            onQuestionCreated?.();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit question');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Ask a Question
            </h2>

            {!isLoggedIn && (
                <div className="mb-4">
                    <label
                        htmlFor="guestName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Your Name
                    </label>
                    <input
                        type="text"
                        id="guestName"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     transition-all duration-200"
                        placeholder="Enter your name"
                        maxLength={100}
                    />
                </div>
            )}

            <div className="mb-4">
                <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    Your Question
                </label>
                <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   transition-all duration-200 resize-none"
                    placeholder="Type your question here..."
                    maxLength={5000}
                />
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isEscalated}
                        onChange={(e) => setIsEscalated(e.target.checked)}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Mark as urgent (escalated)
                    </span>
                </label>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white 
                   font-medium rounded-lg shadow-md hover:shadow-lg
                   transform hover:-translate-y-0.5 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Question'}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 
                      rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 
                      rounded-lg text-green-600 dark:text-green-400 text-sm">
                    Question submitted successfully!
                </div>
            )}
        </form>
    );
}
