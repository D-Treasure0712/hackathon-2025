/**
 * CapturedPieces コンポーネント
 * 持ち駒を表示するコンポーネント
 */

'use client';

import React from 'react';
import { Hand, Piece, PieceType } from './hooks/useJShogi';

// =====================================
// 駒の表示名マッピング
// =====================================

const PIECE_DISPLAY: Record<PieceType, string> = {
  'oushou': '王',
  'gyokushou': '玉',
  'hisha': '飛',
  'kakugyou': '角',
  'kinshou': '金',
  'ginshou': '銀',
  'keima': '桂',
  'kyousha': '香',
  'fuhyou': '歩',
  'ryuuou': '龍',
  'ryuuma': '馬',
  'narigin': '全',
  'narikei': '圭',
  'narikyou': '杏',
  'tokin': 'と',
};

// 持ち駒の表示順序（重要度順）
const PIECE_ORDER: PieceType[] = ['hisha', 'kakugyou', 'kinshou', 'ginshou', 'keima', 'kyousha', 'fuhyou'];

// =====================================
// Props定義
// =====================================

export interface CapturedPiecesProps {
  /** 持ち駒データ */
  hand: Hand;
  /** 選択中の持ち駒ID */
  selectedPieceId: number | null;
  /** 持ち駒クリック時のコールバック */
  onPieceClick: (pieceId: number) => void;
  /** このプレイヤーの手番かどうか */
  isCurrentTurn: boolean;
  /** 表示位置（先手/後手で配置が変わる） */
  position: 'left' | 'right';
}

// =====================================
// コンポーネント
// =====================================

/**
 * 持ち駒一覧を表示するコンポーネント
 */
export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  hand,
  selectedPieceId,
  onPieceClick,
  isCurrentTurn,
  position,
}) => {
  // 持ち駒を種類ごとにグループ化
  const groupedPieces = PIECE_ORDER.reduce((acc, type) => {
    const pieces = hand.pieces.filter(p => p.type === type);
    if (pieces.length > 0) {
      acc.push({ type, pieces });
    }
    return acc;
  }, [] as { type: PieceType; pieces: Piece[] }[]);

  const isGote = hand.player_number === 2;

  return (
    <div
      className={`
        flex flex-col gap-1 p-2
        bg-amber-50 dark:bg-amber-950
        border border-amber-300 dark:border-amber-700
        rounded-lg
        min-w-[60px] sm:min-w-[80px]
        ${isGote ? 'rotate-180' : ''}
      `}
    >
      {/* プレイヤー表示 */}
      <div className={`
        text-xs sm:text-sm font-bold text-center
        ${isGote ? 'rotate-180' : ''}
        ${isCurrentTurn ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}
      `}>
        {isGote ? '後手' : '先手'}
      </div>

      {/* 持ち駒一覧 */}
      <div className={`flex flex-col gap-1 ${isGote ? 'rotate-180' : ''}`}>
        {groupedPieces.length === 0 ? (
          <div className="text-xs text-zinc-400 text-center py-2">なし</div>
        ) : (
          groupedPieces.map(({ type, pieces }) => (
            <button
              key={type}
              onClick={() => isCurrentTurn && onPieceClick(pieces[0].id)}
              disabled={!isCurrentTurn}
              className={`
                flex items-center justify-center gap-1
                px-2 py-1 rounded
                text-sm sm:text-base font-bold
                transition-colors
                ${selectedPieceId && pieces.some(p => p.id === selectedPieceId)
                  ? 'bg-blue-500 text-white'
                  : isCurrentTurn
                    ? 'bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 cursor-pointer'
                    : 'bg-amber-100 dark:bg-amber-800 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <span>{PIECE_DISPLAY[type]}</span>
              {pieces.length > 1 && (
                <span className="text-xs">×{pieces.length}</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CapturedPieces;
