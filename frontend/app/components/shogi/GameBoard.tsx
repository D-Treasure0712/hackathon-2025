'use client';

import React from 'react';
import { Square, PieceKind, Color } from './types'; // typesからインポート

// =====================================
// 駒の表示名マッピング (shogi.js対応)
// =====================================

const PIECE_DISPLAY: Record<PieceKind, string> = {
  'FU': '歩',
  'KY': '香',
  'KE': '桂',
  'GI': '銀',
  'KI': '金',
  'OU': '王', // ライブラリによっては玉/王の区別がない場合がある。一旦「王」で統一か、後手の時だけ「玉」にするロジックを組む
  'HI': '飛',
  'KA': '角',
  'TO': 'と',
  'NY': '杏',
  'NK': '圭',
  'NG': '全',
  'RY': '龍',
  'UM': '馬',
};

// 成り駒かどうか
const PROMOTED_TYPES: PieceKind[] = ['TO', 'NY', 'NK', 'NG', 'RY', 'UM'];

// =====================================
// Props定義
// =====================================

export interface GameBoardProps {
  squares: Square[];
  currentPlayer: Color; // PlayerNumber(1|2) -> Color(0|1)
  selectedSquareId: string | null;
  lastMoveToSquareId: string | null;
  availableMoves: Set<string>; // 移動可能なマスのIDセット
  onSquareClick: (squareId: string) => void;
}

// =====================================
// コンポーネント
// =====================================

export const GameBoard: React.FC<GameBoardProps> = ({
  squares,
  currentPlayer,
  selectedSquareId,
  lastMoveToSquareId,
  availableMoves,
  onSquareClick,
}) => {
  // 盤面を2次元配列に変換（y: 0-8, x: 0-8）
  const board: (Square | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
  squares.forEach(sq => {
    if (sq.y >= 0 && sq.y < 9 && sq.x >= 0 && sq.x < 9) {
      board[sq.y][sq.x] = sq;
    }
  });

  return (
    <div className="flex flex-col items-center">
      <div
        className="aspect-square bg-amber-100 dark:bg-amber-900 border-2 border-amber-800 dark:border-amber-600 p-1"
        style={{
          width: 'min(85vw, 60vh)',
          maxWidth: '100%',
        }}
      >
        <div className="grid grid-cols-9 grid-rows-9 w-full h-full gap-px bg-amber-800 dark:bg-amber-600">
          {board.map((row, y) =>
            row.map((square, x) => {
              if (!square) return <div key={`${y}-${x}`} className="bg-amber-100" />;

              const piece = square.piece;
              const isSelected = selectedSquareId === square.id;
              const isLastMove = lastMoveToSquareId === square.id;
              const isAvailable = availableMoves.has(square.id); // 移動可能範囲かどうか
              const isCurrentPlayerPiece = piece && piece.color === currentPlayer;
              const isPromoted = piece && PROMOTED_TYPES.includes(piece.kind);
              const isGote = piece && piece.color === 1; // 1 = White/Gote

              return (
                <button
                  key={square.id}
                  onClick={() => onSquareClick(square.id)}
                  className={`
                    flex items-center justify-center
                    aspect-square
                    text-sm sm:text-base md:text-lg lg:text-xl
                    font-bold
                    transition-colors
                    relative
                    ${isSelected
                      ? 'bg-blue-300 dark:bg-blue-600'
                      : isLastMove
                        ? 'bg-yellow-200 dark:bg-yellow-700'
                        : isAvailable
                          ? 'bg-green-100 dark:bg-green-900/40' // 移動可能マスの背景
                          : 'bg-amber-100 dark:bg-amber-200'
                    }
                    ${isCurrentPlayerPiece ? 'cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-300' : 'cursor-pointer'}
                  `}
                  data-square-id={square.id}
                >
                  {/* 移動可能マーク */}
                  {isAvailable && !piece && (
                    <div className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/50" />
                  )}
                  {isAvailable && piece && (
                    <div className="absolute inset-0 border-2 border-green-500/50 rounded-sm" />
                  )}

                  {piece && (
                    <span
                      className={`
                        ${isPromoted ? 'text-red-600' : 'text-zinc-900'}
                        ${isGote ? 'rotate-180' : ''}
                        inline-block
                      `}
                    >
                      {PIECE_DISPLAY[piece.kind]}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
