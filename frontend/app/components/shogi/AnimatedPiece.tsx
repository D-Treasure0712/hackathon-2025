'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
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
 * シンプルで軽量な駒移動アニメーション
 * CSSアニメーションのみで制御、Reactの再レンダリングを最小限に
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
  
  // アニメーション時間（短めでスムーズに）
  const duration = isCapture ? 0.9 : 0.8;

  // タイマーをセットアップ
  useEffect(() => {
    // 着地タイミング（75%時点）
    const landingTime = duration * 0.75 * 1000;
    const landTimer = setTimeout(() => {
      if (onLandedRef.current) {
        onLandedRef.current();
      }
    }, landingTime);

    // アニメーション完了
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, duration * 1000 + 30);

    return () => {
      clearTimeout(landTimer);
      clearTimeout(completeTimer);
    };
  }, [duration]);

  return (
    <div
      className="piece-moving"
      style={{
        position: 'absolute',
        left: fromPosition.x,
        top: fromPosition.y,
        width: squareSize,
        height: squareSize,
        pointerEvents: 'none',
        zIndex: 50,
        filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35))',
        '--move-x': `${moveX}px`,
        '--move-y': `${moveY}px`,
        '--move-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      <Image
        src={getPieceImagePath(pieceFolder, animationState.pieceKind, animationState.pieceColor)}
        alt="移動中の駒"
        fill
        className="object-contain"
        draggable={false}
        priority
      />
    </div>
  );
};

export default AnimatedPiece;
