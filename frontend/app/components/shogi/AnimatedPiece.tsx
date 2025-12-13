'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PieceKind, Color, MoveAnimationState } from './types';

// 駒画像パスを取得する関数
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
  const prefix = color === 0 ? '0' : '1';
  const pieceKind = (kind === 'OU' && color === 1) ? 'GY' : kind;
  return `/pieces/${folder}/${prefix}${pieceKind}.svg`;
};

interface AnimatedPieceProps {
  animationState: MoveAnimationState;
  pieceFolder: string;
  squareSize: number;
  onAnimationComplete: () => void;
  onLanded?: () => void;
}

/**
 * framer-motion を使用したスムーズなスライドアニメーション
 * シンプルで高速な直線移動
 */
export const AnimatedPiece: React.FC<AnimatedPieceProps> = ({
  animationState,
  pieceFolder,
  squareSize,
  onAnimationComplete,
  onLanded,
}) => {
  const { fromPosition, toPosition, isCapture } = animationState;
  const onCompleteRef = useRef(onAnimationComplete);
  const onLandedRef = useRef(onLanded);
  onCompleteRef.current = onAnimationComplete;
  onLandedRef.current = onLanded;

  // 移動量を計算
  const moveX = toPosition.x - fromPosition.x;
  const moveY = toPosition.y - fromPosition.y;

  // 着地コールバック（アニメーションの80%時点）
  useEffect(() => {
    const landTimer = setTimeout(() => {
      if (onLandedRef.current) {
        onLandedRef.current();
      }
    }, 150);

    return () => clearTimeout(landTimer);
  }, []);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: fromPosition.x,
        top: fromPosition.y,
        width: squareSize,
        height: squareSize,
        pointerEvents: 'none',
        zIndex: 50,
        filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))',
      }}
      initial={{
        x: 0,
        y: 0,
        scale: 1,
      }}
      animate={{
        x: moveX,
        y: moveY,
        scale: 1.05, // 少し大きくなる
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
        mass: 0.6,
      }}
      onAnimationComplete={() => {
        onCompleteRef.current();
      }}
    >
      <Image
        src={getPieceImagePath(pieceFolder, animationState.pieceKind, animationState.pieceColor)}
        alt="移動中の駒"
        fill
        className="object-contain"
        draggable={false}
        priority
      />
    </motion.div>
  );
};

export default AnimatedPiece;
