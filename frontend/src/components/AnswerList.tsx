'use client';

/**
 * Answer List component showing replies to a question
 */

import { Answer } from '@/lib/api';

interface AnswerListProps {
    answers: Answer[];
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AnswerList({ answers }: AnswerListProps) {
    if (answers.length === 0) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No answers yet. Be the first to reply!
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {answers.map((answer) => (
                <div
                    key={answer.id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border-l-2 border-indigo-400"
                >
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                        {answer.message}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">
                            {answer.guest_name || 'Admin'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(answer.created_at)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
