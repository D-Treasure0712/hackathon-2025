/**
 * 対局画面
 * 将棋盤を表示し、対局を行う画面
 */

'use client';

import { GameController } from '../components/shogi';

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 dark:bg-black py-4 px-2">
      {/* ページタイトル */}
      <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-4">
        対局画面
      </h1>

      {/* 
        GameController: 対局全体を管理
        - 先手/後手のランダム決定
        - 盤面・持ち駒・手番の表示
        - 駒の移動処理
      */}
      <GameController />
    </div>
  );
}
