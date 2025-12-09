/**
 * useJShogi フック
 * 将棋の対局を管理するカスタムフック
 * 
 * 機能:
 * - 対局状態の管理
 * - 駒の選択・移動（合法手チェック付き）
 * - 成り選択
 * - 勝敗判定（王/玉取得時）
 * - 投了確認
 */

'use client';

import { useState, useCallback } from 'react';

// =====================================
// 型定義
// =====================================

/** プレイヤー番号 */
export type PlayerNumber = 1 | 2;

/** 駒の種類 */
export type PieceType = 
  | 'oushou'    // 王将
  | 'gyokushou' // 玉将
  | 'hisha'     // 飛車
  | 'kakugyou'  // 角行
  | 'kinshou'   // 金将
  | 'ginshou'   // 銀将
  | 'keima'     // 桂馬
  | 'kyousha'   // 香車
  | 'fuhyou'    // 歩兵
  | 'ryuuou'    // 龍王（成飛）
  | 'ryuuma'    // 龍馬（成角）
  | 'narigin'   // 成銀
  | 'narikei'   // 成桂
  | 'narikyou'  // 成香
  | 'tokin';    // と金

/** 駒の情報 */
export interface Piece {
  id: number;
  player_number: PlayerNumber;
  type: PieceType;
}

/** マスの情報 */
export interface Square {
  id: string;
  x: number;
  y: number;
  piece: Piece | null;
}

/** 持ち駒 */
export interface Hand {
  player_number: PlayerNumber;
  pieces: Piece[];
}

/** ゲーム状態 */
export interface GameState {
  current_player_number: PlayerNumber;
  squares: Square[];
  hands: Hand[];
}

// =====================================
// 合法手判定
// =====================================

/**
 * 駒が指定位置に移動できるかをチェック
 * @param piece 動かす駒
 * @param fromX 移動元X座標
 * @param fromY 移動元Y座標
 * @param toX 移動先X座標
 * @param toY 移動先Y座標
 * @param squares 盤面全体（経路チェック用）
 */
function isValidMove(
  piece: Piece,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  squares: Square[]
): boolean {
  const dx = toX - fromX;
  const dy = toY - fromY;
  
  // 移動なしは無効
  if (dx === 0 && dy === 0) return false;
  
  // 方向の調整
  // player_number 1 (下側): 前進 = y座標が減少 (dy < 0)
  // player_number 2 (上側): 前進 = y座標が増加 (dy > 0)
  // adjustedDy < 0 が「前進」を意味するように調整
  const direction = piece.player_number === 1 ? 1 : -1;
  const adjustedDy = dy * direction;

  // 経路上に駒がないかチェック（飛び越えできる桂馬以外）
  const checkPath = (stepX: number, stepY: number): boolean => {
    let cx = fromX + stepX;
    let cy = fromY + stepY;
    while (cx !== toX || cy !== toY) {
      const blocking = squares.find(s => s.x === cx && s.y === cy);
      if (blocking?.piece) return false;
      cx += stepX;
      cy += stepY;
    }
    return true;
  };

  switch (piece.type) {
    // 王将・玉将：全方向1マス
    case 'oushou':
    case 'gyokushou':
      return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;

    // 飛車：縦横何マスでも
    case 'hisha':
      if (dx === 0 && dy !== 0) {
        return checkPath(0, dy > 0 ? 1 : -1);
      }
      if (dy === 0 && dx !== 0) {
        return checkPath(dx > 0 ? 1 : -1, 0);
      }
      return false;

    // 龍王：飛車 + 斜め1マス
    case 'ryuuou':
      if (dx === 0 && dy !== 0) {
        return checkPath(0, dy > 0 ? 1 : -1);
      }
      if (dy === 0 && dx !== 0) {
        return checkPath(dx > 0 ? 1 : -1, 0);
      }
      if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
        return true;
      }
      return false;

    // 角行：斜め何マスでも
    case 'kakugyou':
      if (Math.abs(dx) === Math.abs(dy) && dx !== 0) {
        return checkPath(dx > 0 ? 1 : -1, dy > 0 ? 1 : -1);
      }
      return false;

    // 龍馬：角行 + 縦横1マス
    case 'ryuuma':
      if (Math.abs(dx) === Math.abs(dy) && dx !== 0) {
        return checkPath(dx > 0 ? 1 : -1, dy > 0 ? 1 : -1);
      }
      if ((Math.abs(dx) === 1 && dy === 0) || (dx === 0 && Math.abs(dy) === 1)) {
        return true;
      }
      return false;

    // 金将・成銀・成桂・成香・と金：金将の動き
    case 'kinshou':
    case 'narigin':
    case 'narikei':
    case 'narikyou':
    case 'tokin':
      // 前、斜め前、左右、後ろ（1マス）
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        // 斜め後ろは不可
        if (Math.abs(dx) === 1 && adjustedDy === 1) return false;
        return true;
      }
      return false;

    // 銀将：前、斜め4方向（1マス）
    case 'ginshou':
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        // 真横、真後ろは不可
        if (dy === 0) return false;
        if (dx === 0 && adjustedDy === 1) return false;
        return true;
      }
      return false;

    // 桂馬：前方に2マス進んで左右に1マス
    case 'keima':
      if (Math.abs(dx) === 1 && adjustedDy === -2) {
        return true;
      }
      return false;

    // 香車：前方に何マスでも
    case 'kyousha':
      if (dx === 0 && adjustedDy < 0) {
        // player 1: 上へ (dy < 0 なので stepY = dy > 0 ? 1 : -1 = -1)
        // player 2: 下へ (dy > 0 なので stepY = dy > 0 ? 1 : -1 = 1)
        return checkPath(0, dy > 0 ? 1 : -1);
      }
      return false;

    // 歩兵：前に1マス
    case 'fuhyou':
      if (dx === 0 && adjustedDy === -1) {
        return true;
      }
      return false;

    default:
      return false;
  }
}

