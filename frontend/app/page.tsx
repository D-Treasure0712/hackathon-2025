"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    // ✨ 全体のコンテナ: 画面いっぱいに広げ、基本のフォントなどを設定
    <div className="relative min-h-screen w-full overflow-hidden text-white font-serif">
      
      {/* =================================================================
          🏞️ 背景画像エリア (Z-index: 0 / 最背面)
         ================================================================= */}
      <div className="absolute inset-0 z-0">
        {/* ベースの背景画像 */}
        <Image
          src="/images/title-background.png" 
          alt="厳かな和風背景"
          fill 
          priority 
          style={{ objectFit: 'cover' }}
          className="opacity-90 pointer-events-none" 
        />
        {/* 背景を少し暗くして文字を見やすくする黒いフィルター */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* =================================================================
          🚀 メインコンテンツエリア (Z-index: 10 / 手前)
         ================================================================= */}
      <main className="relative z-10 flex min-h-screen flex-col items-center py-8 px-4 md:px-8">
        
        {/* 📐 レイアウトの枠組み
           - max-w-7xl: コンテンツの最大幅を制限
           - md:flex-row: PC画面では横並びに
           - md:justify-between: 左右の要素を離して配置
        */}
        <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-8 md:flex-row md:justify-between flex-grow mt-16 md:mt-0">
          
          {/* -------------------------------------------------------------
              1️⃣ 左カラム: タイトルロゴ
             ------------------------------------------------------------- */}
          <div className="flex flex-col items-center md:items-center md:w-1/2 animate-fade-in-up mt-4 md:mt-0">
            
            <h1 className="font-bold tracking-tight text-white">
              <Image
                src="/images/logo.png" 
                alt="Fujii-kun ロゴ"
                width={600}
                height={600}
                
                // 🎨 【ロゴの位置調整】
                // md:translate-x-[40px]  : プラスで右へ、マイナスで左へ移動
                // md:-translate-y-[160px]: マイナスで上へ、プラスで下へ移動
                className="w-[280px] h-auto md:w-[400px] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] md:translate-x-[110px] md:-translate-y-[130px]"
                
                style={{ objectFit: 'contain' }}
                priority 
              />
            </h1>
          </div>
          
          {/* -------------------------------------------------------------
              2️⃣ 右カラム: 棋士画像と操作ボタン群
             ------------------------------------------------------------- */}
          {/* 🎨 【右グループ全体の位置調整】
             - md:-translate-x-[100px]: グループごと左（中央）へ寄せる
          */}
          <div className="flex flex-col items-center w-full md:w-1/2 md:items-center animate-fade-in delay-500 mt-8 md:mt-0 md:-translate-x-[100px]">
            
            {/* 👤 棋士画像 */}
            {/* z-0: ボタンより奥に配置 */}
            <div className="relative z-0 w-80 h-80 md:w-[350px] md:h-[450px] flex items-center justify-center">
              <Image 
                src="/images/chessplayer.png" 
                alt="棋士" 
                width={500}
                height={500}
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              /> 
            </div>

            {/* ▶️ 対局開始ボタン */}
            <Link
              href="/game"
              // 🎨 【ボタンの重なり調整】
              // -mt-6 / md:-mt-20 : マイナスマージンで上に引き上げ、棋士画像に被せる
              // z-10: 棋士画像より手前に表示
              className="relative z-10 -mt-6 md:-mt-20 group inline-flex items-center justify-center overflow-hidden rounded-lg w-full max-w-xs text-xl tracking-widest h-16 md:h-30"
            >
              <Image
                src="/images/start-button.png" 
                alt="対局開始ボタン"
                fill 
                priority 
                style={{ objectFit: 'cover' }} 
                className="absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-105" 
              />
              {/* ホバー時の光るエフェクト */}
              <span className="absolute inset-0 z-10 w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
            
            {/* ⚙️ サブボタン（設定・棋譜） */}
            <div className="flex flex-col gap-4 w-full max-w-xs mt-6">
              <Link
                href="/settings"
                className="relative inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
              >
                設定
              </Link>
              
              <button
                className="relative inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
              >
                棋譜
              </button>
            </div>

          </div> {/* 右カラム終了 */}
          
        </div>
      </main>
    </div>
  );
}