'use client';

/**
 * Question Card component displaying individual questions
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Question, Answer, api } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import StatusBadge from './StatusBadge';
import AnswerList from './AnswerList';
import AnswerForm from './AnswerForm';
import AdminControls from './AdminControls';

interface QuestionCardProps {
    question: Question;
    answers?: Answer[];
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function QuestionCard({ question, answers: initialAnswers }: QuestionCardProps) {
    const [showAnswers, setShowAnswers] = useState(false);
    const [answers, setAnswers] = useState<Answer[]>(initialAnswers || []);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const userIsAdmin = isAdmin();

    const loadAnswers = async () => {
        if (answers.length > 0 || isLoading) return;

        setIsLoading(true);
        try {
            const data = await api.getQuestion(question.id);
            setAnswers(data.answers);
        } catch (error) {
            console.error('Failed to load answers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAnswers = () => {
        if (!showAnswers) {
            loadAnswers();
        }
        setShowAnswers(!showAnswers);
    };

    const handleSuggestion = (text: string) => {
        setSuggestion(text);
        setShowAnswers(true);
    };

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden
                transition-all duration-300 hover:shadow-lg
                ${question.status === 'ESCALATED' ? 'border-l-4 border-red-500' : ''}
                ${question.status === 'ANSWERED' ? 'border-l-4 border-green-500' : ''}`}
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {question.guest_name || 'Admin'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(question.created_at)}</span>
                    </div>
                    <StatusBadge status={question.status} />
                </div>

                {/* Message */}
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {question.message}
                </p>

                {/* AI Suggestion */}
                {suggestion && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                            ✨ AI Suggested Answer:
                        </p>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                            <ReactMarkdown>{suggestion}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={handleToggleAnswers}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {showAnswers ? 'Hide' : 'Show'} Answers ({question.answers_count || answers.length})
                    </button>
                </div>

                {/* Admin Controls */}
                {userIsAdmin && (
                    <AdminControls
                        questionId={question.id}
                        currentStatus={question.status}
                        onSuggestion={handleSuggestion}
                    />
                )}

                {/* Answers Section */}
                {showAnswers && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Loading answers...</p>
                        ) : (
                            <>
                                <AnswerList answers={answers} questionId={question.id} />
                                <AnswerForm
                                    questionId={question.id}
                                    onAnswerCreated={() => loadAnswers()}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
