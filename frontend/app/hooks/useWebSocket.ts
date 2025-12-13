'use client';

/**
 * WebSocket通信を管理するカスタムフック
 * バックエンドの将棋AIと通信する
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// WebSocketメッセージの型定義
export interface ServerMessage {
    type: 'game_started' | 'ai_move' | 'game_over' | 'error';
    move?: string;
    result?: 'player_win' | 'ai_win' | 'draw';
    reason?: string;
    error?: string;
    errorType?: 'illegal_move' | 'engine_error' | 'invalid_request';
    gameId?: string;
}

export interface ClientMessage {
    type: 'move';
    move: string;
}

export interface UseWebSocketOptions {
    url?: string;
    gameId?: string;
    onMessage?: (message: ServerMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export interface UseWebSocketReturn {
    isConnected: boolean;
    sendMove: (move: string) => void;
    lastMessage: ServerMessage | null;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
}

export function useWebSocket({
    url = 'ws://localhost:8080/ws',
    gameId = 'default',
    onMessage,
    onConnect,
    onDisconnect,
}: UseWebSocketOptions = {}): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = `${url}?gameId=${gameId}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setError(null);
                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message: ServerMessage = JSON.parse(event.data);
                    console.log('Received message:', message);
                    setLastMessage(message);

                    if (message.type === 'error') {
                        setError(message.error || '不明なエラー');
                    }

                    onMessage?.(message);
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                onDisconnect?.();
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('接続エラーが発生しました');
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
            setError('WebSocketの作成に失敗しました');
        }
    }, [url, gameId, onMessage, onConnect, onDisconnect]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const sendMove = useCallback((move: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message: ClientMessage = { type: 'move', move };
            wsRef.current.send(JSON.stringify(message));
            console.log('Sent move:', move);
        } else {
            setError('接続されていません');
        }
    }, []);

    // クリーンアップ
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        sendMove,
        lastMessage,
        error,
        connect,
        disconnect,
    };
}
