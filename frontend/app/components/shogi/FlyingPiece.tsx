'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
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
 * CSS @keyframes + CSS変数を使用した弾き飛ばしアニメーション
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

  // ランダムな飛行方向（マウント時に固定）
  const flyDirection = useMemo(() => {
    const angle = -Math.PI / 3 + (Math.random() - 0.5) * Math.PI * 0.6;
    const distance = 180 + Math.random() * 120;
    return {
      x: Math.cos(angle) * distance * (Math.random() > 0.5 ? 1 : -1),
      y: Math.sin(angle) * distance - 80,
      rotate: (Math.random() - 0.5) * 540,
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="piece-flying"
      style={{
        position: 'absolute',
        left: startPosition.x,
        top: startPosition.y,
        width: squareSize,
        height: squareSize,
        pointerEvents: 'none',
        zIndex: 55,
        filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))',
        '--fly-x': `${flyDirection.x}px`,
        '--fly-y': `${flyDirection.y}px`,
        '--fly-rotate': `${flyDirection.rotate}deg`,
      } as React.CSSProperties}
    >
      <Image
        src={getPieceImagePath(pieceFolder, kind, color)}
        alt="弾き飛ばされる駒"
        fill
        className="object-contain"
        draggable={false}
      />
    </div>
  );
};

export default FlyingPiece;
