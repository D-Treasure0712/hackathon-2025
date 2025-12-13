"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react"; // useRefを追加
// 🎬 アニメーション用ライブラリ
import { motion, AnimatePresence, Variants } from "framer-motion";

/**
 * ============================================================================
 * 🌸 FloatingPetal コンポーネント
 * ----------------------------------------------------------------------------
 * ランダムな動きで落下する花びらを生成します。
 * 1枚ごとに「開始位置」「落下速度」「サイズ」「回転」が異なります。
 * ============================================================================
 */
const FloatingPetal = () => {
  // ⚠️ 注意: ランダム値をレンダリング時に生成するため、
  // 親コンポーネントで {isClient && ...} を使ってクライアントのみで表示するように制御しています。
  // (サーバーとクライアントで値が異なるとハイドレーションエラーになるため)

  // 各パラメータをランダムに決定
  const randomXStart = Math.random() * 100;       // 開始位置 (画面の横幅 0%〜100%)
  const randomDelay = Math.random() * 10;         // アニメーション開始までの遅延 (0〜10秒)
  const randomDuration = 10 + Math.random() * 10; // 落下にかかる時間 (10〜20秒)
  const randomScale = 0.5 + Math.random() * 0.5;  // 花びらのサイズ (0.5倍〜1.0倍)
  const randomRotationSpeed = (Math.random() - 0.5) * 2; // 回転速度と方向

  const randomXOffset1 = -5 + Math.random() * 10; // 1回目の揺れ幅 (-5vw 〜 +5vw)
  const randomXOffset2 = -5 + Math.random() * 10; // 2回目の揺れ幅 (-5vw 〜 +5vw)

  // 花びら単体のアニメーション定義
  const petalVariants: Variants = {
    initial: {
      y: -50, // 画面の上側（見えない位置）からスタート
      x: `${randomXStart}vw`,
      opacity: 0,
      scale: randomScale,
      rotate: randomRotationSpeed * 360,
    },
    animate: {
      y: "110vh", // 画面の下側（見えない位置）まで移動
      opacity: [0, 1, 1, 0], // フェードイン → 表示維持 → フェードアウト
      rotate: 360 * randomRotationSpeed * 5, // 落下中にくるくる回転させる
      // X軸（横方向）の揺らぎ：左右にひらひら舞う動きを表現
      x: [
        `${randomXStart}vw`,
        `${randomXStart + randomXOffset1}vw`,
        `${randomXStart}vw`,
        `${randomXStart + randomXOffset2}vw`,
        `${randomXStart}vw`
      ],
      transition: {
        duration: randomDuration,
        delay: randomDelay,
        repeat: Infinity, // 無限に繰り返す
        ease: "linear",   // 一定の速度で落下
        opacity: {
          duration: randomDuration,
          times: [0, 0.1, 0.8, 1],
          repeat: Infinity
        },
        x: {
          duration: randomDuration,
          repeat: Infinity,
          ease: "easeInOut" // 横揺れは滑らかに
        }
      },
    },
  };

  return (
    <motion.div
      variants={petalVariants}
      initial="initial"
      animate="animate"
      className="absolute top-0 pointer-events-none z-10" // z-10: 背景より手前、コンテンツより奥
      style={{ width: '20px', height: '20px' }} // 花びらの基準サイズ
    >
      <Image
        src="/images/petal.png" 
        alt="花びら"
        fill
        style={{ 
          objectFit: 'contain', 
          filter: 'brightness(0.65)' // 画像を少し暗くして夜桜の雰囲気に合わせる
        }}
      />
    </motion.div>
  );
};

/**
 * ============================================================================
 * 🎞️ アニメーション設定 (Variants)
 * ----------------------------------------------------------------------------
 * ページ全体で使用するアニメーションの「動きの設計図」を定義します。
 * ============================================================================
 */

// 1. 背景画像の常時アニメーション
// ------------------------------------
// ゆったりと拡大・移動を繰り返し、静止画に奥行きを与えます。
const bgAnimation: Variants = {
  animate: {
    scale: [1.0, 1.08, 1.0], // 等倍 → 1.08倍 → 等倍
    x: [0, -15, 0],          // 左へ少し移動 → 戻る
    y: [0, 5, 0],            // 下へ少し移動 → 戻る
    transition: {
      duration: 25,     // 25秒かけて1周
      repeat: Infinity, // 無限ループ
      ease: "easeInOut" // 滑らかな加減速
    }
  }
};

