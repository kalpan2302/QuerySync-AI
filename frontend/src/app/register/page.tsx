'use client';

/**
 * Register page for admin sign-up with OTP verification
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Step = 'email' | 'otp' | 'register';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');

    // Form fields
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI state
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Please enter your email');
            return;
        }

        setIsLoading(true);
        try {
            await api.sendOtp(email);
            setSuccess('OTP sent! Check your email inbox.');
            setStep('otp');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!otp || otp.length !== 4) {
            setError('Please enter the 4-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            await api.verifyOtp(email, otp);
            setSuccess('Email verified! Complete your registration.');
            setStep('register');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Complete Registration
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await api.register({ username, email, password });
            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setError('');
        setIsLoading(true);
        try {
            await api.sendOtp(email);
            setSuccess('New OTP sent! Check your email.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP');
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
                            {step === 'email' && 'Enter your email to get started'}
                            {step === 'otp' && 'Verify your email'}
                            {step === 'register' && 'Complete your registration'}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                ${step === 'email' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'}`}>
                                {step === 'email' ? '1' : '✓'}
                            </div>
                            <div className={`w-12 h-1 ${step !== 'email' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                ${step === 'otp' ? 'bg-indigo-600 text-white' :
                                    step === 'register' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                {step === 'register' ? '✓' : '2'}
                            </div>
                            <div className={`w-12 h-1 ${step === 'register' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                ${step === 'register' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                3
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Email */}
                    {step === 'email' && (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="admin@example.com"
                                    required
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
                                {isLoading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    We sent a 4-digit code to<br />
                                    <span className="font-medium text-indigo-600">{email}</span>
                                </p>
                            </div>

                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-full px-4 py-4 text-center text-2xl tracking-widest border border-gray-300 
                                     dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                                     text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 
                                     focus:border-transparent transition-all duration-200"
                                    placeholder="0000"
                                    maxLength={4}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 
                                rounded-lg text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 
                                rounded-lg text-green-600 dark:text-green-400 text-sm">
                                    {success}
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
                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <div className="flex justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ← Change email
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isLoading}
                                    className="text-indigo-600 hover:underline disabled:opacity-50"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Registration Form */}
                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="text-center mb-4">
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    ✓ Email verified: {email}
                                </p>
                            </div>

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="johndoe"
                                    minLength={3}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                    minLength={6}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                    required
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
                                {isLoading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>

                    <Link href="/forum" className="mt-4 block text-center text-sm text-gray-500 dark:text-gray-400 hover:underline">
                        ← Back to Forum
                    </Link>
                </div>
            </div>
        </div>
    );
}
