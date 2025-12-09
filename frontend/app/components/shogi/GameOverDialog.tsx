/**
 * GameOverDialog コンポーネント
 * 対局終了時のダイアログ
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { PlayerNumber } from './hooks/useJShogi';

// =====================================
// Props定義
// =====================================

export interface GameOverDialogProps {
  /** 勝者（null: 未決着） */
  winner: PlayerNumber | null;
  /** プレイヤーの先手/後手 */
  playerNumber: PlayerNumber;
  /** 再対局コールバック */
  onRematch: () => void;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 対局終了ダイアログ
 */
export const GameOverDialog: React.FC<GameOverDialogProps> = ({
  winner,
  playerNumber,
  onRematch,
}) => {
  if (winner === null) return null;

  const isWinner = winner === playerNumber;
  const winnerText = winner === 1 ? '先手' : '後手';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-8 m-4 max-w-md w-full text-center">
        {/* 結果表示 */}
        <div className={`
          text-3xl sm:text-4xl font-bold mb-2
          ${isWinner 
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500'
            : 'text-zinc-600 dark:text-zinc-400'
          }
        `}>
          {isWinner ? '🎉 勝利！ 🎉' : '敗北...'}
        </div>

        <div className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          {winnerText}の勝ち
        </div>

        {/* ボタン */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRematch}
            className="
              w-full py-3 px-4 rounded-lg
              bg-gradient-to-r from-blue-500 to-purple-500
              text-white font-bold text-lg
              hover:from-blue-600 hover:to-purple-600
              transition-all shadow-lg hover:shadow-xl
            "
          >
            もう一度対局
          </button>
          <Link
            href="/"
            className="
              w-full py-3 px-4 rounded-lg
              bg-zinc-200 dark:bg-zinc-700
              text-zinc-700 dark:text-zinc-300 font-bold text-lg
              hover:bg-zinc-300 dark:hover:bg-zinc-600
              transition-all text-center
            "
          >
            タイトルに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GameOverDialog;
