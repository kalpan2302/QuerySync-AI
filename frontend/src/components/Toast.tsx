'use client';

/**
 * Toast Notification Component for urgent question alerts
 */

import { useEffect, useState } from 'react';

interface ToastNotification {
    id: string;
    type: 'urgent' | 'info' | 'success' | 'error';
    title: string;
    message: string;
    timestamp: Date;
}

// Global toast state (simple approach without context)
let toastListeners: ((toasts: ToastNotification[]) => void)[] = [];
let toasts: ToastNotification[] = [];

export function addToast(notification: Omit<ToastNotification, 'id' | 'timestamp'>) {
    const newToast: ToastNotification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
    };
    toasts = [newToast, ...toasts].slice(0, 5); // Keep max 5 toasts
    toastListeners.forEach(listener => listener([...toasts]));

    // Auto-remove after 10 seconds
    setTimeout(() => {
        removeToast(newToast.id);
    }, 10000);
}

export function removeToast(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener([...toasts]));
}

export default function ToastContainer() {
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);

    useEffect(() => {
        // Subscribe to toast updates
        toastListeners.push(setNotifications);
        return () => {
            toastListeners = toastListeners.filter(l => l !== setNotifications);
        };
    }, []);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
            {notifications.map((toast) => (
                <div
                    key={toast.id}
                    style={{
                        animation: 'slideInRight 0.3s ease-out',
                    }}
                    className={`
                        p-4 rounded-lg shadow-2xl border backdrop-blur-sm
                        transform transition-all duration-300 ease-out
                        ${toast.type === 'urgent'
                            ? 'bg-red-900 border-red-600 shadow-red-900/50'
                            : 'bg-gray-900 border-gray-700'
                        }
                    `}
                >
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        {toast.type === 'urgent' && (
                            <div className="flex-shrink-0 w-10 h-10 bg-red-700 
                                          rounded-full flex items-center justify-center">
                                <span className="text-xl animate-pulse">🚨</span>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm
                                ${toast.type === 'urgent'
                                    ? 'text-white'
                                    : 'text-white'
                                }
                            `}>
                                {toast.title}
                            </h4>
                            <p className={`text-sm mt-1
                                ${toast.type === 'urgent'
                                    ? 'text-red-200'
                                    : 'text-gray-300'
                                }
                            `}>
                                {toast.message}
                            </p>
                            <p className="text-xs text-red-300 mt-2">
                                {toast.timestamp.toLocaleTimeString()}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 
                                     dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
