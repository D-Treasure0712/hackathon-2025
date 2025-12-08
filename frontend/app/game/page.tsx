/**
 * 対局画面
 * 将棋盤を表示し、対局を行う画面
 */

import { ShogiBoard, INITIAL_BOARD_STATE } from '../components/shogi';

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <main className="flex flex-col items-center justify-center gap-8 w-full max-w-2xl">
        {/* ページタイトル */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
          対局画面
        </h1>

        {/* 
          将棋盤
          初期配置（平手）で表示
          将来的にはstateで盤面を管理する
        */}
        <ShogiBoard boardState={INITIAL_BOARD_STATE} />

        {/* 
          プレースホルダー: 操作パネル
          将来的にここに手番表示、駒台、操作ボタンなどを配置
        */}
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          ※ 現在は表示のみ（駒の移動は未実装）
        </div>
      </main>
    </div>
  );
}
