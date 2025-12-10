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
}

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
  const [waitingForPromotion, setWaitingForPromotion] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ fromX: number, fromY: number, toX: number, toY: number } | null>(null);
  const [waitingForResignConfirm, setWaitingForResignConfirm] = useState(false);
  const [showCheckWarning, setShowCheckWarning] = useState(false); // 王手警告
  const [winner, setWinner] = useState<Color | null>(null);
  const [lastMoveToSquareId, setLastMoveToSquareId] = useState<string | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Set<string>>(new Set()); // 追加

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
      setVersion(v => v + 1);
    } catch (e) {
      console.error("Move error:", e);
    }

    setSelectedSquareId(null);
    setAvailableMoves(new Set()); // クリア
    setPendingMove(null);
    setWaitingForPromotion(false);
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
      setVersion(v => v + 1);
    } catch (e) {
      console.error("Drop error:", e);
    }
    setSelectedHandPieceId(null);
    setSelectedSquareId(null);
    setAvailableMoves(new Set()); // クリア
  }, []);

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

  }, [squares, selectedSquareId, selectedHandPieceId, winner, waitingForPromotion, waitingForResignConfirm, movePiece, dropPiece]);

  // 持ち駒クリック
  const onHandPieceClick = useCallback((uniqueId: string) => {
    // uniqueId format: "KIND-index"
    const [kind, _] = uniqueId.split('-');
    const currentTurn = gameRef.current.turn;

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
    setSelectedHandPieceId(null);
    setWaitingForPromotion(false);
    setWaitingForResignConfirm(false);
    setShowCheckWarning(false);
    setPendingMove(null);
    setAvailableMoves(new Set());
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
  };
}