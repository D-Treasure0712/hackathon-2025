/**
 * ShogiPiece コンポーネント
 * 将棋の駒を表示するコンポーネント
 * 
 * 機能:
 * - 駒の種類に応じた文字表示
 * - 先手/後手の向き対応（後手は180度回転）
 * - 成り駒は赤系の色で表示
 */

import React from 'react';
import { PieceType, Player } from './types';
import { PIECE_DISPLAY_NAMES, GOTE_KING_DISPLAY, isPromoted } from './constants';

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
 * 将棋の駒を表示するコンポーネント
 * 
 * @example
 * // 先手の歩
 * <ShogiPiece type="pawn" owner="sente" />
 * 
 * @example
 * // 後手の龍（成り飛車）
 * <ShogiPiece type="dragon" owner="gote" />
 */
export const ShogiPiece: React.FC<ShogiPieceProps> = ({
  type,
  owner,
  className = '',
}) => {
  // 表示する文字を取得
  // 後手の玉は「王」として表示
  const displayName = 
    type === 'king' && owner === 'gote'
      ? GOTE_KING_DISPLAY
      : PIECE_DISPLAY_NAMES[type];

  // 成り駒かどうか
  const promoted = isPromoted(type);

  // 後手の駒は180度回転
  const isGote = owner === 'gote';

  return (
    <div
      className={`
        flex items-center justify-center
        w-full h-full
        text-lg sm:text-xl md:text-2xl
        font-bold
        select-none
        ${promoted ? 'text-red-600' : 'text-zinc-900 dark:text-zinc-100'}
        ${isGote ? 'rotate-180' : ''}
        ${className}
      `}
      data-piece-type={type}
      data-piece-owner={owner}
    >
      {/* 
        駒の文字表示
        将来的に画像に置き換える場合はここを修正
      */}
      <span className="leading-none">
        {displayName}
      </span>
    </div>
  );
};

export default ShogiPiece;
