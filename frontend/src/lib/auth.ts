/**
 * Authentication utilities
 */

import { User } from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function setAuth(token: string, user: User): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

export function getToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
}

export function getUser(): User | null {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
    }
    return null;
}

export function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;
    return !isTokenExpired();
}

export function isAdmin(): boolean {
    const user = getUser();
    return user?.role === 'admin';
}

export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

export function decodeToken(token: string): { sub: string; role: string; exp: number } | null {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

export function isTokenExpired(): boolean {
    const token = getToken();
    if (!token) return true;
    const decoded = decodeToken(token);
    if (!decoded) return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
}
