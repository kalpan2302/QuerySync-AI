/**
 * API client for QuerySync backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    // Get token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
}

/**
 * Submit question using AJAX XMLHttpRequest (as per requirements)
 */
export function submitQuestionXHR(
    message: string,
    guestName?: string,
    isEscalated?: boolean
): Promise<Question> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/api/v1/questions`);
        xhr.setRequestHeader('Content-Type', 'application/json');

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data);
                } catch {
                    reject(new Error('Failed to parse response'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.detail || 'Request failed'));
                } catch {
                    reject(new Error('Request failed'));
                }
            }
        };

        xhr.onerror = function () {
            reject(new Error('Network error'));
        };

        const body = JSON.stringify({
            message: message.trim(),
            guest_name: guestName || undefined,
            is_escalated: isEscalated || false,
        });

        xhr.send(body);
    });
}

// Types
export interface User {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'user';
    created_at: string;
}

export interface Question {
    id: number;
    user_id: number | null;
    guest_name: string | null;
    message: string;
    status: 'PENDING' | 'ESCALATED' | 'ANSWERED';
    created_at: string;
    updated_at: string;
    escalated_at: string | null;
    answered_at: string | null;
    answers_count: number;
}

export interface QuestionWithAnswers extends Question {
    answers: Answer[];
}

export interface Answer {
    id: number;
    question_id: number;
    user_id: number | null;
    guest_name: string | null;
    message: string;
    created_at: string;
}

export interface Stats {
    total: number;
    pending: number;
    escalated: number;
    answered: number;
    avg_time_to_answer_seconds: number;
    avg_time_to_answer_minutes: number;
}

// API functions
export const api = {
    // Auth - OTP
    sendOtp: (email: string) =>
        apiRequest<{ success: boolean; message: string }>('/api/v1/auth/send-otp', {
            method: 'POST',
            body: { email },
        }),

    verifyOtp: (email: string, otp: string) =>
        apiRequest<{ success: boolean; message: string }>('/api/v1/auth/verify-otp', {
            method: 'POST',
            body: { email, otp },
        }),

    // Auth
    register: (data: { username: string; email: string; password: string }) =>
        apiRequest<User>('/api/v1/auth/register', { method: 'POST', body: data }),

    login: (data: { email: string; password: string }) =>
        apiRequest<{ access_token: string; token_type: string }>('/api/v1/auth/login', {
            method: 'POST',
            body: data,
        }),

    // Questions
    getQuestions: (status?: string) =>
        apiRequest<Question[]>(`/api/v1/questions${status ? `?status=${status}` : ''}`),

    getQuestion: (id: number) =>
        apiRequest<QuestionWithAnswers>(`/api/v1/questions/${id}`),

    updateQuestionStatus: (id: number, status: string) =>
        apiRequest<Question>(`/api/v1/questions/${id}/status`, {
            method: 'PATCH',
            body: { status },
        }),

    suggestAnswer: (id: number) =>
        apiRequest<{ question_id: number; suggested_answer: string }>(
            `/api/v1/questions/${id}/suggest`,
            { method: 'POST' }
        ),

    // Answers
    createAnswer: (questionId: number, data: { message: string; guest_name?: string }) =>
        apiRequest<Answer>(`/api/v1/questions/${questionId}/answers`, {
            method: 'POST',
            body: data,
        }),

    // Admin
    getStats: () => apiRequest<Stats>('/api/v1/admin/stats'),
};
