'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Square, PieceKind, Color } from './types';

// =====================================
// 駒画像のフォルダとボード画像の定義（エクスポート）
// =====================================

// 駒画像フォルダ（3つからランダム選択用）
export const PIECE_FOLDERS = [
  'kanji_brown',
  'kanji_light',
  'kanji_light_3D_OTB',
];

// ボード背景画像（7つからランダム選択用）
export const BOARD_BACKGROUNDS = [
  '/gameboard/tile_wood1.png',
  '/gameboard/tile_wood2.png',
  '/gameboard/tile_wood3.png',
  '/gameboard/tile_wood4.png',
  '/gameboard/tile_wood5.png',
  '/gameboard/tile_wood6.png',
  '/gameboard/tile_stone.png',
];

// 駒の種類から画像ファイル名へのマッピング
// SVGファイル命名規則: 0XX.svg(上向き/先手用), 1XX.svg(下向き/後手用)
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
  // color: 0 = Black/Sente(先手/下側), 1 = White/Gote(後手/上側)
  // 画像ファイル: 0 = 上向き(先手用), 1 = 下向き(後手用)
  const prefix = color === 0 ? '0' : '1';
  
  // 後手の王は「玉」(GY)の画像を使用
  const pieceKind = (kind === 'OU' && color === 1) ? 'GY' : kind;
  
  return `/pieces/${folder}/${prefix}${pieceKind}.svg`;
};

// 駒の表示名（フォールバック用）
const PIECE_DISPLAY: Record<PieceKind, string> = {
  'FU': '歩', 'KY': '香', 'KE': '桂', 'GI': '銀',
  'KI': '金', 'OU': '王', 'HI': '飛', 'KA': '角',
  'TO': 'と', 'NY': '杏', 'NK': '圭', 'NG': '全',
  'RY': '龍', 'UM': '馬',
};

// =====================================
// Props定義
// =====================================

export interface GameBoardProps {
  squares: Square[];
  currentPlayer: Color;
  selectedSquareId: string | null;
  lastMoveToSquareId: string | null;
  availableMoves: Set<string>;
  onSquareClick: (squareId: string) => void;
  // テーマ設定（親から渡される）
  pieceFolder: string;
  boardBackground: string;
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
  pieceFolder,
  boardBackground,
}) => {
  // 盤面を2次元配列に変換
  const board: (Square | null)[][] = useMemo(() => {
    const b: (Square | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    squares.forEach(sq => {
      if (sq.y >= 0 && sq.y < 9 && sq.x >= 0 && sq.x < 9) {
        b[sq.y][sq.x] = sq;
      }
    });
    return b;
  }, [squares]);

  return (
    <div className="flex flex-col items-center">
      {/* 盤面コンテナ */}
      <div
        className="aspect-square border-2 border-black p-0.5"
        style={{
          width: 'min(85vw, 60vh)',
          maxWidth: '100%',
          backgroundImage: `url(${boardBackground})`,
          backgroundSize: 'cover',
        }}
      >
        {/* 9x9グリッド */}
        <div className="grid grid-cols-9 grid-rows-9 w-full h-full gap-px bg-black">
          {board.map((row, y) =>
            row.map((square, x) => {
              if (!square) {
                return (
                  <div
                    key={`${y}-${x}`}
                    style={{
                      backgroundImage: `url(${boardBackground})`,
                      backgroundSize: '900% 900%',
                      backgroundPosition: `${x * 12.5}% ${y * 12.5}%`,
                    }}
                  />
                );
              }

              const piece = square.piece;
              const isSelected = selectedSquareId === square.id;
              const isLastMove = lastMoveToSquareId === square.id;
              const isAvailable = availableMoves.has(square.id);
              const isCurrentPlayerPiece = piece && piece.color === currentPlayer;

              return (
                <button
                  key={square.id}
                  onClick={() => onSquareClick(square.id)}
                  className={`
                    flex items-center justify-center
                    aspect-square
                    relative
                    transition-colors
                    ${isCurrentPlayerPiece ? 'cursor-pointer' : 'cursor-pointer'}
                  `}
                  style={{
                    backgroundImage: `url(${boardBackground})`,
                    backgroundSize: '900% 900%',
                    backgroundPosition: `${x * 12.5}% ${y * 12.5}%`,
                  }}
                  data-square-id={square.id}
                >
                  {/* 選択状態のオーバーレイ */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-400/50" />
                  )}
                  {/* 最後の移動先のオーバーレイ */}
                  {isLastMove && !isSelected && (
                    <div className="absolute inset-0 bg-yellow-400/30" />
                  )}
                  {/* 移動可能マーク */}
                  {isAvailable && !piece && (
                    <div className="absolute w-3 h-3 rounded-full bg-green-500/60" />
                  )}
                  {isAvailable && piece && (
                    <div className="absolute inset-0 border-2 border-green-500/60 rounded-sm" />
                  )}

                  {/* 駒画像 */}
                  {piece && (
                    <Image
                      src={getPieceImagePath(pieceFolder, piece.kind, piece.color)}
                      alt={PIECE_DISPLAY[piece.kind]}
                      width={60}
                      height={60}
                      className="w-full h-full object-contain relative z-10"
                      draggable={false}
                      priority
                    />
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