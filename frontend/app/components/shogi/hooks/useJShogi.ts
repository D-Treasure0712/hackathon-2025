'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
// shogi.js をインポート (環境に合わせて import 文は調整してください)
import { Shogi } from 'shogi.js';
import { Square, Piece, PieceKind, Hand, Color, MoveAnimationState } from '../types';

// =====================================
// 型定義・定数
// =====================================

export interface UseJShogiOptions {
  playerColor: Color; // PlayerNumber(1|2) ではなく Color(0|1) を採用
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
  onHandPieceClick: (uniqueId: string, position?: { x: number, y: number }) => void;
  onPromotionSelect: (promote: boolean) => void;
  onResignRequest: () => void;
  onResignConfirm: (confirm: boolean) => void;
  onCheckWarningClose: () => void; // 王手警告を閉じる
  resetGame: () => void;
  playerColor: Color;
  availableMoves: Set<string>; // 移動可能なマスのIDセット
  canUndo: boolean; // 待ったが可能かどうか
  onUndo: () => void; // 待った（一手戻す）
  // アニメーション関連
  moveAnimation: MoveAnimationState | null;
  flyingPiece: { kind: PieceKind; color: Color; position: { x: number; y: number } } | null;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  onFlyingComplete: () => void;
  // 成り演出関連
  promotionAnimation: {
    pieceKind: PieceKind;
    color: Color;
    squareId: string;
  } | null;
  onPromotionAnimationComplete: () => void;
  // 王手カットイン関連
  showCheckCutIn: boolean;
  checkAttacker: Color;
  onCheckCutInComplete: () => void;
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

export function useJShogi(options: UseJShogiOptions): UseJShogiReturn {
  const { playerColor } = options;

  // shogi.js のインスタンスを保持
  const gameRef = useRef<any>(new Shogi()); // 型定義がない場合は any、ある場合は Shogi

  // 画面再描画用のバージョン管理（インスタンスの中身が変わったことをReactに通知）
  const [, setVersion] = useState(0);

  // UI状態
  const [selectedSquareId, setSelectedSquareId] = useState<string | null>(null);
  const [selectedHandPieceId, setSelectedHandPieceId] = useState<string | null>(null);
  const [selectedHandPiecePosition, setSelectedHandPiecePosition] = useState<{ x: number, y: number } | null>(null);
  const [waitingForPromotion, setWaitingForPromotion] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ fromX: number, fromY: number, toX: number, toY: number } | null>(null);
  const [waitingForResignConfirm, setWaitingForResignConfirm] = useState(false);
  const [showCheckWarning, setShowCheckWarning] = useState(false); // 王手警告
  const [winner, setWinner] = useState<Color | null>(null);
  const [lastMoveToSquareId, setLastMoveToSquareId] = useState<string | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Set<string>>(new Set());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]); // 待った用履歴

  // =====================================
  // アニメーション状態
  // =====================================
  const [moveAnimation, setMoveAnimation] = useState<MoveAnimationState | null>(null);
  const [flyingPiece, setFlyingPiece] = useState<{ kind: PieceKind; color: Color; position: { x: number; y: number } } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  // アニメーション中の盤面更新を遅延実行するための保留情報
  const pendingBoardUpdateRef = useRef<(() => void) | null>(null);

  // 成り演出状態
  const [promotionAnimation, setPromotionAnimation] = useState<{
    pieceKind: PieceKind;
    color: Color;
    squareId: string;
  } | null>(null);

  // 王手カットイン状態
  const [showCheckCutIn, setShowCheckCutIn] = useState(false);
  const [checkAttacker, setCheckAttacker] = useState<Color>(0);

  // 初期化
  useEffect(() => {
    gameRef.current.initialize();
    setVersion(v => v + 1);
  }, []);

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

  // =====================================
  // 駒移動実行（アニメーション対応）
  // =====================================
  const movePiece = useCallback((fromX: number, fromY: number, toX: number, toY: number, promote: boolean) => {
    const currentTurn = gameRef.current.turn;

    // 移動元の駒を取得
    const movingPiece = gameRef.current.get(fromX, fromY);
    if (!movingPiece) return;

    // 移動先に駒があるかチェック（駒を取るかどうか）
    const capturedPiece = gameRef.current.get(toX, toY);
    const capturedKind = capturedPiece ? capturedPiece.kind : undefined;
    const isCapture = !!capturedPiece;

    // まず移動が有効か事前チェック（王手状態にならないか）
    try {
      gameRef.current.move(fromX, fromY, toX, toY, promote);
      if (gameRef.current.isCheck(currentTurn)) {
        // 無効な手なので戻す
        gameRef.current.unmove(fromX, fromY, toX, toY, promote, capturedKind);
        setShowCheckWarning(true);
        setSelectedSquareId(null);
        setAvailableMoves(new Set());
        setPendingMove(null);
        setWaitingForPromotion(false);
        return;
      }
      // 有効な手なので一旦戻す（アニメーション後に再度実行）
      gameRef.current.unmove(fromX, fromY, toX, toY, promote, capturedKind);
    } catch (e) {
      console.error("Move validation error:", e);
      return;
    }

    // =====================================
    // アニメーション開始
    // =====================================
    setIsAnimating(true);
    setSelectedSquareId(null);
    setAvailableMoves(new Set());
    setPendingMove(null);
    setWaitingForPromotion(false);

    // 弾き飛ばされる駒の情報をセット（駒を取る場合）
    if (isCapture && capturedPiece) {
      // 位置はGameBoard側で計算するためここではsquareIdのみ
      // 実際の位置計算はGameBoardのgetSquarePositionで行う
      setFlyingPiece({
        kind: capturedPiece.kind as PieceKind,
        color: capturedPiece.color as Color,
        // 位置は一旦ダミー（GameBoard側で上書きされる）
        position: { x: 0, y: 0 }
      });
    }

    // 移動アニメーション状態をセット
    setMoveAnimation({
      pieceKind: movingPiece.kind as PieceKind,
      pieceColor: movingPiece.color as Color,
      fromSquareId: `${fromX}${fromY}`,
      toSquareId: `${toX}${toY}`,
      // 位置は一旦ダミー（GameBoard側で上書きされる）
      fromPosition: { x: 0, y: 0 },
      toPosition: { x: 0, y: 0 },
      isCapture,
      capturedPiece: capturedPiece ? {
        kind: capturedPiece.kind as PieceKind,
        color: capturedPiece.color as Color
      } : undefined,
      phase: 'lifting',
      isDrop: false
    });

    // アニメーション完了時に実行する盤面更新を予約
    pendingBoardUpdateRef.current = () => {
      try {
        // 実際に盤面を更新
        gameRef.current.move(fromX, fromY, toX, toY, promote);
        setLastMoveToSquareId(`${toX}${toY}`);

        // 履歴に記録（待った用）
        setMoveHistory(prev => [...prev, {
          type: 'move',
          fromX, fromY, toX, toY, promote,
          capturedKind
        }]);

        setVersion(v => v + 1);
      } catch (e) {
        console.error("Move execution error:", e);
      }
    };
  }, []);

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
      
      // ドロップ成功時にアニメーション開始
      if (selectedHandPiecePosition) {
        setIsAnimating(true);
        
        // ドロップアニメーション状態をセット
        setMoveAnimation({
          pieceKind: kind,
          pieceColor: currentTurn, // 現在の手番プレイヤーの色
          fromSquareId: 'HAND', // ダミーID
          toSquareId: `${toX}${toY}`,
          // fromPositionはダミー（GameBoardでクライアント座標から変換）
          fromPosition: { x: 0, y: 0 }, 
          toPosition: { x: 0, y: 0 },
          isCapture: false,
          phase: 'lifting', // または 'moving'
          isDrop: true,
          dropStartPosition: selectedHandPiecePosition
        });

        // アニメーション完了後の更新を予約（盤面更新自体はstate更新で行われるが、アニメーションと同期させる）
        // ※ dropの場合はshogi.jsのdropは既に実行済みだが、
        // アニメーション中は盤面上に駒を表示したくない（AnimatedPieceが飛んでいるため）
        // GameBoard側で `isAnimatingPiece` 判定に `isDrop` も考慮させる必要がある
        pendingBoardUpdateRef.current = () => {
             // 履歴に記録（待った用）
            setMoveHistory(prev => [...prev, {
                type: 'drop',
                toX, toY, kind
            }]);
            setVersion(v => v + 1);
        };

        // 一旦バージョン更新は保留にするため、ここではsetVersionしない
        // （pendingBoardUpdateRefで実行）
      } else {
        // アニメーションなしの場合（通常ありえないが）
        setMoveHistory(prev => [...prev, {
            type: 'drop',
            toX, toY, kind
        }]);
        setVersion(v => v + 1);
      }
    } catch (e) {
      console.error("Drop error:", e);
    }
    setSelectedHandPieceId(null);
    setSelectedSquareId(null);
    setAvailableMoves(new Set()); // クリア
  }, [selectedHandPiecePosition]);

  // マスクリック
  const onSquareClick = useCallback((squareId: string) => {
    if (winner !== null || waitingForPromotion || waitingForResignConfirm) return;

    // ID ("76") からライブラリ座標 (x=7, y=6) をパース
    const tx = parseInt(squareId[0]);
    const ty = parseInt(squareId[1]);

    // UI上の座標に変換（選択ロジック用）
    const targetSquare = squares.find(s => s.id === squareId);
    if (!targetSquare) return;

    const currentPlayer = gameRef.current.turn; // 0 or 1

    // 1. 持ち駒を選択中 -> 打つ
    if (selectedHandPieceId) {
      // "COLOR-KIND-index" (e.g. "0-FU-0") から種類を取得
      const parts = selectedHandPieceId.split('-');
      let kind: PieceKind;
      if (parts.length === 3) {
        kind = parts[1] as PieceKind;
      } else {
        kind = parts[0] as PieceKind;
      }
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

  }, [squares, selectedSquareId, selectedHandPieceId, winner, waitingForPromotion, waitingForResignConfirm, movePiece, dropPiece, selectedHandPiecePosition]);

  // 持ち駒クリック
  const onHandPieceClick = useCallback((uniqueId: string, position?: { x: number, y: number }) => {
    // uniqueId format: "COLOR-KIND-index" (e.g. "0-FU-0")
    // or legacy "KIND-index" (if any)
    const parts = uniqueId.split('-');
    let kind: PieceKind;
    if (parts.length === 3) {
        kind = parts[1] as PieceKind;
    } else {
        kind = parts[0] as PieceKind;
    }
    
    const currentTurn = gameRef.current.turn;
    
    // 座標を保存
    if (position) {
        setSelectedHandPiecePosition(position);
    }

    setSelectedSquareId(null);
    setAvailableMoves(new Set()); // 盤上選択解除のためにクリア

    // 持ち駒選択のロジック
    // 選択解除ならクリア、新規選択なら打てる場所を計算
    if (selectedHandPieceId === uniqueId) {
      setSelectedHandPieceId(null);
      setSelectedHandPiecePosition(null);
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
  }, [selectedHandPieceId]);

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
    }
    setWaitingForResignConfirm(false);
  }, []);

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
    setSelectedSquareId(null);
    setSelectedHandPieceId(null);
    setSelectedHandPiecePosition(null);
    setWaitingForPromotion(false);
    setWaitingForResignConfirm(false);
    setShowCheckWarning(false);
    setPendingMove(null);
    setAvailableMoves(new Set());
    setMoveHistory([]); // 履歴もクリア
  }, []);

  // 待った（一手戻す）
  const onUndo = useCallback(() => {
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
  }, [moveHistory, winner]);

  const canUndo = moveHistory.length > 0 && winner === null && !isAnimating;

  // =====================================
  // アニメーション完了ハンドラ
  // =====================================

  // 移動アニメーション完了時のコールバック
  const onAnimationComplete = useCallback(() => {
    // 保留中の盤面更新があれば実行
    if (pendingBoardUpdateRef.current) {
      pendingBoardUpdateRef.current();
      pendingBoardUpdateRef.current = null;
    }
    // アニメーション状態をクリア
    setMoveAnimation(null);
    setIsAnimating(false);

    // 相手に王手をかけたかチェック
    const opponent = gameRef.current.turn; // 手番は既に変わっている
    if (gameRef.current.isCheck(opponent)) {
      // 王手！カットインを表示
      const attacker = opponent === 0 ? 1 : 0; // 王手をかけたのは前の手番のプレイヤー
      setCheckAttacker(attacker as Color);
      setShowCheckCutIn(true);
    }
  }, []);

  // 弾き飛ばしアニメーション完了時のコールバック
  const onFlyingComplete = useCallback(() => {
    setFlyingPiece(null);
  }, []);

  // 成り演出完了コールバック
  const onPromotionAnimationComplete = useCallback(() => {
    setPromotionAnimation(null);
  }, []);

  // 王手カットイン完了コールバック
  const onCheckCutInComplete = useCallback(() => {
    setShowCheckCutIn(false);
  }, []);

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
    // アニメーション関連
    moveAnimation,
    flyingPiece,
    isAnimating,
    onAnimationComplete,
    onFlyingComplete,
    // 成り演出関連
    promotionAnimation,
    onPromotionAnimationComplete,
    // 王手カットイン関連
    showCheckCutIn,
    checkAttacker,
    onCheckCutInComplete,
  };
}