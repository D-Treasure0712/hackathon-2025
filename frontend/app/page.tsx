"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

/**
 * ============================================================================
 * 🌸 FloatingPetal Component
 * ============================================================================
 */
const FloatingPetal = () => {
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
        `${randomXStart}vw`,
      ],
      transition: {
        duration: randomDuration,
        delay: randomDelay,
        repeat: Infinity,
        ease: "linear",
        opacity: {
          duration: randomDuration,
          times: [0, 0.1, 0.8, 1],
          repeat: Infinity,
        },
        x: {
          duration: randomDuration,
          repeat: Infinity,
          ease: "easeInOut",
        },
      },
    },
  };

  return (
    <motion.div
      variants={petalVariants}
      initial="initial"
      animate="animate"
      className="absolute top-0 pointer-events-none z-10"
      style={{ width: "20px", height: "20px" }}
    >
      <Image
        src="/images/petal.png"
        alt="花びら"
        fill
        style={{ objectFit: "contain", filter: "brightness(0.65)" }}
      />
    </motion.div>
  );
};

/**
 * ============================================================================
 * 🎞️ Animation Variants
 * ============================================================================
 */
const bgAnimation: Variants = {
  animate: {
    scale: [1.0, 1.05, 1.0],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const sentenceVariant: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.5, staggerChildren: 0.1 },
  },
};

const letterVariant: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const playerZoomOutVariant: Variants = {
  hidden: { scale: 2.4, opacity: 0, y: 50 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 3.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const logoImpactVariant: Variants = {
  hidden: { scale: 3, opacity: 0, rotate: -5 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      delay: 2.0,
      type: "spring",
      stiffness: 300,
      damping: 15,
      mass: 1.5,
      duration: 0.5,
    },
  },
};

const uiFadeInVariant: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 3.0, duration: 0.8, ease: "easeOut" },
  },
};

/**
 * ============================================================================
 * 🚀 Home Component
 * ============================================================================
 */
