/**
 * WebSocket client for real-time updates
 */

import { Question, Answer } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export type WebSocketEventType =
    | 'new_question'
    | 'new_answer'
    | 'status_change'
    | 'suggestion'
    | 'urgent_question';

export interface WebSocketMessage {
    type: WebSocketEventType;
    data: unknown;
}

export interface NewQuestionEvent {
    type: 'new_question';
    data: Question;
}

export interface NewAnswerEvent {
    type: 'new_answer';
    data: Answer;
}

export interface StatusChangeEvent {
    type: 'status_change';
    data: {
        question_id: number;
        status: 'PENDING' | 'ESCALATED' | 'ANSWERED';
        escalated_at: string | null;
        answered_at: string | null;
    };
}

export interface SuggestionEvent {
    type: 'suggestion';
    data: {
        question_id: number;
        suggested_answer: string;
    };
}

type EventCallback = (data: unknown) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private listeners: Map<WebSocketEventType, Set<EventCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    connect(): void {
        if (typeof window === 'undefined') return;
        if (this.ws?.readyState === WebSocket.OPEN) return;

        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    this.emit(message.type, message.data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Attempting to reconnect in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    on(event: WebSocketEventType, callback: EventCallback): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    private emit(event: WebSocketEventType, data: unknown): void {
        this.listeners.get(event)?.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in WebSocket event callback:', error);
            }
        });
    }
}

// Singleton instance
export const wsClient = new WebSocketClient();
