"use client";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-900 text-white font-serif">
      {/* 背景エリア */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-indigo-900 via-slate-900 to-black opacity-80" />
      {/* 藤の花の装飾（CSSで疑似的に表現） */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent z-0 pointer-events-none" />

      <main className="relative z-10 flex min-h-screen flex-col items-center py-8 px-4 md:px-8">
        
        {/* 1. タイトルセクション */}
        <div className="mt-4 mb-8 flex flex-col items-center text-center animate-fade-in-up">
          <p className="mb-2 text-lg md:text-xl text-amber-400 tracking-widest font-bold drop-shadow-md">
            ー 最強からの挑戦状 ー
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            <span className="bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Fujii-kun
            </span>
          </h1>
        </div>

        {/* 2. メインコンテンツエリア (PCでは横並び、スマホでは縦並び) */}
        <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-8 md:flex-row md:items-end md:gap-16 flex-grow">
          
          {/* 左側：将棋盤エリア */}
          <div className="relative w-full max-w-xl aspect-[1/0.8] flex items-end justify-center order-1 md:order-1">
            {/* 将棋盤のダミー (画像があれば <Image ... /> に置き換え) */}
            <div className="w-full h-full bg-amber-700/80 rounded-t-xl border-t-4 border-amber-300 shadow-2xl transform perspective-1000 rotate-x-12 flex items-center justify-center text-amber-200/50 text-xl font-bold">
              <div className="text-center">
                <p>将棋盤画像</p>
                <p className="text-xs">public/images/shogi-board.png</p>
              </div>
            </div>
          </div>

          {/* 右側：棋士画像 & 対局ボタンエリア */}
          <div className="flex flex-col items-center gap-6 order-2 md:order-2 animate-fade-in delay-500">
            
            {/* 棋士画像 (ChessPlayer.png) */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
              {/* 画像ファイルがある場合の記述例（コメントアウトを外して使ってください）*/
              <Image 
                src="/images/ChessPlayer.png" 
                alt="棋士" 
                width={256} 
                height={256} 
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              /> 
              }
              
              {/* 画像がない時のダミー表示 */}
              {/* <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-400">
                <div className="text-center text-sm">
                  <p>ChessPlayer.png</p>
                  <p>配置エリア</p>
                </div>
              </div> */}
            </div>

            {/* 対局開始ボタン */}
            <Link
              href="/game"
              className="group relative inline-flex items-center justify-center px-10 py-4 overflow-hidden font-bold rounded-lg bg-indigo-950 border-2 border-amber-500 text-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95 w-full md:w-auto"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative text-2xl tracking-widest">対局開始</span>
            </Link>
          </div>

        </div>
      </main>

      {/* アニメーション定義 */}
      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out forwards; }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
}