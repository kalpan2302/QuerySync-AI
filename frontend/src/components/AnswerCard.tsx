'use client';

/**
 * Answer Card component with rating and reply functionality
 * Rating is admin-only, replies can be collapsed
 */

import { useState } from 'react';
import { Answer, api } from '@/lib/api';
import { isAuthenticated, isAdmin } from '@/lib/auth';

interface AnswerCardProps {
    answer: Answer;
    questionId: number;
    onReplyAdded?: (answer: Answer) => void;
    depth?: number;
}

export default function AnswerCard({ answer, questionId, onReplyAdded, depth = 0 }: AnswerCardProps) {
    const [upvotes, setUpvotes] = useState(answer.upvotes);
    const [downvotes, setDownvotes] = useState(answer.downvotes);
    const [isRating, setIsRating] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [guestName, setGuestName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replies, setReplies] = useState<Answer[]>(answer.replies || []);
    const [showReplies, setShowReplies] = useState(true); // Toggle for hiding/showing replies

    const score = upvotes - downvotes;
    const maxDepth = 3; // Limit nesting depth
    const userIsAdmin = isAdmin(); // Check if current user is admin

    const handleRate = async (vote: 'up' | 'down') => {
        if (isRating || !userIsAdmin) return; // Only admins can rate
        setIsRating(true);

        try {
            const result = await api.rateAnswer(questionId, answer.id, vote);
            setUpvotes(result.upvotes);
            setDownvotes(result.downvotes);
        } catch (error) {
            console.error('Failed to rate answer:', error);
        } finally {
            setIsRating(false);
        }
    };

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newReply = await api.createAnswer(questionId, {
                message: replyMessage.trim(),
                guest_name: !isAuthenticated() ? guestName || undefined : undefined,
                parent_id: answer.id,
            });
            setReplies([...replies, newReply]);
            setReplyMessage('');
            setShowReplyForm(false);
            setShowReplies(true); // Show replies after adding new one
            onReplyAdded?.(newReply);
        } catch (error) {
            console.error('Failed to submit reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex gap-3">
                    {/* Rating Column - Only visible/interactive for admins */}
                    <div className="flex flex-col items-center gap-1 min-w-[50px]">
                        {userIsAdmin ? (
                            <>
                                <button
                                    onClick={() => handleRate('up')}
                                    disabled={isRating}
                                    className={`p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 
                                             transition-colors ${isRating ? 'opacity-50' : ''}`}
                                    title="Upvote (Admin only)"
                                >
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                <span className={`text-sm font-bold ${score > 0 ? 'text-green-600 dark:text-green-400' :
                                        score < 0 ? 'text-red-600 dark:text-red-400' :
                                            'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {score}
                                </span>
                                <button
                                    onClick={() => handleRate('down')}
                                    disabled={isRating}
                                    className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 
                                             transition-colors ${isRating ? 'opacity-50' : ''}`}
                                    title="Downvote (Admin only)"
                                >
                                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            /* Non-admin view: just show score without buttons */
                            <div className="flex flex-col items-center">
                                <span className={`text-sm font-bold ${score > 0 ? 'text-green-600 dark:text-green-400' :
                                        score < 0 ? 'text-red-600 dark:text-red-400' :
                                            'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {score > 0 ? '+' : ''}{score}
                                </span>
                                <span className="text-xs text-gray-400">score</span>
                            </div>
                        )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {answer.user_id ? '👤 Admin' : answer.guest_name || 'Anonymous'}
                            </span>
                            <span>•</span>
                            <span>{formatTime(answer.created_at)}</span>
                            {score >= 5 && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 
                                              text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                                    ⭐ Best Answer
                                </span>
                            )}
                        </div>

                        {/* Message */}
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {answer.message}
                        </p>

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-4">
                            {depth < maxDepth && (
                                <button
                                    onClick={() => setShowReplyForm(!showReplyForm)}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    💬 Reply
                                </button>
                            )}

                            {/* Show/Hide Replies Toggle */}
                            {replies.length > 0 && (
                                <button
                                    onClick={() => setShowReplies(!showReplies)}
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    {showReplies ? '👁️ Hide' : '👁️ Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                </button>
                            )}

                            <span className="text-xs text-gray-400">
                                {upvotes} 👍 • {downvotes} 👎
                            </span>
                        </div>

                        {/* Reply Form */}
                        {showReplyForm && (
                            <form onSubmit={handleSubmitReply} className="mt-4 space-y-3">
                                {!isAuthenticated() && (
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Your name (optional)"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                                                 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                )}
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Write your reply..."
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                             resize-none"
                                    required
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !replyMessage.trim()}
                                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg 
                                                 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowReplyForm(false)}
                                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Nested Replies - Collapsible */}
            {replies.length > 0 && showReplies && (
                <div className="mt-2 space-y-2">
                    {replies.map((reply) => (
                        <AnswerCard
                            key={reply.id}
                            answer={reply}
                            questionId={questionId}
                            onReplyAdded={onReplyAdded}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
