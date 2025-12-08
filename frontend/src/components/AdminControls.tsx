'use client';

/**
 * Admin Controls for managing question status
 */

import { useState } from 'react';
import { api } from '@/lib/api';

interface AdminControlsProps {
    questionId: number;
    currentStatus: 'PENDING' | 'ESCALATED' | 'ANSWERED';
    onSuggestion?: (suggestion: string) => void;
}

export default function AdminControls({
    questionId,
    currentStatus,
    onSuggestion,
}: AdminControlsProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleStatusChange = async (newStatus: 'ESCALATED' | 'ANSWERED') => {
        setIsUpdating(true);
        try {
            await api.updateQuestionStatus(questionId, newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSuggest = async () => {
        setIsSuggesting(true);
        try {
            const result = await api.suggestAnswer(questionId);
            onSuggestion?.(result.suggested_answer);
        } catch (error) {
            console.error('Failed to get suggestion:', error);
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            {currentStatus !== 'ESCALATED' && (
                <button
                    onClick={() => handleStatusChange('ESCALATED')}
                    disabled={isUpdating}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400
                   bg-red-50 dark:bg-red-900/30 rounded-lg
                   hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUpdating ? '...' : '⚠️ Escalate'}
                </button>
            )}

            {currentStatus !== 'ANSWERED' && (
                <button
                    onClick={() => handleStatusChange('ANSWERED')}
                    disabled={isUpdating}
                    className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400
                   bg-green-50 dark:bg-green-900/30 rounded-lg
                   hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUpdating ? '...' : '✓ Mark Answered'}
                </button>
            )}

            <button
                onClick={handleSuggest}
                disabled={isSuggesting}
                className="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400
                 bg-purple-50 dark:bg-purple-900/30 rounded-lg
                 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSuggesting ? 'Generating...' : '✨ AI Suggest'}
            </button>
        </div>
    );
}
