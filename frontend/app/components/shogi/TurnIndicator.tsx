/**
 * TurnIndicator コンポーネント
 * 現在の手番を大きく表示するコンポーネント
 */

'use client';

import React from 'react';
import { PlayerNumber } from './hooks/useJShogi';

// =====================================
// Props定義
// =====================================

export interface TurnIndicatorProps {
  /** 現在の手番 */
  currentPlayer: PlayerNumber;
  /** プレイヤーの先手/後手 */
  playerNumber: PlayerNumber;
  /** 勝者（null: 未決着） */
  winner: PlayerNumber | null;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 手番表示コンポーネント
 */
export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentPlayer,
  playerNumber,
  winner,
}) => {
  // 勝敗が決まっている場合
  if (winner !== null) {
    return null; // GameOverDialogで表示
  }

  const isPlayerTurn = currentPlayer === playerNumber;
  const turnText = currentPlayer === 1 ? '先手' : '後手';
  const yourTurn = isPlayerTurn ? 'あなたの番' : '相手の番';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 手番表示（大きめ） */}
      <div
        className={`
          text-2xl sm:text-3xl md:text-4xl font-bold
          px-6 py-2 rounded-lg
          transition-all duration-300
          ${isPlayerTurn
            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg animate-pulse'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
          }
        `}
      >
        {turnText}の番
      </div>

      {/* 補助テキスト */}
      <div
        className={`
          text-sm sm:text-base
          ${isPlayerTurn ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-500'}
        `}
      >
        {yourTurn}
      </div>
    </div>
  );
};

export default TurnIndicator;
