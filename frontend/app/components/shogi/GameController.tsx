/**
 * GameController コンポーネント
 * 対局全体を管理するコンポーネント
 * 
 * 機能:
 * - 先手/後手のランダム決定（下側プレイヤーがランダム）
 * - 盤面、持ち駒、手番表示の配置
 * - ダイアログの表示制御
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useJShogi, PlayerNumber } from './hooks/useJShogi';
import { GameBoard } from './GameBoard';
import { CapturedPieces } from './CapturedPieces';
import { TurnIndicator } from './TurnIndicator';
import { PromotionDialog } from './PromotionDialog';
import { GameOverDialog } from './GameOverDialog';
import { ResignConfirmDialog } from './ResignConfirmDialog';

// =====================================
// Props定義
// =====================================

export interface GameControllerProps {
  /** 初期化完了コールバック */
  onInitialized?: (playerNumber: PlayerNumber) => void;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 対局全体を管理するコンポーネント
 */
export const GameController: React.FC<GameControllerProps> = ({
  onInitialized,
}) => {
  // 下側プレイヤーの先手/後手をランダムに決定
  // playerNumber: 1 = 先手（下側が先手）, 2 = 後手（下側が後手）
  const [playerNumber, setPlayerNumber] = useState<PlayerNumber | null>(null);
  const [showDecision, setShowDecision] = useState(true);

  useEffect(() => {
    // ランダムで先手か後手かを決定
    const randomPlayer: PlayerNumber = Math.random() < 0.5 ? 1 : 2;
    setPlayerNumber(randomPlayer);
    onInitialized?.(randomPlayer);
    
    // 2秒後に決定画面を非表示
    const timer = setTimeout(() => {
      setShowDecision(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onInitialized]);

  // 決定中の表示
  if (playerNumber === null || showDecision) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white animate-pulse">
          🎲 先手後手決定中...
        </div>
        {playerNumber !== null && (
          <div className={`
            text-2xl sm:text-3xl font-bold
            ${playerNumber === 1 
              ? 'text-red-500' 
              : 'text-blue-500'
            }
          `}>
            あなたは{playerNumber === 1 ? '先手' : '後手'}です！
          </div>
        )}
      </div>
    );
  }

  return <GameControllerInner playerNumber={playerNumber} />;
};

// 内部コンポーネント（playerNumberが確定してから）
const GameControllerInner: React.FC<{ playerNumber: PlayerNumber }> = ({ playerNumber }) => {
  const {
    squares,
    hands,
    currentPlayer,
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
  } = useJShogi({ playerNumber });

  // 持ち駒を取得
  const player1Hand = hands.find(h => h.player_number === 1);
  const player2Hand = hands.find(h => h.player_number === 2);

  // 再対局（新しいランダム先後で）
  const handleRematch = () => {
    // ページリロードして新しいランダム決定
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto px-2">
      {/* 手番表示 */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        playerNumber={playerNumber}
        winner={winner}
      />

      {/* あなたは先手/後手 表示 */}
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        あなたは{playerNumber === 1 ? '先手（下側）' : '後手（上側）'}です
      </div>

      {/* メインエリア：持ち駒 + 盤面 + 持ち駒 */}
      <div className="flex items-stretch gap-2 sm:gap-4 w-full justify-center">
        {/* 後手の持ち駒（左側） */}
        {player2Hand && (
          <CapturedPieces
            hand={player2Hand}
            selectedPieceId={selectedHandPieceId}
            onPieceClick={onHandPieceClick}
            isCurrentTurn={currentPlayer === 2}
            position="left"
          />
        )}

        {/* 将棋盤 */}
        <GameBoard
          squares={squares}
          currentPlayer={currentPlayer}
          selectedSquareId={selectedSquareId}
          lastMoveToSquareId={lastMoveToSquareId}
          onSquareClick={onSquareClick}
        />

        {/* 先手の持ち駒（右側） */}
        {player1Hand && (
          <CapturedPieces
            hand={player1Hand}
            selectedPieceId={selectedHandPieceId}
            onPieceClick={onHandPieceClick}
            isCurrentTurn={currentPlayer === 1}
            position="right"
          />
        )}
      </div>

      {/* 投了ボタン */}
      {winner === null && (
        <button
          onClick={onResignRequest}
          className="
            px-6 py-2 rounded-lg
            bg-zinc-200 dark:bg-zinc-700
            text-zinc-700 dark:text-zinc-300
            font-medium
            hover:bg-zinc-300 dark:hover:bg-zinc-600
            transition-colors
          "
        >
          投了
        </button>
      )}

      {/* 成り選択ダイアログ */}
      <PromotionDialog
        isOpen={waitingForPromotion}
        onSelect={onPromotionSelect}
      />

      {/* 投了確認ダイアログ */}
      <ResignConfirmDialog
        isOpen={waitingForResignConfirm}
        onConfirm={onResignConfirm}
      />

      {/* 対局終了ダイアログ */}
      <GameOverDialog
        winner={winner}
        playerNumber={playerNumber}
        onRematch={handleRematch}
      />
    </div>
  );
};

export default GameController;
