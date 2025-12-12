'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

interface ExplosionEffectProps {
  position: { x: number; y: number };
  squareSize: number;
  onComplete: () => void;
}

/**
 * 爆発エフェクト + ひび割れ演出
 * 生成した画像を使用した派手なエフェクト
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
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const centerX = position.x + squareSize / 2;
  const centerY = position.y + squareSize / 2;
  
  // エフェクトのサイズ
  const explosionSize = squareSize * 2.5;
  const crackSize = squareSize * 3;

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
      {/* ひび割れエフェクト（SVG） */}
      <div
        className="crack-effect"
        style={{
          position: 'absolute',
          left: centerX - crackSize / 2,
          top: centerY - crackSize / 2,
          width: crackSize,
          height: crackSize,
          // 乗算合成できれいに黒だけ残す
          mixBlendMode: 'multiply',
          opacity: 0.7,
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
      </div>

      {/* 爆発エフェクト（CSSのみで描画） - 画像不使用で枠問題を解決 */}
      <div
        className="explosion-image"
        style={{
          position: 'absolute',
          left: centerX - explosionSize / 2,
          top: centerY - explosionSize / 2,
          width: explosionSize,
          height: explosionSize,
          borderRadius: '50%',
          mixBlendMode: 'screen', // 光の合成
          // コア、内炎、外炎の3層グラデーション
          background: `
            radial-gradient(circle, rgba(255,255,200,1) 0%, rgba(255,200,50,0.8) 25%, rgba(255,50,0,0) 60%),
            radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,100,0,0) 40%)
          `,
          // 強烈な発光表現
          boxShadow: `
            0 0 20px 10px rgba(255, 100, 0, 0.4),
            0 0 40px 20px rgba(255, 50, 0, 0.2),
            inset 0 0 30px 15px rgba(255, 200, 50, 0.6)
          `,
          filter: 'contrast(1.2) brightness(1.3)',
        }}
      />

      {/* 衝撃波リング1（細く鋭く） */}
      <div
        className="explosion-ring"
        style={{
          position: 'absolute',
          left: centerX - squareSize / 2,
          top: centerY - squareSize / 2,
          width: squareSize,
          height: squareSize,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 100, 0.8)', // 枠を目立たなく細く
          boxShadow: '0 0 15px rgba(255, 150, 50, 0.6)',
        }}
      />

      {/* 衝撃波リング2（時間差） */}
      <div
        className="explosion-ring-2"
        style={{
          position: 'absolute',
          left: centerX - squareSize / 2,
          top: centerY - squareSize / 2,
          width: squareSize,
          height: squareSize,
          borderRadius: '50%',
          border: '1px solid rgba(255, 100, 50, 0.6)',
          boxShadow: '0 0 10px rgba(255, 100, 50, 0.4)',
        }}
      />

      {/* 中央フラッシュ */}
      <div
        className="explosion-flash"
        style={{
          position: 'absolute',
          left: centerX - squareSize * 0.4,
          top: centerY - squareSize * 0.4,
          width: squareSize * 0.8,
          height: squareSize * 0.8,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export default ExplosionEffect;
