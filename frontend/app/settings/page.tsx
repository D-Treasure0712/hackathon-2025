'use client'; 

import Link from 'next/link';
// 作成した部品をインポートします
import SoundSettings from './components/SoundSettings';

// 将来増えるかもしれない部品のインポート例
// import GameSettings from './_components/GameSettings';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      {/* 設定画面の外枠（白いカード） */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8 border border-stone-200">
        
        {/* ページ全体のタイトル */}
        <h1 className="text-2xl font-bold text-stone-800 mb-8 text-center border-b pb-4 border-stone-100">
          設定 (Settings)
        </h1>

        {/* ここに設定項目（コンポーネント）を積み上げていきます */}
        <div className="space-y-12">
          
          {/* 1. 音量設定ブロック */}
          <SoundSettings />

          {/* 2. 将来追加する対局設定ブロック（例） */}
          {/* <GameSettings /> */}

          {/* 3. 将来追加する表示設定ブロック（例） */}
          {/* <DisplaySettings /> */}

        </div>

        {/* --- 戻るボタン --- */}
        <div className="mt-12 flex justify-center border-t pt-8 border-stone-100">
          <Link 
            href="/" 
            className="bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-md active:scale-95"
          >
            タイトルへ戻る
          </Link>
        </div>

      </div>
    </div>
  );
}