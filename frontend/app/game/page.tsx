/**
 * 対局画面
 * 将棋盤を表示し、対局を行う画面
 */
'use client';

import BackgroundMusic from './components/BackgroundMusic';
import { GameController } from '../components/shogi';

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      {/* BGM */}
      <BackgroundMusic />

      <main className="flex flex-col items-center justify-center gap-8 w-full max-w-2xl">
        {/* ページタイトル */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
          対局画面
        </h1>
      </main>
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