'use client';

/**
 * Answer List component showing replies to a question with rating and threading
 */

import { Answer } from '@/lib/api';
import AnswerCard from './AnswerCard';

interface AnswerListProps {
    answers: Answer[];
    questionId: number;
    onAnswerAdded?: (answer: Answer) => void;
}

export default function AnswerList({ answers, questionId, onAnswerAdded }: AnswerListProps) {
    // Filter to only show top-level answers (no parent_id)
    // AnswerCard component handles nested replies internally
    const topLevelAnswers = answers.filter(a => !a.parent_id);

    // Sort by score (highest first), then by date (newest first)
    const sortedAnswers = [...topLevelAnswers].sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    if (sortedAnswers.length === 0) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No answers yet. Be the first to reply!
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {/* Answer count and sort info */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {answers.length} Answer{answers.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                    Sorted by score
                </span>
            </div>

            {/* Top-level answers with nested replies */}
            {sortedAnswers.map((answer) => (
                <AnswerCard
                    key={answer.id}
                    answer={answer}
                    questionId={questionId}
                    onReplyAdded={onAnswerAdded}
                    depth={0}
                />
            ))}
        </div>
    );
}
