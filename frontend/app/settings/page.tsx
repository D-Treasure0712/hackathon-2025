'use client';

import Link from 'next/link';
// 作成した部品をインポートします
import SoundSettings from './components/SoundSettings';
import Image from 'next/image';

// 将来増えるかもしれない部品のインポート例
// import GameSettings from './_components/GameSettings';

export default function SettingsPage() {
  // 和風な金色（黄色）と、背景に合うテキスト色の定義
  const accentColor = "text-yellow-500"; // 金色っぽい黄色
  const textColor = "text-stone-200"; // 少し落ち着いた白

  return (
    // 1. 背景色と画像の適用
    // bg-[#1a1e3b] は画像から抽出した深い青色です。必要に応じて調整してください。
    <div className="min-h-screen bg-[#1a1e3b] relative flex flex-col items-center justify-center p-4 font-serif">
      {/* 背景画像の設定 (next/imageを使用) */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-90">

        <Image
          src="/images/setting_background.png" // ←ここに実際の画像のパスを入れてください
          alt="和風背景"
          fill
          style={{ objectFit: 'cover' }}
          quality={100}
        />
        {/* 画像の上にうっすらグラデーションをかけて文字を見やすくする */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1e3b]/50 via-transparent to-[#1a1e3b]/80"></div>
      </div>

      {/* 2. コンテナ（カード）のスタイル変更 */}
      {/* 白背景をやめ、背景になじむ暗い色の半透明なコンテナに変更。枠線を金色に。 */}
      <div className={`relative z-10 bg-[#1a1e3b]/80 w-full max-w-md rounded-xl shadow-2xl p-8 border border-yellow-600/50 backdrop-blur-sm`}>

        {/* 3. ページ全体のタイトル */}
        {/* 4. フォントと装飾: 和風な下線（border）と金色テキスト */}
        <h1 className={`text-3xl font-bold ${accentColor} mb-10 text-center border-b border-yellow-600/50 pb-4 tracking-wider`}>
          設 定
          <span className="block text-sm mt-2 font-normal opacity-80">Settings</span>
        </h1>

        {/* ここに設定項目（コンポーネント）を積み上げていきます */}
        <div className={`space-y-12 ${textColor}`}>

          {/* 1. 音量設定ブロック */}
          {/* SoundSettingsコンポーネント内部の文字色も変更が必要な場合があります */}
          <SoundSettings />

          {/* 2. 将来追加する対局設定ブロック（例） */}
          {/* <GameSettings /> */}

          {/* 3. 将来追加する表示設定ブロック（例） */}
          {/* <DisplaySettings /> */}

        </div>

        {/* --- 戻るボタン --- */}
        {/* 5. ボタンのデザイン変更: 金色ベースのボタンに変更 */}
        <div className="mt-12 flex justify-center border-t border-yellow-600/50 pt-8">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-yellow-950 transition-all duration-300 bg-yellow-500 rounded-full hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-[#1a1e3b] shadow-[0_0_15px_rgba(234,179,8,0.5)] active:scale-95"
          >
            {/* ボタンの装飾的な枠線（オプション） */}
            <span className="absolute inset-0 rounded-full border-2 border-yellow-300 opacity-50 group-hover:opacity-100 transition-opacity"></span>
            <span className="relative tracking-widest">タイトルへ戻る</span>
          </Link>
        </div>

      </div>
    </div>
  );
}