/**
 * 二歩チェック
 */
function isNifu(squares: Square[], toX: number, playerNumber: PlayerNumber): boolean {
  for (const sq of squares) {
    if (sq.x === toX && sq.piece && 
        sq.piece.type === 'fuhyou' && 
        sq.piece.player_number === playerNumber) {
      return true;
    }
  }
  return false;
}

// =====================================
// 初期盤面の生成
// =====================================

/**
 * 初期盤面を生成
 * @param isPlayerSente プレイヤーが先手かどうか（true: 先手=下側から開始, false: 後手=上側から開始）
 */
function createInitialGameState(isPlayerSente: boolean = true): GameState {
  const squares: Square[] = [];
  let pieceId = 1;

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const squareId = `${9 - x}${y + 1}`;
      let piece: Piece | null = null;

      // 後手陣（y: 0-2）= 上側
      if (y === 0) {
        const backRow: (PieceType | null)[] = ['kyousha', 'keima', 'ginshou', 'kinshou', 'oushou', 'kinshou', 'ginshou', 'keima', 'kyousha'];
        if (backRow[x]) {
          piece = { id: pieceId++, player_number: 2, type: backRow[x]! };
        }
      } else if (y === 1) {
        if (x === 1) piece = { id: pieceId++, player_number: 2, type: 'hisha' };
        if (x === 7) piece = { id: pieceId++, player_number: 2, type: 'kakugyou' };
      } else if (y === 2) {
        piece = { id: pieceId++, player_number: 2, type: 'fuhyou' };
      }

      // 先手陣（y: 6-8）= 下側
      if (y === 6) {
        piece = { id: pieceId++, player_number: 1, type: 'fuhyou' };
      } else if (y === 7) {
        if (x === 7) piece = { id: pieceId++, player_number: 1, type: 'hisha' };
        if (x === 1) piece = { id: pieceId++, player_number: 1, type: 'kakugyou' };
      } else if (y === 8) {
        const backRow: (PieceType | null)[] = ['kyousha', 'keima', 'ginshou', 'kinshou', 'gyokushou', 'kinshou', 'ginshou', 'keima', 'kyousha'];
        if (backRow[x]) {
          piece = { id: pieceId++, player_number: 1, type: backRow[x]! };
        }
      }

      squares.push({ id: squareId, x, y, piece });
    }
  }

  return {
    // プレイヤーが先手なら下側(1)から、後手なら上側(2)から開始
    current_player_number: isPlayerSente ? 1 : 2,
    squares,
    hands: [
      { player_number: 1, pieces: [] },
      { player_number: 2, pieces: [] },
    ],
  };
}

