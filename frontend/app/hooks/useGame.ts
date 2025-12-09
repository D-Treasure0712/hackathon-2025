'use client';

/**
 * ゲームロジックを管理するカスタムフック
 * 盤面状態、駒の選択・移動、WebSocket通信を統合
 */

import { useState, useCallback, useEffect } from 'react';
import { BoardState, Piece, Position, PieceType, CapturedPieces, HandPieceType, EMPTY_CAPTURED_PIECES } from '../components/shogi/types';
import { INITIAL_BOARD_STATE, UNPROMOTION_MAP } from '../components/shogi/constants';
import { useWebSocket, ServerMessage } from './useWebSocket';

export interface GameState {
    board: BoardState;
    selectedPosition: Position | null;
    selectedHandPiece: HandPieceType | null;
    playerCaptured: CapturedPieces;
    aiCaptured: CapturedPieces;
    lastMove: { from: Position | null; to: Position } | null;
    isPlayerTurn: boolean;
    gameStatus: 'waiting' | 'playing' | 'game_over';
    result: 'player_win' | 'ai_win' | 'draw' | null;
    reason: string | null;
    moveHistory: string[];
}

export interface UseGameReturn {
    gameState: GameState;
    isConnected: boolean;
    error: string | null;
    selectSquare: (row: number, col: number) => void;
    selectHandPiece: (pieceType: HandPieceType) => void;
    startGame: () => void;
    resetGame: () => void;
}

// USI形式の座標変換
function positionToUSI(row: number, col: number): string {
    // col: 0-8 -> 9-1 (筋)
    // row: 0-8 -> a-i (段)
    const file = (9 - col).toString();
    const rank = String.fromCharCode('a'.charCodeAt(0) + row);
    return file + rank;
}

// USI形式から盤面座標に変換
function usiToPosition(usi: string): { row: number; col: number } | null {
    if (usi.length < 2) return null;

    const file = parseInt(usi[0]);
    const rank = usi[1];

    if (isNaN(file) || file < 1 || file > 9) return null;

    const col = 9 - file;
    const row = rank.charCodeAt(0) - 'a'.charCodeAt(0);

    if (row < 0 || row > 8) return null;

    return { row, col };
}

// PieceTypeからUSI駒文字に変換
function pieceTypeToUSI(type: PieceType): string {
    const map: Record<PieceType, string> = {
        king: 'k',
        rook: 'r',
        bishop: 'b',
        gold: 'g',
        silver: 's',
        knight: 'n',
        lance: 'l',
        pawn: 'p',
        dragon: '+r',
        horse: '+b',
        promotedSilver: '+s',
        promotedKnight: '+n',
        promotedLance: '+l',
        promotedPawn: '+p',
    };
    return map[type] || '';
}

// 成り判定が必要かどうか（簡易版：相手陣に入った場合）
function shouldPromote(fromRow: number, toRow: number, owner: 'sente' | 'gote'): boolean {
    if (owner === 'sente') {
        return toRow <= 2 || fromRow <= 2;
    } else {
        return toRow >= 6 || fromRow >= 6;
    }
}

// 強制成り判定
function mustPromote(pieceType: PieceType, toRow: number, owner: 'sente' | 'gote'): boolean {
    if (owner === 'sente') {
        if (pieceType === 'pawn' || pieceType === 'lance') return toRow === 0;
        if (pieceType === 'knight') return toRow <= 1;
    } else {
        if (pieceType === 'pawn' || pieceType === 'lance') return toRow === 8;
        if (pieceType === 'knight') return toRow >= 7;
    }
    return false;
}

// 成れる駒かどうか
function canPromote(pieceType: PieceType): boolean {
    return ['rook', 'bishop', 'silver', 'knight', 'lance', 'pawn'].includes(pieceType);
}

// 持ち駒タイプからUSI文字に変換（大文字）
function handPieceToUSI(pieceType: HandPieceType): string {
    const map: Record<HandPieceType, string> = {
        rook: 'R',
        bishop: 'B',
        gold: 'G',
        silver: 'S',
        knight: 'N',
        lance: 'L',
        pawn: 'P',
    };
    return map[pieceType];
}

