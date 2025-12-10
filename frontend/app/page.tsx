"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    // ✨ 全体のコンテナ: 画面いっぱいに広げ、基本のフォントなどを設定
    <div className="relative min-h-svh w-full overflow-hidden text-white font-serif">
      
      {/* =================================================================
          🏞️ 背景画像エリア (Z-index: 0 / 最背面)
         ================================================================= */}
      <div className="absolute inset-0 z-0">
        {/* PC用の背景画像 */}
        <Image
          src="/images/PC-title-background.png" 
          alt="PC用背景"
          fill 
          priority 
          style={{ objectFit: 'cover' }}
          className="hidden md:block opacity-70 pointer-events-none" 
        />

        {/* 📱 スマホ用背景画像 (md:hidden でPCでは隠す) */}
        <Image
          src="/images/mobile-title-background.png"  // スマホ用の縦長画像を指定
          alt="スマホ用背景"
          fill 
          priority 
          style={{ objectFit: 'cover' }}
          className="md:hidden opacity-70 pointer-events-none" 
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
        <div className="flex w-full max-w-7xl flex-col items-center justify-center md:flex-row md:justify-between flex-grow md:mt-0">
          
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
                className="w-[80vw] w-[380px] h-auto md:w-[400px] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] md:translate-x-[110px] md:-translate-y-[130px]"
                
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
          <div className="flex flex-col items-center w-full md:w-1/2 md:items-center animate-fade-in delay-500 mt-3 md:mt-0 md:-translate-x-[100px]">
            
            {/* 👤 棋士画像 */}
            {/* z-0: ボタンより奥に配置 */}
            <div className="relative z-0 w-[40vw] max-w-[320px] h-auto aspect-square  md:w-[350px] md:h-[450px] flex items-center justify-center">
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
              className="relative z-10 -mt-2 md:-mt-20 group inline-flex items-center justify-center overflow-hidden rounded-lg w-full max-w-xs text-xl tracking-widest h-25 md:h-30"
            >
              <Image
                src="/images/start-button.png" 
                alt="対局開始ボタン"
                fill 
                priority 
                style={{ objectFit: 'contain' }} 
                className="absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-105" 
              />
              {/* ホバー時の光るエフェクト */}
              <span className="absolute inset-0 z-10 w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
            
            {/* ⚙️ サブボタン（設定・棋譜） */}
            {/* 🛠️【変更点1】コンテナの並び方向
               - flex-row : スマホ（基本）は横並び
               - md:flex-col : PC画面（md以上）は縦並びに戻す
               - gap-3 : ボタン同士の隙間
            */}
            <div className="flex flex-row md:flex-col gap-3 w-full max-w-xs mt-4 md:mt-6">
              
              <Link
                href="/settings"
                // 🛠️【変更点2】幅の調整
                // flex-1 : 横並びのとき、余白を埋めるように2つのボタンを均等な幅にする
                // px-4   : 横並びで文字がはみ出ないよう、内側の余白を少し減らす（元はpx-8）
                // md:w-full : PCのときは横幅いっぱいに
                className="relative flex-1 md:flex-none md:w-full inline-flex items-center justify-center px-4 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
              >
                設定
              </Link>
              
              <button
                // 🛠️【変更点3】同じく幅調整
                className="relative flex-1 md:flex-none md:w-full inline-flex items-center justify-center px-4 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
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