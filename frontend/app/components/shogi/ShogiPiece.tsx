/**
 * ShogiPiece コンポーネント
 * 将棋の駒を画像で表示するコンポーネント
 * 
 * 機能:
 * - 駒の画像表示（SVG/PNG対応）
 * - 先手/後手の向き対応（先手は180度回転）
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { PieceType, Player } from './types';
import { PIECE_IMAGE_PATHS, GOTE_KING_IMAGE_PATH } from './constants';

// =====================================
// Props定義
// =====================================

export interface ShogiPieceProps {
  /** 駒の種類 */
  type: PieceType;
  /** 所有者（先手/後手） */
  owner: Player;
  /** 追加のCSSクラス（オプション） */
  className?: string;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 将棋の駒を画像で表示するコンポーネント
 */
export const ShogiPiece: React.FC<ShogiPieceProps> = ({
  type,
  owner,
  className = '',
}) => {
  // 画像パスを取得
  // 後手の玉は「王」の画像を使用
  const imagePath = 
    type === 'king' && owner === 'gote'
      ? GOTE_KING_IMAGE_PATH
      : PIECE_IMAGE_PATHS[type];

  // 先手の駒は180度回転（SVG画像が後手向きで描かれているため）
  const isSente = owner === 'sente';

  return (
    <div
      className={`
        flex items-center justify-center
        w-full h-full
        select-none
        ${isSente ? 'rotate-180' : ''}
        ${className}
      `}
      data-piece-type={type}
      data-piece-owner={owner}
    >
      <Image
        src={imagePath}
        alt={type}
        width={40}
        height={40}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
};

export default ShogiPiece;
