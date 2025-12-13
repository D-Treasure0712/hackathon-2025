'use client';

/**
 * PieceStand コンポーネント
 * 持ち駒（駒台）を表示するコンポーネント
 */

import React from 'react';
import { CapturedPieces, HandPieceType, Player } from './types';
import { PIECE_DISPLAY_NAMES } from './constants';

export interface PieceStandProps {
    /** 持ち駒の状態 */
    capturedPieces: CapturedPieces;
    /** 所有者（先手/後手） */
    owner: Player;
    /** 選択中の駒 */
    selectedPiece?: HandPieceType | null;
    /** 駒クリック時のコールバック */
    onPieceClick?: (pieceType: HandPieceType) => void;
    /** インタラクティブかどうか */
    interactive?: boolean;
}

// 駒の表示順序（価値の高い順）
const PIECE_ORDER: HandPieceType[] = [
    'rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'
];

export const PieceStand: React.FC<PieceStandProps> = ({
    capturedPieces,
    owner,
    selectedPiece = null,
    onPieceClick,
    interactive = false,
}) => {
    const handlePieceClick = (pieceType: HandPieceType) => {
        if (interactive && onPieceClick && capturedPieces[pieceType] > 0) {
            onPieceClick(pieceType);
        }
    };

    const isGote = owner === 'gote';

    return (
        <div
            className={`
        flex flex-col gap-1 p-2
        bg-amber-50 dark:bg-amber-800
        border-2 border-amber-700 dark:border-amber-500
        rounded-lg
        min-w-[60px]
        ${isGote ? 'rotate-180' : ''}
      `}
        >
            {/* タイトル */}
            <div className={`text-xs font-bold text-center text-amber-800 dark:text-amber-200 ${isGote ? 'rotate-180' : ''}`}>
                {owner === 'sente' ? '☗ 先手' : '☖ 後手'}
            </div>

            {/* 持ち駒一覧 */}
            <div className={`flex flex-col gap-0.5 ${isGote ? 'rotate-180' : ''}`}>
                {PIECE_ORDER.map(pieceType => {
                    const count = capturedPieces[pieceType];
                    if (count === 0) return null;

                    const isSelected = selectedPiece === pieceType;

                    return (
                        <div
                            key={pieceType}
                            className={`
                flex items-center justify-between gap-1
                px-1 py-0.5 rounded
                text-sm font-bold
                ${isSelected ? 'bg-green-300 dark:bg-green-400 ring-2 ring-green-500' :
                                    interactive ? 'hover:bg-amber-200 dark:hover:bg-amber-600 cursor-pointer' : ''}
                ${isGote ? 'text-red-700 dark:text-red-400' : 'text-black dark:text-gray-800'}
                transition-colors
              `}
                            onClick={() => handlePieceClick(pieceType)}
                        >
                            <span>{PIECE_DISPLAY_NAMES[pieceType]}</span>
                            {count > 1 && (
                                <span className="text-xs text-amber-600 dark:text-amber-300">{count}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 持ち駒がない場合 */}
            {PIECE_ORDER.every(p => capturedPieces[p] === 0) && (
                <div className={`text-xs text-center text-amber-400 dark:text-amber-500 ${isGote ? 'rotate-180' : ''}`}>
                    なし
                </div>
            )}
        </div>
    );
};

export default PieceStand;