// 成り駒から元の駒タイプを取得
function getBasePieceType(pieceType: PieceType): string | null {
    const promotedMap: Record<string, string> = {
        'dragon': 'rook',
        'horse': 'bishop',
        'promotedSilver': 'silver',
        'promotedKnight': 'knight',
        'promotedLance': 'lance',
        'promotedPawn': 'pawn',
    };
    return promotedMap[pieceType] || pieceType;
}

export function useGame(): UseGameReturn {
    const [gameState, setGameState] = useState<GameState>({
        board: INITIAL_BOARD_STATE,
        selectedPosition: null,
        selectedHandPiece: null,
        playerCaptured: { ...EMPTY_CAPTURED_PIECES },
        aiCaptured: { ...EMPTY_CAPTURED_PIECES },
        lastMove: null,
        isPlayerTurn: true,
        gameStatus: 'waiting',
        result: null,
        reason: null,
        moveHistory: [],
    });
    const [error, setError] = useState<string | null>(null);

    const handleMessage = useCallback((message: ServerMessage) => {
        console.log('Game received message:', message);

        switch (message.type) {
            case 'game_started':
                setGameState(prev => ({
                    ...prev,
                    gameStatus: 'playing',
                    isPlayerTurn: true,
                }));
                break;

            case 'ai_move':
                if (message.move) {
                    applyAIMove(message.move);
                }
                break;

            case 'game_over':
                setGameState(prev => ({
                    ...prev,
                    gameStatus: 'game_over',
                    result: message.result || null,
                    reason: message.reason || null,
                }));
                break;

            case 'error':
                setError(message.error || '不明なエラー');
                // 不正な手の場合は選択をリセット
                if (message.errorType === 'illegal_move') {
                    setGameState(prev => ({
                        ...prev,
                        selectedPosition: null,
                        isPlayerTurn: true,
                    }));
                }
                break;
        }
    }, []);

    const {
        isConnected,
        sendMove,
        connect,
        error: wsError,
    } = useWebSocket({
        onMessage: handleMessage,
    });

    // WebSocketエラーを反映
    useEffect(() => {
        if (wsError) {
            setError(wsError);
        }
    }, [wsError]);

    // AIの手を盤面に適用
    const applyAIMove = useCallback((moveStr: string) => {
        // USI形式: "7g7f" または "P*5e"（駒打ち）
        setGameState(prev => {
            const newBoard = prev.board.map(row => [...row]);
            let from: Position | null = null;
            let to: Position | null = null;
            let promotion = false;
            let newAiCaptured = { ...prev.aiCaptured };
            let newPlayerCaptured = { ...prev.playerCaptured };

            if (moveStr.includes('*')) {
                // 駒打ち: P*5e
                const pieceChar = moveStr[0].toUpperCase();
                const toUSI = moveStr.substring(2, 4);
                to = usiToPosition(toUSI);

                if (to) {
                    // USI文字から駒タイプに変換
                    const pieceTypeMap: Record<string, HandPieceType> = {
                        'P': 'pawn', 'L': 'lance', 'N': 'knight', 'S': 'silver',
                        'G': 'gold', 'B': 'bishop', 'R': 'rook',
                    };
                    const dropPieceType = pieceTypeMap[pieceChar];
                    if (dropPieceType) {
                        newBoard[to.row][to.col] = { type: dropPieceType, owner: 'gote' };
                        newAiCaptured[dropPieceType]--;
                    }
                }
            } else {
                // 通常の移動
                const fromUSI = moveStr.substring(0, 2);
                const toUSI = moveStr.substring(2, 4);
                promotion = moveStr.length > 4 && moveStr[4] === '+';

                from = usiToPosition(fromUSI);
                to = usiToPosition(toUSI);

                if (from && to) {
                    // プレイヤーの駒を取った場合
                    const targetPiece = newBoard[to.row][to.col];
                    if (targetPiece && targetPiece.owner === 'sente') {
                        const capturedType = getBasePieceType(targetPiece.type);
                        if (capturedType && capturedType !== 'king') {
                            newAiCaptured[capturedType as HandPieceType]++;
                        }
                    }

                    const piece = newBoard[from.row][from.col];
                    if (piece) {
                        newBoard[from.row][from.col] = null;

                        let movedPiece = { ...piece };
                        if (promotion && canPromote(piece.type)) {
                            // 成りの処理
                            const promotedType = getPromotedType(piece.type);
                            if (promotedType) {
                                movedPiece = { ...piece, type: promotedType };
                            }
                        }

                        newBoard[to.row][to.col] = movedPiece;
                    }
                }
            }

            return {
                ...prev,
                board: newBoard as BoardState,
                aiCaptured: newAiCaptured,
                playerCaptured: newPlayerCaptured,
                moveHistory: [...prev.moveHistory, moveStr],
                lastMove: to ? { from, to } : null,
                isPlayerTurn: true,
                selectedPosition: null,
                selectedHandPiece: null,
            };
        });

        // プレイヤーの玉が取られたかチェック（盤面に玉がなければAIの勝ち）
        setGameState(prev => {
            const hasPlayerKing = prev.board.some(row =>
                row.some(piece => piece && piece.owner === 'sente' && piece.type === 'king')
            );
            if (!hasPlayerKing) {
                return {
                    ...prev,
                    gameStatus: 'game_over',
                    result: 'ai_win',
                    reason: 'checkmate',
                };
            }
            return prev;
        });
    }, []);

    // 成り駒タイプを取得
    const getPromotedType = (type: PieceType): PieceType | null => {
        const map: Partial<Record<PieceType, PieceType>> = {
            rook: 'dragon',
            bishop: 'horse',
            silver: 'promotedSilver',
            knight: 'promotedKnight',
            lance: 'promotedLance',
            pawn: 'promotedPawn',
        };
        return map[type] || null;
    };

    // マス目をクリック
    const selectSquare = useCallback((row: number, col: number) => {
        if (gameState.gameStatus !== 'playing' || !gameState.isPlayerTurn) {
            return;
        }

        // ステート更新前に必要な情報を取得
        const currentBoard = gameState.board;
        const currentSelected = gameState.selectedPosition;
        const currentHandPiece = gameState.selectedHandPiece;
        const clickedPiece = currentBoard[row][col];

        // 持ち駒が選択されている場合 → 駒打ち
        if (currentHandPiece) {
            // 空マスにのみ打てる
            if (clickedPiece) {
                setError('駒がある場所には打てません');
                return;
            }

            // USI形式: P*5e (駒種*座標)
            const pieceUSI = handPieceToUSI(currentHandPiece);
            const toUSI = positionToUSI(row, col);
            const moveStr = pieceUSI + '*' + toUSI;

            // ローカルで盤面更新
            const newBoard = currentBoard.map(r => [...r]);
            newBoard[row][col] = { type: currentHandPiece, owner: 'sente' };

            // 持ち駒を減らす
            const newPlayerCaptured = { ...gameState.playerCaptured };
            newPlayerCaptured[currentHandPiece]--;

            // ステート更新
            setGameState(prev => ({
                ...prev,
                board: newBoard as BoardState,
                selectedPosition: null,
                selectedHandPiece: null,
                playerCaptured: newPlayerCaptured,
                lastMove: { from: null, to: { row, col } },
                isPlayerTurn: false,
                moveHistory: [...prev.moveHistory, moveStr],
            }));

            // WebSocketで送信
            sendMove(moveStr);
            setError(null);
            return;
        }

        // 未選択の状態で自分の駒をクリック → 選択
        if (!currentSelected) {
            if (clickedPiece && clickedPiece.owner === 'sente') {
                setGameState(prev => ({ ...prev, selectedPosition: { row, col }, selectedHandPiece: null }));
            }
            setError(null);
            return;
        }

        const { row: fromRow, col: fromCol } = currentSelected;
        const selectedPiece = currentBoard[fromRow][fromCol];

        // 同じマスをクリック → 選択解除
        if (fromRow === row && fromCol === col) {
            setGameState(prev => ({ ...prev, selectedPosition: null }));
            setError(null);
            return;
        }

        // 自分の駒を選択 → 選択変更
        if (clickedPiece && clickedPiece.owner === 'sente') {
            setGameState(prev => ({ ...prev, selectedPosition: { row, col }, selectedHandPiece: null }));
            setError(null);
            return;
        }

        // 移動を試みる
        if (selectedPiece && selectedPiece.owner === 'sente') {
            const fromUSI = positionToUSI(fromRow, fromCol);
            const toUSI = positionToUSI(row, col);

            // 成りの判定
            let moveStr = fromUSI + toUSI;
            const canDoPromotion = canPromote(selectedPiece.type) && shouldPromote(fromRow, row, 'sente');
            const mustDoPromotion = mustPromote(selectedPiece.type, row, 'sente');

            if (mustDoPromotion || (canDoPromotion && confirm('成りますか？'))) {
                moveStr += '+';
            }

            // ローカルで盤面更新
            const newBoard = currentBoard.map(r => [...r]);
            const piece = newBoard[fromRow][fromCol];

            // 相手の駒を取った場合、持ち駒に追加
            let newPlayerCaptured = { ...gameState.playerCaptured };
            if (clickedPiece && clickedPiece.owner === 'gote') {
                const capturedType = getBasePieceType(clickedPiece.type);
                if (capturedType && capturedType !== 'king') {
                    newPlayerCaptured[capturedType as HandPieceType]++;
                }
            }

            if (piece) {
                newBoard[fromRow][fromCol] = null;

                let movedPiece = { ...piece };
                if (moveStr.endsWith('+') && canPromote(piece.type)) {
                    const promotedType = getPromotedType(piece.type);
                    if (promotedType) {
                        movedPiece = { ...piece, type: promotedType };
                    }
                }

                newBoard[row][col] = movedPiece;
            }

            // ステート更新（sendMoveはコールバック外で実行）
            setGameState(prev => ({
                ...prev,
                board: newBoard as BoardState,
                selectedPosition: null,
                selectedHandPiece: null,
                playerCaptured: newPlayerCaptured,
                lastMove: { from: { row: fromRow, col: fromCol }, to: { row, col } },
                isPlayerTurn: false,
                moveHistory: [...prev.moveHistory, moveStr],
            }));

            // WebSocketで送信（setGameStateの外で実行）
            sendMove(moveStr);
        }

        setError(null);
    }, [gameState.gameStatus, gameState.isPlayerTurn, gameState.board, gameState.selectedPosition, gameState.selectedHandPiece, gameState.playerCaptured, sendMove]);

    const startGame = useCallback(() => {
        setGameState({
            board: INITIAL_BOARD_STATE,
            selectedPosition: null,
            selectedHandPiece: null,
            playerCaptured: { ...EMPTY_CAPTURED_PIECES },
            aiCaptured: { ...EMPTY_CAPTURED_PIECES },
            lastMove: null,
            isPlayerTurn: true,
            gameStatus: 'playing',
            result: null,
            reason: null,
            moveHistory: [],
        });
        setError(null);
        connect();
    }, [connect]);

    const resetGame = useCallback(() => {
        setGameState({
            board: INITIAL_BOARD_STATE,
            selectedPosition: null,
            selectedHandPiece: null,
            playerCaptured: { ...EMPTY_CAPTURED_PIECES },
            aiCaptured: { ...EMPTY_CAPTURED_PIECES },
            lastMove: null,
            isPlayerTurn: true,
            gameStatus: 'waiting',
            result: null,
            reason: null,
            moveHistory: [],
        });
        setError(null);
    }, []);

    // 持ち駒を選択
    const selectHandPiece = useCallback((pieceType: HandPieceType) => {
        if (gameState.gameStatus !== 'playing' || !gameState.isPlayerTurn) {
            return;
        }

        if (gameState.playerCaptured[pieceType] === 0) {
            return;
        }

        setGameState(prev => ({
            ...prev,
            selectedPosition: null,
            selectedHandPiece: prev.selectedHandPiece === pieceType ? null : pieceType,
        }));
        setError(null);
    }, [gameState.gameStatus, gameState.isPlayerTurn, gameState.playerCaptured]);

    return {
        gameState,
        isConnected,
        error,
        selectSquare,
        selectHandPiece,
        startGame,
        resetGame,
    };
}
