'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
// shogi.js をインポート (環境に合わせて import 文は調整してください)
import { Shogi } from 'shogi.js';
import { Square, Piece, PieceKind, Hand, Color } from '../types';

// =====================================
// 型定義・定数
// =====================================

export interface UseJShogiOptions {
  playerColor: Color; // PlayerNumber(1|2) ではなく Color(0|1) を採用
  useAI?: boolean; // AI対局モードを有効化
  wsUrl?: string; // WebSocket URL（デフォルト: ws://localhost:8080/ws）
}

// WebSocketメッセージの型定義
interface ServerMessage {
  type: 'game_started' | 'ai_move' | 'game_over' | 'error';
  move?: string;
  isBookMove?: boolean; // 定石からの手かどうか
  result?: 'player_win' | 'ai_win' | 'draw';
  reason?: string;
  error?: string;
  errorType?: 'illegal_move' | 'engine_error' | 'invalid_request';
  gameId?: string;
}

interface ClientMessage {
  type: 'move';
  move: string;
}

// ゲーム終了結果の型
export interface GameResult {
  winner: 'player' | 'ai' | 'draw';
  reason: string;
}

export interface UseJShogiReturn {
  squares: Square[];
  hands: Hand[];
  currentPlayer: Color;
  winner: Color | null;
  selectedSquareId: string | null;
  selectedHandPieceId: string | null; // IDを文字列に変更（種類+インデックス等）
  waitingForPromotion: boolean;
  waitingForResignConfirm: boolean;
  showCheckWarning: boolean; // 王手警告ダイアログ表示用
  lastMoveToSquareId: string | null;
  onSquareClick: (squareId: string) => void;
  onHandPieceClick: (uniqueId: string) => void;
  onPromotionSelect: (promote: boolean) => void;
  onResignRequest: () => void;
  onResignConfirm: (confirm: boolean) => void;
  onCheckWarningClose: () => void; // 王手警告を閉じる
  resetGame: () => void;
  playerColor: Color;
  availableMoves: Set<string>; // 移動可能なマスのIDセット
  canUndo: boolean; // 待ったが可能かどうか
  onUndo: () => void; // 待った（一手戻す）
  // WebSocket関連
  isConnected: boolean;
  isAIThinking: boolean;
  lastMoveIsBook: boolean; // 最後のAIの手が定石からかどうか
  gameStatus: 'waiting' | 'connecting' | 'playing' | 'game_over';
  gameResult: GameResult | null;
  wsError: string | null;
  connect: () => void;
  disconnect: () => void;
}

// 待った用の履歴データ型
type MoveRecord =
  | { type: 'move'; fromX: number; fromY: number; toX: number; toY: number; promote: boolean; capturedKind?: PieceKind }
  | { type: 'drop'; toX: number; toY: number; kind: PieceKind };

// 座標変換ヘルパー
// UI: x(0=9筋, 8=1筋), y(0=1段, 8=9段)
// Lib: x(9..1), y(1..9) ※shogi.jsの実装によるが一般的な数値座標系を想定
const uiToLib = (x: number, y: number) => ({ x: 9 - x, y: y + 1 });
const libToUi = (x: number, y: number) => ({ x: 9 - x, y: y - 1 });

// =====================================
// USI変換ヘルパー
// =====================================

// squareId "76" → USI "7f" (筋+段をアルファベット変換)
function squareIdToUSI(squareId: string): string {
  const x = parseInt(squareId[0]); // 筋 (1-9)
  const y = parseInt(squareId[1]); // 段 (1-9)
  const rank = String.fromCharCode('a'.charCodeAt(0) + y - 1); // 1 -> 'a', 9 -> 'i'
  return `${x}${rank}`;
}

// USI "7f" → squareId "76"
function usiToSquareId(usi: string): string {
  if (usi.length < 2) return '';
  const x = usi[0]; // 筋
  const rank = usi[1]; // 段（アルファベット）
  const y = rank.charCodeAt(0) - 'a'.charCodeAt(0) + 1; // 'a' -> 1, 'i' -> 9
  return `${x}${y}`;
}

