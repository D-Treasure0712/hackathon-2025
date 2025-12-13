"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react"; 
// 🎬 アニメーション用ライブラリ
import { motion, AnimatePresence, Variants } from "framer-motion";

/**
 * ============================================================================
 * 🌸 FloatingPetal コンポーネント
 * ----------------------------------------------------------------------------
 * ランダムな動きで落下する花びらを生成します。
 * ============================================================================
 */
const FloatingPetal = () => {
  // 親コンポーネントで {isClient && ...} を使って制御するため、ここでは単純なランダム生成を行う
  const randomXStart = Math.random() * 100;       
  const randomDelay = Math.random() * 10;         
  const randomDuration = 10 + Math.random() * 10; 
  const randomScale = 0.5 + Math.random() * 0.5;  
  const randomRotationSpeed = (Math.random() - 0.5) * 2; 

  const randomXOffset1 = -5 + Math.random() * 10; 
  const randomXOffset2 = -5 + Math.random() * 10; 

  const petalVariants: Variants = {
    initial: {
      y: -50, 
      x: `${randomXStart}vw`,
      opacity: 0,
      scale: randomScale,
      rotate: randomRotationSpeed * 360,
    },
    animate: {
      y: "110vh", 
      opacity: [0, 1, 1, 0], 
      rotate: 360 * randomRotationSpeed * 5, 
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
        repeat: Infinity, 
        ease: "linear",   
        opacity: {
          duration: randomDuration,
          times: [0, 0.1, 0.8, 1],
          repeat: Infinity
        },
        x: {
          duration: randomDuration,
          repeat: Infinity,
          ease: "easeInOut" 
        }
      },
    },
  };

  return (
    <motion.div
      variants={petalVariants}
      initial="initial"
      animate="animate"
      className="absolute top-0 pointer-events-none z-10" 
      style={{ width: '20px', height: '20px' }} 
    >
      <Image
        src="/images/petal.png" 
        alt="花びら"
        fill
        style={{ 
          objectFit: 'contain', 
          filter: 'brightness(0.65)' 
        }}
      />
    </motion.div>
  );
};

/**
 * ============================================================================
 * 🎞️ アニメーション設定 (Variants)
 * ============================================================================
 */
const bgAnimation: Variants = {
  animate: {
    scale: [1.0, 1.08, 1.0], 
    x: [0, -15, 0],          
    y: [0, 5, 0],            
    transition: {
      duration: 25,     
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  }
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3, 
      delayChildren: 0.5,   
    }
  }
};

const logoVariant: Variants = {
  hidden: { scale: 2.5, opacity: 0, y: -20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",  
      stiffness: 120,  
      damping: 12,     
      duration: 0.8
    }
  }
};

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
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 🎵 BGM用の状態管理
  const audioRef = useRef<HTMLAudioElement>(null);
  // 初期音量 (デフォルトは30%)
  const [volume, setVolume] = useState(0.3);

  // 初回マウント時の処理
  useEffect(() => {
    setIsClient(true); 

    // 1. セッションストレージを確認 (イントロ表示済みか？)
    const hasVisited = sessionStorage.getItem("visited_intro");
    if (hasVisited) {
      setShowIntro(false);
      setIsCheckComplete(true); 
    } else {
      setIsCheckComplete(true); 
    }

    // 2. ローカルストレージを確認 (音量設定があるか？)
    // SoundSettings.tsx で保存したキー 'shogi_bgm_volume' を読みに行きます
    const savedVolume = localStorage.getItem('shogi_bgm_volume');
    if (savedVolume) {
      // 0〜100で保存されているので、0.0〜1.0に変換
      const vol = Number(savedVolume) / 100;
      setVolume(vol);
      
      // すでにaudioタグがマウントされていれば適用
      if (audioRef.current) {
        audioRef.current.volume = vol;
      }
    }
  }, []);

  // 🎵 画面クリックで開始するハンドラ
  const handleStart = () => {
    if (audioRef.current) {
      // 保存された音量(volume)を適用して再生
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.log("再生エラー:", e));
    }

    setShowIntro(false);
    sessionStorage.setItem("visited_intro", "true");
  };

  // 🎵 再訪問時（showIntroがfalseの状態）の自動再生ロジック
  useEffect(() => {
    if (!showIntro && audioRef.current && audioRef.current.paused) {
      audioRef.current.volume = volume; // ここでも volume state を使う
      audioRef.current.play().catch((e) => {
        console.log("BGM autoplay prevented:", e);
      });
    }
  }, [showIntro, volume]); // volumeが変わった時も反映

  // 🌸 花びらの生成枚数
  const petalCount = 30;

  if (!isCheckComplete) {
    return <div className="min-h-svh w-full bg-black" />;
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden text-white font-serif">
      
      {/* 🎵 BGM用のaudio要素 */}
      <audio 
        ref={audioRef} 
        src="/sounds/野山.mp3" 
        loop 
        preload="auto"
      />

      {/* Layer 0: 背景画像エリア */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
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
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Layer 1: 花びらエフェクト */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {isClient && [...Array(petalCount)].map((_, i) => (
          <FloatingPetal key={i} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {showIntro ? (
          // 1️⃣ イントロ画面 (クリックでスタート)
          <motion.div
            key="intro-screen"
            onClick={handleStart} 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white cursor-pointer" 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }} 
          >
            <p className="text-black text-2xl md:text-4xl font-bold tracking-widest animate-pulse">
              created by 田中角行
            </p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-35 text-stone-400 text-xl md:text-2xl animate-bounce tracking-widest"
            >
               click to start
            </motion.p>
          </motion.div>

        ) : (
          // 2️⃣ メインコンテンツ
          <motion.main
            key="main-content"
            className="relative z-10 flex min-h-svh flex-col items-center py-8 px-4 md:px-8"
            variants={containerVariants} 
            initial="hidden"
            animate="visible"
          >

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
                      className="absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-105" 
                    />
                    <span className="sr-only">対局開始</span>
                    <span className="absolute inset-0 z-10 w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Link>
                </motion.div>
                
                {/* サブボタン */}
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

              </div> 
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}