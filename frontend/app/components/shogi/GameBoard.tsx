/**
 * GameBoard コンポーネント
 * 対局用の将棋盤（クリック操作対応）
 * 
 * 機能:
 * - 9x9のグリッド表示
 * - 駒選択・移動のクリック操作
 * - 選択状態のハイライト
 */

'use client';

import React from 'react';
import { Square, PlayerNumber, PieceType } from './hooks/useJShogi';

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

// 成り駒かどうか
const PROMOTED_TYPES: PieceType[] = ['ryuuou', 'ryuuma', 'narigin', 'narikei', 'narikyou', 'tokin'];

// =====================================
// Props定義
// =====================================

export interface GameBoardProps {
  /** 盤面マス配列 */
  squares: Square[];
  /** 現在の手番 */
  currentPlayer: PlayerNumber;
  /** 選択中のマスID */
  selectedSquareId: string | null;
  /** 最後の移動先マスID */
  lastMoveToSquareId: string | null;
  /** マスクリック時のコールバック */
  onSquareClick: (squareId: string) => void;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 対局用将棋盤コンポーネント
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  squares,
  currentPlayer,
  selectedSquareId,
  lastMoveToSquareId,
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
      {/* 盤面サイズ調整 */}
      <div
        className="
          aspect-square
          bg-amber-100 dark:bg-amber-900
          border-2 border-amber-800 dark:border-amber-600
          p-1
        "
        style={{
          width: 'min(85vw, 60vh)',
          maxWidth: '100%',
        }}
      >
        {/* 9x9グリッド */}
        <div
          className="
            grid
            grid-cols-9
            grid-rows-9
            w-full h-full
            gap-px
            bg-amber-800 dark:bg-amber-600
          "
        >
          {board.map((row, y) =>
            row.map((square, x) => {
              if (!square) return <div key={`${y}-${x}`} className="bg-amber-100" />;

              const piece = square.piece;
              const isSelected = selectedSquareId === square.id;
              const isLastMove = lastMoveToSquareId === square.id;
              const isCurrentPlayerPiece = piece && piece.player_number === currentPlayer;
              const isPromoted = piece && PROMOTED_TYPES.includes(piece.type);
              const isGote = piece && piece.player_number === 2;

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
                    ${isSelected
                      ? 'bg-blue-300 dark:bg-blue-600'
                      : isLastMove
                        ? 'bg-yellow-200 dark:bg-yellow-700'
                        : 'bg-amber-100 dark:bg-amber-200'
                    }
                    ${isCurrentPlayerPiece ? 'cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-300' : 'cursor-pointer'}
                  `}
                  data-square-id={square.id}
                >
                  {piece && (
                    <span
                      className={`
                        ${isPromoted ? 'text-red-600' : 'text-zinc-900'}
                        ${isGote ? 'rotate-180' : ''}
                        inline-block
                      `}
                    >
                      {PIECE_DISPLAY[piece.type]}
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