// PieceKind → USI駒文字（持ち駒打ち用、大文字）
function pieceKindToUSI(kind: PieceKind): string {
  const map: Record<PieceKind, string> = {
    FU: 'P', KY: 'L', KE: 'N', GI: 'S', KI: 'G', OU: 'K', HI: 'R', KA: 'B',
    TO: '+P', NY: '+L', NK: '+N', NG: '+S', RY: '+R', UM: '+B',
  };
  return map[kind] || '';
}

export function useJShogi(options: UseJShogiOptions): UseJShogiReturn {
  const { playerColor, useAI = false, wsUrl = 'ws://localhost:8080/ws' } = options;

  // shogi.js のインスタンスを保持
  const gameRef = useRef<any>(new Shogi()); // 型定義がない場合は any、ある場合は Shogi

  // 画面再描画用のバージョン管理（インスタンスの中身が変わったことをReactに通知）
  const [, setVersion] = useState(0);

  // UI状態
  const [selectedSquareId, setSelectedSquareId] = useState<string | null>(null);
  const [selectedHandPieceId, setSelectedHandPieceId] = useState<string | null>(null);
  const [waitingForPromotion, setWaitingForPromotion] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ fromX: number, fromY: number, toX: number, toY: number } | null>(null);
  const [waitingForResignConfirm, setWaitingForResignConfirm] = useState(false);
  const [showCheckWarning, setShowCheckWarning] = useState(false); // 王手警告
  const [winner, setWinner] = useState<Color | null>(null);
  const [lastMoveToSquareId, setLastMoveToSquareId] = useState<string | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Set<string>>(new Set());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]); // 待った用履歴

  // WebSocket状態
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lastMoveIsBook, setLastMoveIsBook] = useState(false); // 最後のAIの手が定石からか
  const [gameStatus, setGameStatus] = useState<'waiting' | 'connecting' | 'playing' | 'game_over'>('waiting');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    gameRef.current.initialize();
    setVersion(v => v + 1);
  }, []);

  // -------------------------------------------------------
  // WebSocket通信
  // -------------------------------------------------------

  const connect = useCallback(() => {
    if (!useAI) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setGameStatus('connecting');
    setWsError(null);

    try {
      const gameId = `game_${Date.now()}`;
      const ws = new WebSocket(`${wsUrl}?gameId=${gameId}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setWsError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          console.log('Received message:', message);
          handleServerMessage(message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        if (gameStatus !== 'game_over') {
          setGameStatus('waiting');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setWsError('接続エラーが発生しました');
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setWsError('WebSocketの作成に失敗しました');
      setGameStatus('waiting');
    }
  }, [useAI, wsUrl, gameStatus]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // サーバーメッセージの処理
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'game_started':
        setGameStatus('playing');
        setIsAIThinking(false);
        break;

      case 'ai_move':
        if (message.move) {
          applyAIMove(message.move);
          setLastMoveIsBook(message.isBookMove || false);
        }
        setIsAIThinking(false);
        break;

      case 'game_over':
        setGameStatus('game_over');
        setIsAIThinking(false);
        if (message.result) {
          let winnerResult: 'player' | 'ai' | 'draw';
          if (message.result === 'player_win') {
            winnerResult = 'player';
            setWinner(playerColor);
          } else if (message.result === 'ai_win') {
            winnerResult = 'ai';
            setWinner(playerColor === 0 ? 1 : 0);
          } else {
            winnerResult = 'draw';
          }
          setGameResult({
            winner: winnerResult,
            reason: message.reason || '',
          });
        }
        break;

      case 'error':
        setWsError(message.error || '不明なエラー');
        setIsAIThinking(false);
        // 不正な手の場合、プレイヤーの手番に戻す（ローカルでは既に適用済みなので戻す必要あり）
        if (message.errorType === 'illegal_move') {
          // 最後の手を取り消す
          undoLastMove();
        }
        break;
    }
  }, [playerColor]);

  // AIの手を盤面に適用
  const applyAIMove = useCallback((moveStr: string) => {
    console.log('Applying AI move:', moveStr);

    if (moveStr.includes('*')) {
      // 駒打ち: P*5e
      const pieceChar = moveStr[0].toUpperCase();
      const toUSI = moveStr.substring(2, 4);
      const toSquareId = usiToSquareId(toUSI);

      if (toSquareId) {
        const toX = parseInt(toSquareId[0]);
        const toY = parseInt(toSquareId[1]);

        // USI文字からPieceKindに変換
        const usiToPieceKind: Record<string, PieceKind> = {
          'P': 'FU', 'L': 'KY', 'N': 'KE', 'S': 'GI', 'G': 'KI', 'B': 'KA', 'R': 'HI',
        };
        const kind = usiToPieceKind[pieceChar];
        if (kind) {
          try {
            gameRef.current.drop(toX, toY, kind);
            setLastMoveToSquareId(`${toX}${toY}`);
            setVersion(v => v + 1);
          } catch (e) {
            console.error('AI drop error:', e);
          }
        }
      }
    } else {
      // 通常の移動
      const fromUSI = moveStr.substring(0, 2);
      const toUSI = moveStr.substring(2, 4);
      const promote = moveStr.length > 4 && moveStr[4] === '+';

      const fromSquareId = usiToSquareId(fromUSI);
      const toSquareId = usiToSquareId(toUSI);

      if (fromSquareId && toSquareId) {
        const fromX = parseInt(fromSquareId[0]);
        const fromY = parseInt(fromSquareId[1]);
        const toX = parseInt(toSquareId[0]);
        const toY = parseInt(toSquareId[1]);

        try {
          gameRef.current.move(fromX, fromY, toX, toY, promote);
          setLastMoveToSquareId(`${toX}${toY}`);
          setVersion(v => v + 1);
        } catch (e) {
          console.error('AI move error:', e);
        }
      }
    }
  }, []);

  // 最後の手を取り消す（エラー時用）
  const undoLastMove = useCallback(() => {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory[moveHistory.length - 1];

    try {
      if (lastMove.type === 'move') {
        gameRef.current.unmove(
          lastMove.fromX, lastMove.fromY,
          lastMove.toX, lastMove.toY,
          lastMove.promote,
          lastMove.capturedKind
        );
      } else {
        gameRef.current.undrop(lastMove.toX, lastMove.toY);
      }

      setMoveHistory(prev => prev.slice(0, -1));
      setLastMoveToSquareId(null);
      setVersion(v => v + 1);
    } catch (e) {
      console.error('Undo error:', e);
    }
  }, [moveHistory]);

  // WebSocketで手を送信
  const sendMove = useCallback((moveStr: string) => {
    if (!useAI) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setWsError('接続されていません');
      return;
    }

    const message: ClientMessage = { type: 'move', move: moveStr };
    wsRef.current.send(JSON.stringify(message));
    console.log('Sent move:', moveStr);
    setIsAIThinking(true);
    setWsError(null);
  }, [useAI]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // -------------------------------------------------------
  // 盤面データの生成 (shogi.js -> UI用Square配列)
  // -------------------------------------------------------
  const squares: Square[] = [];

  // shogi.jsのボード（通常 1-9 のインデックスを持つ2次元配列）を走査
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      // UI座標からライブラリ座標へ
      const lx = 9 - x;
      const ly = y + 1;

      // shogi.js の get(x, y) を想定。実装に合わせて調整
      const cell = gameRef.current.get(lx, ly);

      let piece: Piece | null = null;
      if (cell) {
        piece = {
          kind: cell.kind, // 'FU', 'HI' etc.
          color: cell.color // 0 or 1
        };
      }

      squares.push({
        id: `${lx}${ly}`, // IDは筋+段 (例: "76")
        x,
        y,
        piece
      });
    }
  }

  // -------------------------------------------------------
  // 持ち駒データの生成
  // -------------------------------------------------------
  const hands: Hand[] = [0, 1].map((c) => {
    const handPieces: Piece[] = [];
    // getHandsSummary() は { FU: 2, KI: 0 ... } のようなオブジェクトを返す
    const handCounts = gameRef.current.getHandsSummary(c);

    Object.keys(handCounts).forEach((kind) => {
      const count = handCounts[kind as keyof typeof handCounts];
      for (let i = 0; i < count; i++) {
        // 一意なIDとして "種類-index" を使用
        handPieces.push({ kind: kind as PieceKind, color: c as Color });
      }
    });

    return { color: c as Color, pieces: handPieces };
  });

  // -------------------------------------------------------
  // アクション
  // -------------------------------------------------------

  const movePiece = useCallback((fromX: number, fromY: number, toX: number, toY: number, promote: boolean) => {
    const currentTurn = gameRef.current.turn;
    // 移動先に駒があるかチェック（unmove用）
    const capturedPiece = gameRef.current.get(toX, toY);
    const capturedKind = capturedPiece ? capturedPiece.kind : undefined;

    try {
      // shogi.js の move メソッド
      gameRef.current.move(fromX, fromY, toX, toY, promote);

      // 移動後に自分の王が王手状態かチェック
      if (gameRef.current.isCheck(currentTurn)) {
        // 王手状態なので一手戻す
        gameRef.current.unmove(fromX, fromY, toX, toY, promote, capturedKind);
        setShowCheckWarning(true);
        setSelectedSquareId(null);
        setAvailableMoves(new Set()); // クリア
        setPendingMove(null);
        setWaitingForPromotion(false);
        return;
      }

      // 最終手情報の更新など
      setLastMoveToSquareId(`${toX}${toY}`);

      // 履歴に記録（待った用）
      setMoveHistory(prev => [...prev, {
        type: 'move',
        fromX, fromY, toX, toY, promote,
        capturedKind
      }]);

      setVersion(v => v + 1);

      // AI対局モードの場合、WebSocketで送信
      if (useAI && isConnected) {
        const fromUSI = squareIdToUSI(`${fromX}${fromY}`);
        const toUSI = squareIdToUSI(`${toX}${toY}`);
        const moveStr = fromUSI + toUSI + (promote ? '+' : '');
        sendMove(moveStr);
      }
    } catch (e) {
      console.error("Move error:", e);
    }

    setSelectedSquareId(null);
    setAvailableMoves(new Set()); // クリア
    setPendingMove(null);
    setWaitingForPromotion(false);
  }, [useAI, isConnected, sendMove]);

  const dropPiece = useCallback((kind: PieceKind, toX: number, toY: number) => {
    const currentTurn = gameRef.current.turn;

    try {
      gameRef.current.drop(toX, toY, kind);

      // 打った後に自分の王が王手状態かチェック（打ち歩詰めなど）
      if (gameRef.current.isCheck(currentTurn)) {
        // 王手状態なので打ちを戻す
        gameRef.current.undrop(toX, toY);
        setShowCheckWarning(true);
        setSelectedHandPieceId(null);
        setSelectedSquareId(null);
        setAvailableMoves(new Set()); // クリア
        return;
      }

      setLastMoveToSquareId(`${toX}${toY}`);

      // 履歴に記録（待った用）
      setMoveHistory(prev => [...prev, {
        type: 'drop',
        toX, toY, kind
      }]);

      setVersion(v => v + 1);

      // AI対局モードの場合、WebSocketで送信
      if (useAI && isConnected) {
        const pieceUSI = pieceKindToUSI(kind);
        const toUSI = squareIdToUSI(`${toX}${toY}`);
        const moveStr = pieceUSI + '*' + toUSI;
        sendMove(moveStr);
      }
    } catch (e) {
      console.error("Drop error:", e);
    }
    setSelectedHandPieceId(null);
    setSelectedSquareId(null);
    setAvailableMoves(new Set()); // クリア
  }, [useAI, isConnected, sendMove]);

  // マスクリック
  const onSquareClick = useCallback((squareId: string) => {
    if (winner !== null || waitingForPromotion || waitingForResignConfirm) return;

    // AI対局モードで、AI思考中またはゲーム終了時はクリック無効
    if (useAI && (isAIThinking || gameStatus === 'game_over')) return;
    // AI対局モードで、自分のターンでない場合もクリック無効
    if (useAI && gameRef.current.turn !== playerColor) return;

    // ID ("76") からライブラリ座標 (x=7, y=6) をパース
    const tx = parseInt(squareId[0]);
    const ty = parseInt(squareId[1]);

    // UI上の座標に変換（選択ロジック用）
    const targetSquare = squares.find(s => s.id === squareId);
    if (!targetSquare) return;

    const currentPlayer = gameRef.current.turn; // 0 or 1

    // 1. 持ち駒を選択中 -> 打つ
    if (selectedHandPieceId) {
      // "FU-0" のようなIDから種類を取得
      const kind = selectedHandPieceId.split('-')[0] as PieceKind;
      // shogi.js の drop はバリデーション込み
      // 空きマスかチェックなどはライブラリが例外を投げるかfalseを返す
      if (!targetSquare.piece) {
        // 二歩や打ち歩詰めはライブラリがチェックしてくれる前提
        // 事前に canDrop チェックができるならベスト
        dropPiece(kind, tx, ty);
      } else {
        setSelectedHandPieceId(null); // キャンセル
        setAvailableMoves(new Set()); // クリア
      }
      return;
    }

    // 2. 盤上の駒を選択中 -> 移動
    if (selectedSquareId) {
      const fromSq = squares.find(s => s.id === selectedSquareId);
      if (!fromSq) return;

      // 自分の駒を再クリック -> 選択解除
      if (selectedSquareId === squareId) {
        setSelectedSquareId(null);
        setAvailableMoves(new Set()); // クリア
        return;
      }
      // 自分の別の駒をクリック -> 選択変更
      if (targetSquare.piece && targetSquare.piece.color === currentPlayer) {
        setSelectedSquareId(squareId);

        // 移動可能範囲を計算してセット
        const fx = targetSquare.x;
        const fy = targetSquare.y;
        // UI座標 -> ライブラリ座標
        const libPos = uiToLib(fx, fy);
        const moves = gameRef.current.getMovesFrom(libPos.x, libPos.y);
        const newAvailableMoves = new Set<string>();
        moves.forEach((move: any) => {
          const uiPos = libToUi(move.to.x, move.to.y);
          // 盤内かつ自分の駒でない場所（shogi.jsのgetMovesFromは味方の駒への移動も含まないはずだが念のため）
          newAvailableMoves.add(`${9 - uiPos.x}${uiPos.y + 1}`); // ID形式: "76"
        });
        setAvailableMoves(newAvailableMoves);

        return;
      }

      // 移動実行 (fromX, fromY はライブラリ座標)
      const fx = parseInt(selectedSquareId[0]);
      const fy = parseInt(selectedSquareId[1]);

      // 移動生成してバリデーション (shogi.jsの moves を使う等)
      // ここでは簡易的に「成るかどうか」の判定のみ自前で行うか、
      // ライブラリの move をトライする

      // 成りゾーン判定 (1-3段目)
      const isPromotableZone = (y: number, color: number) => {
        return color === 0 ? y <= 3 : y >= 7; // ライブラリ座標系(1-9)で判定
      };

      const piece = fromSq.piece!;

      // 成り済みの駒かどうか判定
      const PROMOTED_KINDS: PieceKind[] = ['TO', 'NY', 'NK', 'NG', 'RY', 'UM'];
      const isAlreadyPromoted = PROMOTED_KINDS.includes(piece.kind);

      // 成れない駒（金、王）かどうか判定
      const CANNOT_PROMOTE_KINDS: PieceKind[] = ['KI', 'OU'];
      const cannotPromote = CANNOT_PROMOTE_KINDS.includes(piece.kind);

      // 移動可能かチェック - shogi.jsのgetMovesFromを使用
      const validMoves = gameRef.current.getMovesFrom(fx, fy);
      const isValidMove = validMoves.some((move: { to: { x: number, y: number } }) =>
        move.to.x === tx && move.to.y === ty
      );

      if (!isValidMove) {
        // 無効な手の場合は選択を解除
        setSelectedSquareId(null);
        setAvailableMoves(new Set()); // クリア
        return;
      }

      // 成り確認が必要なケース（成り済み・成れない駒は除外）
      const canPromote =
        !isAlreadyPromoted &&
        !cannotPromote &&
        (isPromotableZone(fy, currentPlayer) || isPromotableZone(ty, currentPlayer));

      if (canPromote) {
        setPendingMove({ fromX: fx, fromY: fy, toX: tx, toY: ty });
        setWaitingForPromotion(true);
      } else {
        // 成らない場合（shogi.jsが行き所のない駒は自動で成りにしてくれる）
        movePiece(fx, fy, tx, ty, false);
      }
      return;
    }

    // 3. 駒を選択
    if (targetSquare.piece && targetSquare.piece.color === currentPlayer) {
      setSelectedSquareId(squareId);

      // 移動可能範囲を計算してセット (2.と同じロジック)
      // TODO: selectedSquareIdセットの直後に計算したいが、state更新は非同期なのでここで計算
      const libPos = uiToLib(targetSquare.x, targetSquare.y);
      const moves = gameRef.current.getMovesFrom(libPos.x, libPos.y);
      const newAvailableMoves = new Set<string>();
      moves.forEach((move: any) => {
        const uiPos = libToUi(move.to.x, move.to.y);
        newAvailableMoves.add(`${9 - uiPos.x}${uiPos.y + 1}`);
      });
      setAvailableMoves(newAvailableMoves);
    }

  }, [squares, selectedSquareId, selectedHandPieceId, winner, waitingForPromotion, waitingForResignConfirm, movePiece, dropPiece, useAI, isAIThinking, gameStatus, playerColor]);

  // 持ち駒クリック
  const onHandPieceClick = useCallback((uniqueId: string) => {
    // uniqueId format: "KIND-index"
    const [kind, _] = uniqueId.split('-');
    const currentTurn = gameRef.current.turn;

    // AI対局モードで、AI思考中またはゲーム終了時はクリック無効
    if (useAI && (isAIThinking || gameStatus === 'game_over')) return;
    // AI対局モードで、自分のターンでない場合もクリック無効
    if (useAI && currentTurn !== playerColor) return;

    // 現在の手番のプレイヤーの持ち駒のみ選択可能
    // uniqueIdからcolorを判定するのではなく、CapturedPiecesコンポーネント側で
    // 既に手番チェックしているため、ここでは手番と持っているかのみチェック
    // → 実際にはCapturedPieces側でdisabledにしているので、ここでは手番をチェック
    // → 問題: CapturedPiecesはtargetPlayerとcurrentPlayerを比較してdisabledにしている
    //   が、このuseJShogi側ではplayerColor（固定値）と比較していた
    // → 修正: currentTurnプレイヤーの持ち駒であれば選択可能にする

    setSelectedSquareId(null);
    setAvailableMoves(new Set()); // 盤上選択解除のためにクリア

    // 持ち駒選択のロジック
    // 選択解除ならクリア、新規選択なら打てる場所を計算
    if (selectedHandPieceId === uniqueId) {
      setSelectedHandPieceId(null);
      setAvailableMoves(new Set());
    } else {
      setSelectedHandPieceId(uniqueId);

      // 打てる場所を計算
      // gameRef.current.getDropsBy(color) は移動可能な手のリスト [{to: {x,y}, kind, color}, ...] を返す
      const drops = gameRef.current.getDropsBy(currentTurn);
      const newAvailableMoves = new Set<string>();
      drops.forEach((drop: any) => {
        if (drop.kind === kind) {
          const uiPos = libToUi(drop.to.x, drop.to.y);
          newAvailableMoves.add(`${9 - uiPos.x}${uiPos.y + 1}`);
        }
      });
      setAvailableMoves(newAvailableMoves);
    }
  }, [selectedHandPieceId, useAI, isAIThinking, gameStatus, playerColor]);

  // 成り選択
  const onPromotionSelect = useCallback((promote: boolean) => {
    if (pendingMove) {
      movePiece(pendingMove.fromX, pendingMove.fromY, pendingMove.toX, pendingMove.toY, promote);
    }
    setWaitingForPromotion(false);
    setPendingMove(null);
  }, [pendingMove, movePiece]);

  // 投了
  const onResignRequest = useCallback(() => setWaitingForResignConfirm(true), []);
  const onResignConfirm = useCallback((confirm: boolean) => {
    if (confirm) {
      setWinner(gameRef.current.turn === 0 ? 1 : 0); // 相手の勝ち
      if (useAI) {
        setGameStatus('game_over');
        setGameResult({
          winner: 'ai',
          reason: 'resign',
        });
      }
    }
    setWaitingForResignConfirm(false);
  }, [useAI]);

  // 王手警告を閉じる
  const onCheckWarningClose = useCallback(() => {
    setShowCheckWarning(false);
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current.initialize();
    setVersion(v => v + 1);
    setWinner(null);
    setLastMoveToSquareId(null);
    setSelectedSquareId(null);
    setSelectedHandPieceId(null);
    setWaitingForPromotion(false);
    setWaitingForResignConfirm(false);
    setShowCheckWarning(false);
    setPendingMove(null);
    setAvailableMoves(new Set());
    setMoveHistory([]); // 履歴もクリア
    // WebSocket状態もリセット
    setGameStatus('waiting');
    setGameResult(null);
    setIsAIThinking(false);
    setWsError(null);
    // 接続中なら切断
    disconnect();
  }, [disconnect]);

  // 待った（一手戻す）
  const onUndo = useCallback(() => {
    // AI対局モードでは待った禁止
    if (useAI) return;
    if (moveHistory.length === 0 || winner !== null) return;

    const lastMove = moveHistory[moveHistory.length - 1];

    try {
      if (lastMove.type === 'move') {
        gameRef.current.unmove(
          lastMove.fromX, lastMove.fromY,
          lastMove.toX, lastMove.toY,
          lastMove.promote,
          lastMove.capturedKind
        );
      } else {
        // dropの場合
        gameRef.current.undrop(lastMove.toX, lastMove.toY);
      }

      // 履歴から削除
      setMoveHistory(prev => prev.slice(0, -1));
      setLastMoveToSquareId(null);
      setSelectedSquareId(null);
      setSelectedHandPieceId(null);
      setAvailableMoves(new Set());
      setVersion(v => v + 1);
    } catch (e) {
      console.error("Undo error:", e);
    }
  }, [moveHistory, winner, useAI]);

  const canUndo = !useAI && moveHistory.length > 0 && winner === null;

  return {
    squares,
    hands,
    currentPlayer: gameRef.current.turn as Color,
    winner,
    selectedSquareId,
    selectedHandPieceId,
    waitingForPromotion,
    waitingForResignConfirm,
    showCheckWarning,
    lastMoveToSquareId,
    onSquareClick,
    onHandPieceClick,
    onPromotionSelect,
    onResignRequest,
    onResignConfirm,
    onCheckWarningClose,
    resetGame,
    playerColor,
    availableMoves,
    canUndo,
    onUndo,
    // WebSocket関連
    isConnected,
    isAIThinking,
    lastMoveIsBook,
    gameStatus,
    gameResult,
    wsError,
    connect,
    disconnect,
  };
}