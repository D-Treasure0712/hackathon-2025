"use client";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    // 最外層のdiv: relativeを維持
    <div className="relative min-h-screen w-full overflow-hidden text-white font-serif">
      
      {/* 🏞️ 背景画像エリア (Z-index: 0) */}
      <div className="absolute inset-0 z-0">
        
        {/* 1. ベースの背景画像 */}
        <Image
          src="/images/background2.png" 
          alt="厳かな和風背景"
          fill 
          priority 
          style={{ objectFit: 'cover' }}
          className="opacity-80 pointer-events-none" 
        />
        
        {/* 2. 厳かな雰囲気を保つための黒いオーバーレイ (10%) */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center py-8 px-4 md:px-8">
        
        {/* 🚀 メインレイアウトコンテナ: ロゴと右側コンテンツを横並びに配置 🚀 */}
        <div className="flex w-full max-w-6xl flex-col items-start justify-center gap-8 md:flex-row md:items-start md:justify-between flex-grow mt-16 md:mt-0">
          
          {/* ===================================== */}
          {/* 1. 左カラム: ロゴセクション (最大限に大きく) */}
          {/* ===================================== */}
          {/* md:w-2/5: PCで左側を広く確保 */}
          <div className="flex flex-col items-start md:w-2/5 animate-fade-in-up mt-4 md:mt-16">
            
            {/* 🔴 ロゴ本体: h-クラスを h-64 md:h-96 に拡大し、ロゴを大きく表示 🔴 */}
            <h1 className="relative h-64 w-full max-w-none md:h-96 md:max-w-none font-bold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              <Image
                src="/images/logo4.png" 
                alt="Fujii-kun ロゴ"
                fill // 👈 親要素 (h1) のサイズに自動調整
                style={{ objectFit: 'contain' }} // 👈 アスペクト比を維持
                className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
              />
            </h1>
          </div>
          
          {/* ===================================== */}
          {/* 2. 右カラム: 棋士画像と縦並びのボタン */}
          {/* ===================================== */}
          <div className="flex flex-col items-center w-full md:w-3/5 md:items-end gap-6 animate-fade-in delay-500 mt-8 md:mt-16">
            
            {/* 2-A. 棋士画像 (サイズを w-64/h-64, md:w-80/h-80 に拡大) */}
            <div className="relative w-64 h-64 md:w-80 md:h- flex items-center justify-center">
              <Image 
                src="/images/chessplayer2.png" 
                alt="棋士" 
                width={256} // Imageコンポーネントの必須属性として維持
                height={256} 
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              /> 
            </div>

            {/* 2-B. 対局開始ボタン (メインボタン) */}
            <Link
              href="/game"
              // ボタン全体の高さ (h-16 md:h-28) を設定
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg w-full max-w-xs text-xl tracking-widest mt-4 h-16 md:h-28"
            >
              {/* ボタンの背景画像 */}
              <Image
                src="/images/start-button.png" 
                alt="対局開始ボタン"
                fill 
                priority 
                style={{ objectFit: 'cover' }} 
                className="absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-105" 
              />

              {/* ホバー時のオーバーレイ */}
              <span className="absolute inset-0 z-10 w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

            </Link>
            
            {/* 2-C. 設定・棋譜ボタン (縦に並べる) */}
            <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
              
              {/* 設定ボタン */}
              <button
                className="relative inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
              >
                設定
              </button>
              
              {/* 棋譜ボタン */}
              <button
                className="relative inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
              >
                棋譜
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}