// =====================================
// フック本体
// =====================================

export interface UseJShogiOptions {
  playerNumber: PlayerNumber;
}

export interface UseJShogiReturn {
  squares: Square[];
  hands: Hand[];
  currentPlayer: PlayerNumber;
  winner: PlayerNumber | null;
  selectedSquareId: string | null;
  selectedHandPieceId: number | null;
  waitingForPromotion: boolean;
  waitingForResignConfirm: boolean;  // 投了確認待ち
  lastMoveToSquareId: string | null;
  onSquareClick: (squareId: string) => void;
  onHandPieceClick: (pieceId: number) => void;
  onPromotionSelect: (promote: boolean) => void;
  onResignRequest: () => void;        // 投了リクエスト（確認表示）
  onResignConfirm: (confirm: boolean) => void;  // 投了確認
  resetGame: () => void;
  playerNumber: PlayerNumber;
}

export function useJShogi(options: UseJShogiOptions): UseJShogiReturn {
  const { playerNumber } = options;
  
  // プレイヤーが先手(1)かどうかで初期状態を設定
  const isPlayerSente = playerNumber === 1;

  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(isPlayerSente));
  const [winner, setWinner] = useState<PlayerNumber | null>(null);
  
  const [selectedSquareId, setSelectedSquareId] = useState<string | null>(null);
  const [selectedHandPieceId, setSelectedHandPieceId] = useState<number | null>(null);
  const [waitingForPromotion, setWaitingForPromotion] = useState(false);
  const [waitingForResignConfirm, setWaitingForResignConfirm] = useState(false);
  const [lastMoveToSquareId, setLastMoveToSquareId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);

  const getSquare = useCallback((squareId: string): Square | undefined => {
    return gameState.squares.find(s => s.id === squareId);
  }, [gameState.squares]);

  // 成り判定
  const canPromote = useCallback((piece: Piece, fromY: number, toY: number): boolean => {
    const promotedTypes: PieceType[] = ['ryuuou', 'ryuuma', 'narigin', 'narikei', 'narikyou', 'tokin'];
    if (promotedTypes.includes(piece.type)) return false;
    if (piece.type === 'kinshou' || piece.type === 'oushou' || piece.type === 'gyokushou') return false;

    if (piece.player_number === 1) {
      return fromY <= 2 || toY <= 2;
    } else {
      return fromY >= 6 || toY >= 6;
    }
  }, []);

  // 王/玉を取ったか判定
  const checkKingCaptured = useCallback((capturedPiece: Piece | null): PlayerNumber | null => {
    if (!capturedPiece) return null;
    if (capturedPiece.type === 'oushou' || capturedPiece.type === 'gyokushou') {
      // 取られた側のプレイヤーが負け = 取った側が勝ち
      return capturedPiece.player_number === 1 ? 2 : 1;
    }
    return null;
  }, []);

  // 駒を移動
  const movePiece = useCallback((fromSquareId: string, toSquareId: string, promote: boolean = false) => {
    let capturedKingOwner: PlayerNumber | null = null;
    
    setGameState(prev => {
      const newSquares = [...prev.squares];
      const fromSquare = newSquares.find(s => s.id === fromSquareId);
      const toSquare = newSquares.find(s => s.id === toSquareId);

      if (!fromSquare || !toSquare || !fromSquare.piece) return prev;

      // 王/玉を取ったかチェック
      capturedKingOwner = checkKingCaptured(toSquare.piece);

      let movedPiece = { ...fromSquare.piece };
      
      if (promote) {
        const promotionMap: Partial<Record<PieceType, PieceType>> = {
          'hisha': 'ryuuou',
          'kakugyou': 'ryuuma',
          'ginshou': 'narigin',
          'keima': 'narikei',
          'kyousha': 'narikyou',
          'fuhyou': 'tokin',
        };
        if (promotionMap[movedPiece.type]) {
          movedPiece.type = promotionMap[movedPiece.type]!;
        }
      }

      const newHands = [...prev.hands];
      if (toSquare.piece) {
        const capturedPiece = { ...toSquare.piece };
        const unpromoteMap: Partial<Record<PieceType, PieceType>> = {
          'ryuuou': 'hisha',
          'ryuuma': 'kakugyou',
          'narigin': 'ginshou',
          'narikei': 'keima',
          'narikyou': 'kyousha',
          'tokin': 'fuhyou',
        };
        if (unpromoteMap[capturedPiece.type]) {
          capturedPiece.type = unpromoteMap[capturedPiece.type]!;
        }
        capturedPiece.player_number = prev.current_player_number;
        const handIndex = newHands.findIndex(h => h.player_number === prev.current_player_number);
        if (handIndex >= 0) {
          newHands[handIndex] = {
            ...newHands[handIndex],
            pieces: [...newHands[handIndex].pieces, capturedPiece],
          };
        }
      }

      const fromIndex = newSquares.findIndex(s => s.id === fromSquareId);
      const toIndex = newSquares.findIndex(s => s.id === toSquareId);
      newSquares[fromIndex] = { ...fromSquare, piece: null };
      newSquares[toIndex] = { ...toSquare, piece: movedPiece };

      return {
        ...prev,
        squares: newSquares,
        hands: newHands,
        current_player_number: prev.current_player_number === 1 ? 2 : 1,
      };
    });

    // 王/玉が取られたら勝敗確定
    if (capturedKingOwner !== null) {
      setWinner(capturedKingOwner);
    }

    setLastMoveToSquareId(toSquareId);
    setSelectedSquareId(null);
    setPendingMove(null);
  }, [checkKingCaptured]);

  // 持ち駒を打つ
  const dropPiece = useCallback((pieceId: number, toSquareId: string) => {
    setGameState(prev => {
      const hand = prev.hands.find(h => h.player_number === prev.current_player_number);
      const piece = hand?.pieces.find(p => p.id === pieceId);
      const toSquare = prev.squares.find(s => s.id === toSquareId);

      if (!piece || !toSquare || toSquare.piece) return prev;

      // 二歩チェック
      if (piece.type === 'fuhyou' && isNifu(prev.squares, toSquare.x, prev.current_player_number)) {
        return prev;
      }

      const newHands = prev.hands.map(h => {
        if (h.player_number === prev.current_player_number) {
          return {
            ...h,
            pieces: h.pieces.filter(p => p.id !== pieceId),
          };
        }
        return h;
      });

      const newSquares = prev.squares.map(s => {
        if (s.id === toSquareId) {
          return { ...s, piece: { ...piece } };
        }
        return s;
      });

      return {
        ...prev,
        squares: newSquares,
        hands: newHands,
        current_player_number: prev.current_player_number === 1 ? 2 : 1,
      };
    });

    setLastMoveToSquareId(toSquareId);
    setSelectedHandPieceId(null);
  }, []);

  // マスクリック処理
  const onSquareClick = useCallback((squareId: string) => {
    if (winner) return;
    if (waitingForPromotion) return;
    if (waitingForResignConfirm) return;

    const square = getSquare(squareId);
    if (!square) return;

    // 持ち駒が選択されている場合
    if (selectedHandPieceId !== null) {
      if (!square.piece) {
        dropPiece(selectedHandPieceId, squareId);
      } else {
        setSelectedHandPieceId(null);
      }
      return;
    }

    // 駒が選択されている場合
    if (selectedSquareId) {
      const fromSquare = getSquare(selectedSquareId);
      
      if (selectedSquareId === squareId) {
        setSelectedSquareId(null);
        return;
      }

      if (square.piece && square.piece.player_number === gameState.current_player_number) {
        setSelectedSquareId(squareId);
        return;
      }

      // 移動先をクリック → 合法手チェック
      if (fromSquare?.piece) {
        // 自分の駒がある場所には移動不可
        if (square.piece && square.piece.player_number === gameState.current_player_number) {
          return;
        }

        // 合法手チェック
        if (!isValidMove(fromSquare.piece, fromSquare.x, fromSquare.y, square.x, square.y, gameState.squares)) {
          // 不正な手 → 選択解除
          setSelectedSquareId(null);
          return;
        }

        // 成り判定
        if (canPromote(fromSquare.piece, fromSquare.y, square.y)) {
          const mustPromote = 
            (fromSquare.piece.type === 'fuhyou' || fromSquare.piece.type === 'kyousha') &&
            ((fromSquare.piece.player_number === 1 && square.y === 0) ||
             (fromSquare.piece.player_number === 2 && square.y === 8)) ||
            (fromSquare.piece.type === 'keima') &&
            ((fromSquare.piece.player_number === 1 && square.y <= 1) ||
             (fromSquare.piece.player_number === 2 && square.y >= 7));

          if (mustPromote) {
            movePiece(selectedSquareId, squareId, true);
          } else {
            setPendingMove({ from: selectedSquareId, to: squareId });
            setWaitingForPromotion(true);
          }
        } else {
          movePiece(selectedSquareId, squareId, false);
        }
      }
      return;
    }

    // 駒をクリック → 選択
    if (square.piece && square.piece.player_number === gameState.current_player_number) {
      setSelectedSquareId(squareId);
    }
  }, [winner, waitingForPromotion, waitingForResignConfirm, selectedSquareId, selectedHandPieceId, gameState.current_player_number, gameState.squares, getSquare, canPromote, movePiece, dropPiece]);

  // 持ち駒クリック処理
  const onHandPieceClick = useCallback((pieceId: number) => {
    if (winner) return;
    if (waitingForPromotion) return;
    if (waitingForResignConfirm) return;

    const hand = gameState.hands.find(h => h.player_number === gameState.current_player_number);
    const piece = hand?.pieces.find(p => p.id === pieceId);
    if (!piece) return;

    setSelectedSquareId(null);
    setSelectedHandPieceId(pieceId === selectedHandPieceId ? null : pieceId);
  }, [winner, waitingForPromotion, waitingForResignConfirm, gameState.hands, gameState.current_player_number, selectedHandPieceId]);

  // 成り選択処理
  const onPromotionSelect = useCallback((promote: boolean) => {
    if (pendingMove) {
      movePiece(pendingMove.from, pendingMove.to, promote);
    }
    setWaitingForPromotion(false);
    setPendingMove(null);
  }, [pendingMove, movePiece]);

  // 投了リクエスト（確認ダイアログ表示）
  const onResignRequest = useCallback(() => {
    setWaitingForResignConfirm(true);
  }, []);

  // 投了確認
  const onResignConfirm = useCallback((confirm: boolean) => {
    if (confirm) {
      setWinner(gameState.current_player_number === 1 ? 2 : 1);
    }
    setWaitingForResignConfirm(false);
  }, [gameState.current_player_number]);

  // ゲームリセット
  const resetGame = useCallback(() => {
    setGameState(createInitialGameState(isPlayerSente));
    setWinner(null);
    setSelectedSquareId(null);
    setSelectedHandPieceId(null);
    setWaitingForPromotion(false);
    setWaitingForResignConfirm(false);
    setLastMoveToSquareId(null);
    setPendingMove(null);
  }, [isPlayerSente]);

  return {
    squares: gameState.squares,
    hands: gameState.hands,
    currentPlayer: gameState.current_player_number,
    winner,
    selectedSquareId,
    selectedHandPieceId,
    waitingForPromotion,
    waitingForResignConfirm,
    lastMoveToSquareId,
    onSquareClick,
    onHandPieceClick,
    onPromotionSelect,
    onResignRequest,
    onResignConfirm,
    resetGame,
    playerNumber,
  };
}

export default useJShogi;
