/**
 * 対局画面
 * 将棋盤を表示し、対局を行う画面
 */
'use client';

import Image from 'next/image';
import BackgroundMusic from './components/BackgroundMusic';
import { GameController } from '../components/shogi';

export default function GamePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white font-serif flex flex-col items-center justify-center">
      {/* 背景画像エリア */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/game-background.png"
          alt="対局背景"
          fill
          priority
          unoptimized
          quality={100}
          style={{ objectFit: 'cover' }}
          className="opacity-90 pointer-events-none"
        />
        {/* 背景を少し暗くして盤面を見やすくする */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* BGM（非表示） */}
      <BackgroundMusic />

      <main className="relative z-10 flex flex-col items-center justify-center gap-8 w-full max-w-4xl p-4">
        {/* ページタイトル */}

      </main>
    </div>
  );
}
