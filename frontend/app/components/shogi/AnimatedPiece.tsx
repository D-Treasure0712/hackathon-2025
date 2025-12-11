'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
}

/**
 * シンプルなアニメーション方式
 * 全てtransitionで制御し、CSSアニメーションを使用しない
 */
export const AnimatedPiece: React.FC<AnimatedPieceProps> = ({
  animationState,
  pieceFolder,
  squareSize,
  onAnimationComplete,
}) => {
  // アニメーション状態: 'start' -> 'lifted' -> 'moved' -> 'landed'
  const [stage, setStage] = useState<'start' | 'lifted' | 'moved' | 'landed'>('start');
  
  // コールバックをrefに保存して依存配列問題を回避
  const onCompleteRef = useRef(onAnimationComplete);
  onCompleteRef.current = onAnimationComplete;

  // 各ステージでのスタイルを定義
  const getTransformStyle = () => {
    switch (stage) {
      case 'start':
        return {
          transform: 'scale(1) translateY(0)',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
        };
      case 'lifted':
        return {
          transform: 'scale(1.15) translateY(-12px)',
          filter: 'drop-shadow(0 12px 20px rgba(0, 0, 0, 0.35))',
        };
      case 'moved':
        return {
          transform: 'scale(1.15) translateY(-12px)',
          filter: 'drop-shadow(0 12px 20px rgba(0, 0, 0, 0.35))',
        };
      case 'landed':
        return {
          transform: 'scale(1) translateY(0)',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
        };
    }
  };

  // 位置を計算
  const getPosition = () => {
    if (stage === 'start' || stage === 'lifted') {
      return animationState.fromPosition;
    }
    return animationState.toPosition;
  };

  // アニメーションシーケンス（マウント時に1回だけ実行）
  useEffect(() => {
    const moveTime = animationState.isCapture ? 600 : 400;
    const totalTime = animationState.isCapture ? 1500 : 1000;

    // Stage 1: 浮き上がり（即座に開始）
    const liftTimer = setTimeout(() => {
      setStage('lifted');
    }, 10);

    // Stage 2: 移動開始（200ms後）
    const moveTimer = setTimeout(() => {
      setStage('moved');
    }, 200);

    // Stage 3: 着地（移動完了後）
    const landTimer = setTimeout(() => {
      setStage('landed');
    }, 200 + moveTime);

    // アニメーション完了（refからコールバックを呼び出し）
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, totalTime);

    return () => {
      clearTimeout(liftTimer);
      clearTimeout(moveTimer);
      clearTimeout(landTimer);
      clearTimeout(completeTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空の依存配列でマウント時のみ実行

  const position = getPosition();
  const transformStyle = getTransformStyle();
  const moveTime = animationState.isCapture ? 600 : 400;

  return (
    <div
      style={{
        position: 'absolute',
        width: squareSize,
        height: squareSize,
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 50,
        // 全てをtransitionで制御
        transition: stage === 'moved' || stage === 'landed'
          ? `left ${moveTime}ms ease-out, top ${moveTime}ms ease-out, transform 200ms ease-out, filter 200ms ease-out`
          : 'transform 200ms ease-out, filter 200ms ease-out',
        ...transformStyle,
      }}
    >
      <Image
        src={getPieceImagePath(pieceFolder, animationState.pieceKind, animationState.pieceColor)}
        alt="移動中の駒"
        fill
        className="object-contain"
        draggable={false}
      />
    </div>
  );
};

export default AnimatedPiece;
