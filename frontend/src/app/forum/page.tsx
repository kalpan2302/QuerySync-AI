'use client';

/**
 * Forum / Q&A Dashboard page
 */

import { useState } from 'react';
import Link from 'next/link';
import QuestionForm from '@/components/QuestionForm';
import QuestionList from '@/components/QuestionList';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { isAuthenticated, isAdmin, logout, getUser } from '@/lib/auth';

interface AuthState {
    isLoggedIn: boolean;
    userIsAdmin: boolean;
    username: string | null;
}

function getInitialAuthState(): AuthState {
    if (typeof window === 'undefined') {
        return { isLoggedIn: false, userIsAdmin: false, username: null };
    }
    const user = getUser();
    return {
        isLoggedIn: isAuthenticated(),
        userIsAdmin: isAdmin(),
        username: user?.username || null,
    };
}

export default function ForumPage() {
    // Use lazy initial state to avoid useEffect setState entirely
    const [authState, setAuthState] = useState<AuthState>(() => {
        // Only runs on client side
        if (typeof window === 'undefined') {
            return { isLoggedIn: false, userIsAdmin: false, username: null };
        }
        return getInitialAuthState();
    });

    const handleLogout = () => {
        logout();
        setAuthState({
            isLoggedIn: false,
            userIsAdmin: false,
            username: null,
        });
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                                QuerySync AI
                            </h1>
                            <p className="text-indigo-100 text-sm mt-1">
                                Real-time Q&A with AI-powered suggestions
                            </p>
                        </div>
                        <nav className="flex items-center gap-4">
                            {authState.isLoggedIn ? (
                                <>
                                    <span className="text-white/80 text-sm">
                                        Welcome, <strong>{authState.username}</strong>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-medium text-white 
                             bg-white/20 hover:bg-white/30 rounded-lg 
                             backdrop-blur transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 text-sm font-medium text-white 
                             bg-white/20 hover:bg-white/30 rounded-lg 
                             backdrop-blur transition-colors"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-4 py-2 text-sm font-medium text-indigo-600 
                             bg-white hover:bg-gray-100 rounded-lg 
                             shadow transition-colors"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Analytics Dashboard (Admin only) */}
                {authState.userIsAdmin && <AnalyticsDashboard />}

                {/* Question Form */}
                <QuestionForm />

                {/* Questions List */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Questions
                    </h2>
                    <QuestionList />
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>QuerySync AI © 2024 - Powered by FastAPI & Next.js</p>
                </div>
            </footer>
        </div>
    );
}