// 2. メインコンテンツのコンテナ
// ------------------------------------
// 子要素（ロゴ、ボタンなど）を順番に表示させる「指揮者」の役割です。
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3, // 子要素を0.3秒ずつずらして再生開始
      delayChildren: 0.5,   // イントロ終了から0.5秒待って開始
    }
  }
};

// 3. タイトルロゴのアニメーション
// ------------------------------------
// 大きく表示された状態から縮小し、「ドン」と着地するバネのような動き。
const logoVariant: Variants = {
  hidden: { scale: 2.5, opacity: 0, y: -20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",  // 物理演算（バネ）を使用
      stiffness: 120,  // バネの硬さ
      damping: 12,     // 振動の収まりやすさ
      duration: 0.8
    }
  }
};

// 4. 各アイテム（画像・ボタン）の共通アニメーション
// ------------------------------------
// 下からフワッと浮き上がってくる動き。
const itemFadeUpVariant: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};


/**
 * ============================================================================
 * 🚀 Home コンポーネント (メインページ)
 * ============================================================================
 */
export default function Home() {
  // ⏳ 状態管理
  // イントロダクション（白い画面）の表示フラグ
  const [showIntro, setShowIntro] = useState(true);
  // クライアントサイドレンダリングが完了したかのフラグ（花びら表示用）
  const [isClient, setIsClient] = useState(false);

  // 🎵 BGM用の状態管理とRef (ここを追加)
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false); // ミュート状態管理

  // 初回マウント時の処理
  useEffect(() => {
    setIsClient(true); // クライアントでの描画開始を記録

    // 2秒後にイントロ画面を非表示にするタイマー
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);

    return () => clearTimeout(timer); // クリーンアップ
  }, []);

