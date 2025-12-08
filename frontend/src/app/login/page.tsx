'use client';

/**
 * Login page for admin users
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { setAuth, decodeToken } from '@/lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            const { access_token } = await api.login({ email, password });

            // Decode token to get user info
            const decoded = decodeToken(access_token);
            if (decoded) {
                setAuth(access_token, {
                    id: parseInt(decoded.sub),
                    username: email.split('@')[0], // Temporary until we get full user
                    email,
                    role: decoded.role as 'admin' | 'user',
                    created_at: new Date().toISOString(),
                });
            }

            router.push('/forum');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 
                         bg-clip-text text-transparent">
                            QuerySync AI
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Sign in to your admin account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all duration-200"
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 
                            rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white 
                       font-medium rounded-lg shadow-md hover:shadow-lg
                       transform hover:-translate-y-0.5 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                            Register
                        </Link>
                    </p>

                    <Link
                        href="/forum"
                        className="mt-4 block text-center text-sm text-gray-500 dark:text-gray-400 hover:underline"
                    >
                        ← Back to Forum
                    </Link>
                </div>
            </div>
        </div>
    );
}
