'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PieceKind, Color } from './types';

// =====================================
// 駒画像パスを取得する関数
// =====================================
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
  const prefix = color === 0 ? '0' : '1';
  const pieceKind = (kind === 'OU' && color === 1) ? 'GY' : kind;
  return `/pieces/${folder}/${prefix}${pieceKind}.svg`;
};

// =====================================
// Props定義
// =====================================
interface FlyingPieceProps {
  /** 弾き飛ばされる駒の種類 */
  kind: PieceKind;
  /** 駒の所有者 */
  color: Color;
  /** 使用する駒画像フォルダ */
  pieceFolder: string;
  /** 開始位置（ピクセル座標） */
  startPosition: { x: number; y: number };
  /** 1マスのピクセルサイズ */
  squareSize: number;
  /** アニメーション完了時のコールバック */
  onComplete: () => void;
}

// =====================================
// FlyingPiece コンポーネント
// 取られた駒がランダムな方向に弾き飛ばされるアニメーション
// =====================================
export const FlyingPiece: React.FC<FlyingPieceProps> = ({
  kind,
  color,
  pieceFolder,
  startPosition,
  squareSize,
  onComplete,
}) => {
  // 弾き飛ばされる方向をランダムに決定（初回マウント時のみ）
  const [flyDirection] = useState(() => {
    // 360度からランダムな角度
    const angle = Math.random() * Math.PI * 2;
    // 飛ぶ距離（80〜140px）
    const distance = 80 + Math.random() * 60;
    return {
      x: Math.cos(angle) * distance,
      // 少し上方向に飛ばすためマイナス50
      y: Math.sin(angle) * distance - 50,
      // 回転角度（-45度〜45度）
      rotate: (Math.random() - 0.5) * 90,
    };
  });

  // アニメーション完了後にコールバック
  useEffect(() => {
    const timer = setTimeout(onComplete, 400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="absolute pointer-events-none z-40 animate-fly-away"
      style={{
        width: squareSize,
        height: squareSize,
        left: startPosition.x,
        top: startPosition.y,
        // CSS変数でランダムな方向を設定
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