// 🎵 自動再生ロジック
  // showIntroがfalseになったら（メイン画面になったら）勝手に再生する
  useEffect(() => {
    if (!showIntro && audioRef.current) {
      audioRef.current.volume = 0.4; // 音量調整
      audioRef.current.play().catch((e) => {
        // 万が一ブラウザにブロックされてもエラーで止まらないようにログだけ出す
        console.log("BGM autoplay prevented:", e);
      });
    }
  }, [showIntro]);

  // 🌸 花びらの生成枚数
  const petalCount = 30;

  return (
    // ✨ 全体のラッパー
    // min-h-svh: モバイルのアドレスバーを考慮した高さ設定
    <div className="relative min-h-svh w-full overflow-hidden text-white font-serif">
      
      {/* 🎵 BGM用のaudio要素 (ここを追加) */}
      <audio 
        ref={audioRef} 
        src="/sounds/野山.mp3" 
        loop 
        preload="auto"
      />

      {/* =================================================================
        Layer 0: 背景画像エリア (Z-index: 0)
        -----------------------------------------------------------------
        AnimatePresenceの外に置くことで、イントロ中も常に表示・動作させます。
      */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        
        {/* 📱 スマホ用背景 (PCでは非表示) */}
        <motion.div
          className="absolute inset-0 md:hidden"
          animate="animate"
          variants={bgAnimation}
        >
          <Image
            src="/images/mobile_title_background.png" 
            alt="スマホ用背景"
            fill 
            priority 
            style={{ objectFit: 'cover' }}
            className="opacity-80 pointer-events-none" 
          />
        </motion.div>

        {/* 💻 PC用背景 (スマホでは非表示) */}
        <motion.div
          className="absolute inset-0 hidden md:block"
          animate="animate"
          variants={bgAnimation}
        >
          <Image
            src="/images/pc_title_background.png" 
            alt="PC用背景"
            fill 
            priority 
            style={{ objectFit: 'cover' }}
            className="opacity-80 pointer-events-none" 
          />
        </motion.div>

        {/* 視認性を上げるための黒いフィルター */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* =================================================================
        Layer 1: 花びらエフェクト (Z-index: 1)
        -----------------------------------------------------------------
        背景より手前、コンテンツより奥に配置。
        isClient チェックにより、サーバーとクライアントの整合性を保ちます。
      */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {isClient && [...Array(petalCount)].map((_, i) => (
          <FloatingPetal key={i} />
        ))}
      </div>

      {/* =================================================================
        Layer 10 & 50: コンテンツエリアとイントロ画面
        -----------------------------------------------------------------
        AnimatePresence を使い、showIntro の切り替え時に
        フェードアウトのアニメーションを実行します。
      */}
      <AnimatePresence mode="wait">
        
        {showIntro ? (
          // -------------------------------------------------------------
          // 1️⃣ イントロ画面 (Z-index: 50 / 最前面)
          // -------------------------------------------------------------
          <motion.div
            key="intro-screen"
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }} // 1秒かけてフェードアウト
          >
            <p className="text-black text-xl md:text-2xl font-bold tracking-widest animate-pulse">
              created by 田中角行
            </p>
          </motion.div>

        ) : (
          // -------------------------------------------------------------
          // 2️⃣ メインコンテンツ (Z-index: 10)
          // -------------------------------------------------------------
          <motion.main
            key="main-content"
            className="relative z-10 flex min-h-svh flex-col items-center py-8 px-4 md:px-8"
            variants={containerVariants} // 親アニメーション設定
            initial="hidden"
            animate="visible"
          >

            {/* レイアウト調整用コンテナ */}
            <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-4 md:gap-8 md:flex-row md:justify-between flex-grow mt-8 md:mt-0">
              
              {/* === 左カラム: タイトルロゴ === */}
              <motion.div 
                className="flex flex-col items-center md:items-center md:w-1/2 mt-2 md:mt-0"
                variants={logoVariant}
              >
                <h1 className="font-bold tracking-tight text-white">
                  <Image
                    src="/images/logo.png" 
                    alt="Fujii-kun ロゴ"
                    width={600}
                    height={600}
                    // レスポンシブ対応のサイズ調整と位置調整
                    className="w-[70vw] max-w-[420px] h-auto md:w-[600px] md:h-auto drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] md:translate-x-[110px] md:-translate-y-[10px]"
                    style={{ objectFit: 'contain' }}
                    priority 
                  />
                </h1>
              </motion.div>
              
              {/* === 右カラム: 棋士画像と操作ボタン === */}
              <div className="flex flex-col items-center w-full md:w-1/2 md:items-center mt-4 md:mt-0 md:-translate-x-[100px]">
                
                {/* 棋士画像 */}
                <motion.div 
                  className="relative z-0 w-[60vw] max-w-[320px] h-auto aspect-square md:w-[350px] md:h-[450px] flex items-center justify-center"
                  variants={itemFadeUpVariant}
                >
                  <Image 
                    src="/images/ChessPlayer.png" 
                    alt="棋士" 
                    width={500}
                    height={500}
                    className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  /> 
                </motion.div>

                {/* 対局開始ボタン */}
                <motion.div 
                  className="w-full flex justify-center"
                  variants={itemFadeUpVariant}
                >
                  <Link
                    href="/game"
                    className="relative z-10 -mt-2 md:-mt-20 group inline-flex items-center justify-center overflow-hidden rounded-lg w-80 h-24 md:w-80 md:h-30 text-xl tracking-widest"
                  >
                    <Image
                      src="/images/start-button.png" 
                      alt="対局開始ボタン"
                      fill 
                      priority 
                      style={{ objectFit: 'contain' }} 
                      // ホバー時に画像を少し拡大するエフェクト
                      className="absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-105" 
                    />
                    < span  className = "sr-only" >対局開始</ span >
                    
                    {/* ホバー時の光のエフェクト */}
                    <span className="absolute inset-0 z-10 w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Link>
                </motion.div>
                
                {/* サブボタン（設定・棋譜） */}
                <motion.div 
                  className="flex flex-row md:flex-col gap-3 w-full max-w-xs mt-4 md:mt-6"
                  variants={itemFadeUpVariant}
                >
                  <Link
                    href="/settings"
                    className="relative flex-1 md:flex-none md:w-full inline-flex items-center justify-center px-4 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
                  >
                    設定
                  </Link>                  
                  
                  <button
                    className="relative flex-1 md:flex-none md:w-full inline-flex items-center justify-center px-4 py-3 font-semibold rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 text-lg"
                  >
                    藤井君の歴史
                  </button>
                </motion.div>

              </div> {/* 右カラム終了 */}
              
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}