export default function Home() {
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.3);

  const quoteLine1 = "せっかく神様がいるのなら";
  const quoteLine2 = "１局、お手合わせをお願いしたい";

  // 初期化処理
  useEffect(() => {
    setIsClient(true);
    const hasVisited = sessionStorage.getItem("visited_intro");
    if (hasVisited) setShowIntro(false);
    setIsCheckComplete(true);

    const savedVolume = localStorage.getItem("shogi_bgm_volume");
    if (savedVolume) {
      setVolume(Number(savedVolume) / 100);
      if (audioRef.current) audioRef.current.volume = Number(savedVolume) / 100;
    }
  }, []);

  // スタート処理
  const handleStart = () => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.play().catch((e) => console.log(e));
    }
    setShowIntro(false);
    sessionStorage.setItem("visited_intro", "true");
  };

  // BGM自動再生制御
  useEffect(() => {
    if (!showIntro && audioRef.current && audioRef.current.paused) {
      audioRef.current.volume = volume;
      audioRef.current.play().catch((e) => console.log(e));
    }
  }, [showIntro, volume]);

  if (!isCheckComplete) return <div className="min-h-svh w-full bg-black" />;

  return (
    <div className="relative min-h-svh w-full overflow-hidden text-white font-serif">
      <audio ref={audioRef} src="/sounds/野山.mp3" loop preload="auto" />

      {/* --- Layer 0: 背景画像エリア --- */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <motion.div
          className="absolute inset-0 md:hidden"
          animate="animate"
          variants={bgAnimation}
        >
          <Image
            src="/images/mobile_title_background.png"
            alt="スマホ"
            fill
            priority
            style={{ objectFit: "cover" }}
            className="opacity-60 pointer-events-none"
          />
        </motion.div>
        <motion.div
          className="absolute inset-0 hidden md:block"
          animate="animate"
          variants={bgAnimation}
        >
          <Image
            src="/images/pc_title_background.png"
            alt="PC用背景画像"
            fill
            priority
            style={{ objectFit: "cover" }}
            className="opacity-60 pointer-events-none"
          />
        </motion.div>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* --- Layer 1: 花びらエフェクト --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {isClient && [...Array(30)].map((_, i) => <FloatingPetal key={i} />)}
      </div>

      <AnimatePresence>
        {showIntro ? (
          // ==============================================================
          // 1️⃣ イントロ画面
          // ==============================================================
          <motion.div
            key="intro-screen"
            onClick={handleStart}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
          >
            {/* 白い背景 */}
            <motion.div
              className="absolute inset-0 bg-white"
              exit={{
                opacity: 0,
                transition: { duration: 1.0, ease: "easeInOut" },
              }}
            />

            {/* コンテンツ（名言など） */}
            <motion.div
              className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center"
              exit={{
                opacity: 0,
                scale: 1.1,
                filter: "blur(4px)",
                transition: { duration: 3.0, ease: "easeOut" },
              }}
            >
              <div className="w-full space-y-8 text-black">
                <motion.div
                  variants={sentenceVariant}
                  initial="hidden"
                  animate="visible"
                  className="text-xl md:text-3xl font-medium leading-relaxed tracking-widest text-center md:text-left"
                >
                  <span className="inline-block">
                    {quoteLine1.split("").map((char, i) => (
                      <motion.span key={`l1-${i}`} variants={letterVariant}>
                        {char}
                      </motion.span>
                    ))}
                  </span>
                  <br className="md:hidden" />
                  <span className="inline-block md:ml-4">
                    {quoteLine2.split("").map((char, i) => (
                      <motion.span key={`l2-${i}`} variants={letterVariant}>
                        {char}
                      </motion.span>
                    ))}
                  </span>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.5, duration: 1 }}
                  className="text-lg md:text-2xl font-bold text-right tracking-widest"
                >
                  藤井聡太
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4.5, duration: 1 }}
                className="mt-24 md:mt-32 flex flex-col items-center gap-6"
              >
                <p className="text-sm md:text-base text-gray-500 tracking-wider">
                  created by 田中角行
                </p>
                <p className="text-xl md:text-2xl font-serif animate-pulse tracking-[0.2em] text-gray-800">
                  click to start
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          // ==============================================================
          // 2️⃣ メインコンテンツ
          // ==============================================================
          <motion.main
            key="main-content"
            className="relative z-10 flex min-h-svh w-full flex-col items-center py-4 px-4 md:px-8"
            initial="hidden"
            animate="visible"
          >
            {/* 左上: 設定ボタン (歯車画像) */}
            <motion.div
              className="absolute top-6 left-6 z-50 pointer-events-auto"
              variants={uiFadeInVariant}
            >
              <Link
                href="/settings"
                className="relative block w-12 h-12 md:w-16 md:h-16 transition-transform hover:rotate-90 duration-500 hover:scale-110"
              >
                <Image
                  src="/images/setting.png"
                  alt="設定"
                  fill
                  style={{ objectFit: "contain" }}
                  className="drop-shadow-md"
                />
              </Link>
            </motion.div>

            <div className="relative w-full max-w-7xl flex flex-col items-center justify-center flex-grow h-full min-h-[600px]">
              {/* タイトルロゴ */}
              <motion.div
                className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none md:-translate-x-[10%] translate-y-[-220px] md:translate-y-[-120px]"
                variants={logoImpactVariant}
              >
                <Image
                  src="/images/logo.png"
                  alt="ロゴ"
                  width={800}
                  height={400}
                  priority
                  className="w-[80vw] max-w-[600px] md:max-w-[500px] h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                  style={{ objectFit: "contain" }}
                />
              </motion.div>

              {/* 棋士画像 */}
              <motion.div
                className="relative z-10 w-[85vw] max-w-[500px] h-auto aspect-square md:w-[700px] md:h-[800px] md:-translate-x-[-40%] flex items-center justify-center overflow-visible translate-y-[50px] md:translate-y-[-120px]"
                variants={playerZoomOutVariant}
              >
                <Image
                  src="/images/ChessPlayer.png"
                  alt="棋士"
                  width={700}
                  height={800}
                  priority
                  className="object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]"
                />
              </motion.div>

              {/* 中央下: 対局開始ボタン & 藤井君とはボタン */}
              <motion.div
                className="absolute bottom-10 z-50 flex flex-col items-center gap-0 w-full pointer-events-auto"
                variants={uiFadeInVariant}
              >
                {/* 対局開始ボタン */}
                <Link
                  href="/game"
                  className="relative group w-90 h-30 md:w-100 md:h-70 translate-y-[-30px] md:translate-y-[-10px] transition-transform active:scale-95"
                >
                  <Image
                    src="/images/start-button.png"
                    alt="対局開始ボタン"
                    fill
                    style={{ objectFit: "contain" }}
                    className="drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all translate-y-[30px]"
                  />
                </Link>

                {/* 藤井君とはボタン */}
                <div className="w-full max-w-xs flex justify-center">
                  <Link
                    href="/hujiikuntoha"
                    className="
                      w-50 py-3 md:w-80 md:py-4
                      bg-slate-800/80 border border-slate-600 
                      text-slate-200 text-center rounded 
                      hover:bg-slate-700 transition-colors backdrop-blur-sm 
                      font-semibold tracking-wider
                      translate-y-[10px]
                      md:translate-y-[-40px]
                    "
                  >
                    藤井君とは
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}