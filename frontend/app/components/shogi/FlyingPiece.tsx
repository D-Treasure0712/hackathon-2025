'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PieceKind, Color } from './types';

// 駒画像パスを取得する関数
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
  const prefix = color === 0 ? '0' : '1';
  const pieceKind = (kind === 'OU' && color === 1) ? 'GY' : kind;
  return `/pieces/${folder}/${prefix}${pieceKind}.svg`;
};

interface FlyingPieceProps {
  kind: PieceKind;
  color: Color;
  pieceFolder: string;
  startPosition: { x: number; y: number };
  squareSize: number;
  onComplete: () => void;
}

/**
 * framer-motion を使用した派手な弾き飛ばしアニメーション
 * ランダムな方向に回転しながら飛んでいく
 */
export const FlyingPiece: React.FC<FlyingPieceProps> = ({
  kind,
  color,
  pieceFolder,
  startPosition,
  squareSize,
  onComplete,
}) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ランダムな飛行方向（マウント時に固定）- 超派手に
  const flyDirection = useMemo(() => {
    const angle = -Math.PI / 3 + (Math.random() - 0.5) * Math.PI * 0.9;
    const distance = 280 + Math.random() * 200;
    const direction = Math.random() > 0.5 ? 1 : -1;
    return {
      x: Math.cos(angle) * distance * direction,
      y: Math.sin(angle) * distance - 150,
      rotate: (Math.random() - 0.5) * 900, // 最大2.5回転
      rotateX: Math.random() * 60 - 30, // 3D回転
      rotateY: Math.random() * 60 - 30,
    };
  }, []);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: startPosition.x,
        top: startPosition.y,
        width: squareSize,
        height: squareSize,
        pointerEvents: 'none',
        zIndex: 55,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      initial={{
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        opacity: 1,
        filter: 'brightness(1) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))',
      }}
      animate={{
        x: flyDirection.x,
        y: flyDirection.y,
        scale: [1, 1.8, 3.5],
        rotate: flyDirection.rotate,
        opacity: [1, 1, 0],
        filter: [
          'brightness(1) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))',
          'brightness(1.8) drop-shadow(0 15px 30px rgba(255, 100, 50, 0.6))',
          'brightness(0.3) drop-shadow(0 0 0 transparent)',
        ],
      }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1], // easeOutQuint
        opacity: { times: [0, 0.4, 1] },
        scale: { times: [0, 0.3, 1] },
      }}
      onAnimationComplete={() => {
        onCompleteRef.current();
      }}
    >
      <Image
        src={getPieceImagePath(pieceFolder, kind, color)}
        alt="弾き飛ばされる駒"
        fill
        className="object-contain"
        draggable={false}
      />
    </motion.div>
  );
};

export default FlyingPiece;
