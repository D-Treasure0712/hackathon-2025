'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ExplosionEffectProps {
  position: { x: number; y: number };
  squareSize: number;
  onComplete: () => void;
}

/**
 * framer-motion を使用した派手な爆発エフェクト
 * 衝撃波リング + フラッシュ + パーティクル
 */
export const ExplosionEffect: React.FC<ExplosionEffectProps> = ({
  position,
  squareSize,
  onComplete,
}) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const centerX = position.x + squareSize / 2;
  const centerY = position.y + squareSize / 2;

  // パーティクルの生成（ランダム方向）
  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 60 + Math.random() * 80;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 4 + Math.random() * 6,
        delay: Math.random() * 0.05,
      };
    });
  }, []);

  // スパークの生成
  const sparks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const distance = 80 + Math.random() * 100;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 0.08,
      };
    });
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 48,
        overflow: 'visible',
      }}
    >
      {/* ひび割れエフェクト */}
      <motion.div
        style={{
          position: 'absolute',
          left: centerX - squareSize * 1.8,
          top: centerY - squareSize * 1.8,
          width: squareSize * 3.6,
          height: squareSize * 3.6,
          mixBlendMode: 'multiply',
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{
          scale: [0.4, 1, 1.05],
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: 0.6,
          times: [0, 0.15, 1],
          ease: 'easeOut',
        }}
      >
        <Image
          src={`/images/crack.svg?t=${Date.now()}`}
          alt="ひび割れ"
          fill
          className="object-contain"
          draggable={false}
          unoptimized
        />
      </motion.div>

      {/* メイン爆発フラッシュ */}
      <motion.div
        style={{
          position: 'absolute',
          left: centerX - squareSize * 2,
          top: centerY - squareSize * 2,
          width: squareSize * 4,
          height: squareSize * 4,
          borderRadius: '50%',
          background: `
            radial-gradient(circle, rgba(255,255,220,1) 0%, rgba(255,220,100,0.9) 20%, rgba(255,100,0,0.6) 50%, transparent 70%)
          `,
          mixBlendMode: 'screen',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.3, 1.5],
          opacity: [1, 0.95, 0],
        }}
        transition={{
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1], // easeOutExpo
        }}
      />

      {/* 衝撃波リング1 */}
      <motion.div
        style={{
          position: 'absolute',
          left: centerX - squareSize * 0.5,
          top: centerY - squareSize * 0.5,
          width: squareSize,
          height: squareSize,
          borderRadius: '50%',
          border: '3px solid rgba(255, 200, 100, 0.9)',
          boxShadow: '0 0 20px rgba(255, 150, 50, 0.8), inset 0 0 10px rgba(255, 200, 100, 0.4)',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: 6,
          opacity: 0,
        }}
        transition={{
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* 衝撃波リング2（時間差） */}
      <motion.div
        style={{
          position: 'absolute',
          left: centerX - squareSize * 0.5,
          top: centerY - squareSize * 0.5,
          width: squareSize,
          height: squareSize,
          borderRadius: '50%',
          border: '2px solid rgba(255, 100, 50, 0.7)',
          boxShadow: '0 0 15px rgba(255, 100, 50, 0.5)',
        }}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{
          scale: 8,
          opacity: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.03,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* パーティクル（火花） */}
      {particles.map((particle, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: centerX - particle.size / 2,
            top: centerY - particle.size / 2,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff 0%, #ffa500 50%, #ff4500 100%)',
            boxShadow: '0 0 6px rgba(255, 150, 50, 0.8)',
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: particle.x,
            y: particle.y,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.4,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* スパーク（細い光線） */}
      {sparks.map((spark, i) => (
        <motion.div
          key={`spark-${i}`}
          style={{
            position: 'absolute',
            left: centerX - spark.size / 2,
            top: centerY - spark.size / 2,
            width: spark.size,
            height: spark.size,
            borderRadius: '50%',
            background: '#ffffcc',
            boxShadow: '0 0 4px #ffff00',
          }}
          initial={{ x: 0, y: 0, scale: 1.5, opacity: 1 }}
          animate={{
            x: spark.x,
            y: spark.y,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.3,
            delay: spark.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* 中央フラッシュ */}
      <motion.div
        style={{
          position: 'absolute',
          left: centerX - squareSize * 0.6,
          top: centerY - squareSize * 0.6,
          width: squareSize * 1.2,
          height: squareSize * 1.2,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
          mixBlendMode: 'screen',
        }}
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{
          scale: [0.3, 2, 3],
          opacity: [1, 0.8, 0],
        }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </div>
  );
};

export default ExplosionEffect;
