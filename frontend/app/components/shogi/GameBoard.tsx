'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Square, PieceKind, Color, MoveAnimationState } from './types';
import { AnimatedPiece } from './AnimatedPiece';
import { FlyingPiece } from './FlyingPiece';
import { ExplosionEffect } from './ExplosionEffect';

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
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
  const prefix = color === 0 ? '0' : '1';
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
  // テーマ設定
  pieceFolder: string;
  boardBackground: string;
  // アニメーション関連（オプショナル - 段階的に導入可能）
  moveAnimation?: MoveAnimationState | null;
  flyingPiece?: { kind: PieceKind; color: Color; position: { x: number; y: number } } | null;
  onAnimationComplete?: () => void;
  onFlyingComplete?: () => void;
  children?: React.ReactNode;
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
  // アニメーション関連（デフォルト値でオプショナル対応）
  moveAnimation = null,
  flyingPiece = null,
  onAnimationComplete = () => {},
  onFlyingComplete = () => {},
  children,
}) => {
  // 盤面コンテナへの参照（マスサイズ計算用）
  const boardRef = useRef<HTMLDivElement>(null);
  const [squareSize, setSquareSize] = useState(0);
  // 弾き飛ばし表示フラグ（着地後に表示）
  const [showFlyingPiece, setShowFlyingPiece] = useState(false);
  // 爆発エフェクト表示フラグ
  const [showExplosion, setShowExplosion] = useState(false);

  // マスのサイズを計算（リサイズ対応）
  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        const size = boardRef.current.offsetWidth / 9;
        setSquareSize(size);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // アニメーションが終了したらエフェクトをリセット
  useEffect(() => {
    if (!moveAnimation) {
      setShowFlyingPiece(false);
      setShowExplosion(false);
    }
  }, [moveAnimation]);

  // 着地時のコールバック（弾き飛ばしと爆発開始）
  // 駒を取る場合のみエフェクトを表示
  const handleLanded = useCallback(() => {
    // moveAnimationが存在し、isCaptureがtrueで、flyingPieceが存在する場合のみ
    if (moveAnimation?.isCapture && flyingPiece) {
      setShowFlyingPiece(true);
      setShowExplosion(true);
    }
  }, [flyingPiece, moveAnimation]);

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

  // マスIDからピクセル位置を計算
  const getSquarePosition = (squareId: string): { x: number; y: number } => {
    // squareId形式: "76" (筋+段) をUI座標に変換
    const lx = parseInt(squareId[0]); // 筋 (9-1)
    const ly = parseInt(squareId[1]); // 段 (1-9)
    const uiX = 9 - lx; // UI上のX座標
    const uiY = ly - 1; // UI上のY座標
    return {
      x: uiX * squareSize,
      y: uiY * squareSize,
    };
  };

  return (
    <div className="flex flex-col items-center">
      {/* 盤面コンテナ - relative で子要素の absolute 配置の基準に */}
      <div
        ref={boardRef}
        className="aspect-square border-2 border-black p-0.5 relative"
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

              // アニメーション中の駒は元の位置では非表示
              const isAnimatingPiece = moveAnimation && moveAnimation.fromSquareId === square.id;
              // 弾き飛ばされる駒は着地後（showFlyingPieceがtrue）に非表示
              // 着地するまでは元の位置に表示しておく
              const isFlyingPiece = showFlyingPiece && moveAnimation && 
                moveAnimation.toSquareId === square.id && moveAnimation.isCapture;

               const isMoving =
                  moveAnimation &&
                  !moveAnimation.isDrop && // ドロップアニメーション中は移動元マスは空のまま
                  moveAnimation.fromSquareId === square.id &&
                  moveAnimation.isCapture === false;

               // ドロップアニメーション中、移動先マスに既に駒データが入ってしまっているので隠す
               const isHiddenForDrop = 
                  moveAnimation && 
                  moveAnimation.isDrop && 
                  moveAnimation.toSquareId === square.id;

               return (
                 <button
                   key={square.id}
                   onClick={() => onSquareClick(square.id)}
                   className={`
                     flex items-center justify-center
                     aspect-square
                     relative
                     transition-colors
                     cursor-pointer
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
                   {/* 移動可能マーク（空きマス） */}
                   {isAvailable && !piece && (
                     <div className="absolute w-3 h-3 rounded-full bg-green-500/60" />
                   )}
                   {/* 移動可能マーク（駒がある場合） */}
                   {isAvailable && piece && (
                     <div className="absolute inset-0 border-2 border-green-500/60 rounded-sm" />
                   )}
 
                   {/* 駒画像 - アニメーション中は非表示 */}
                   {piece && !isAnimatingPiece && !isMoving && !isFlyingPiece && !isHiddenForDrop && (
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

        {/* ===== アニメーションレイヤー ===== */}
        
        {/* 移動中の駒（アニメーション） */}
        {moveAnimation && (
          (() => {
            let fromPos;
            const toPos = getSquarePosition(moveAnimation.toSquareId); // 常に存在するはず

            if (moveAnimation.isDrop && moveAnimation.dropStartPosition && boardRef.current) {
                // ドロップの場合：クライアント座標から盤面相対座標へ変換
                const boardRect = boardRef.current.getBoundingClientRect();
                fromPos = {
                    x: moveAnimation.dropStartPosition.x - boardRect.left,
                    y: moveAnimation.dropStartPosition.y - boardRect.top
                };
            } else {
                // 通常移動の場合
                fromPos = getSquarePosition(moveAnimation.fromSquareId);
            }

            return (
              <AnimatedPiece
                animationState={{
                  ...moveAnimation,
                  fromPosition: fromPos,
                  toPosition: toPos,
                }}
                pieceFolder={pieceFolder}
                squareSize={squareSize}
                onAnimationComplete={onAnimationComplete}
                onLanded={handleLanded}
              />
            );
          })()
        )}

        {/* 弾き飛ばされる駒（着地後に表示） */}
        {showFlyingPiece && flyingPiece && moveAnimation && squareSize > 0 && (
          <FlyingPiece
            kind={flyingPiece.kind}
            color={flyingPiece.color}
            pieceFolder={pieceFolder}
            startPosition={getSquarePosition(moveAnimation.toSquareId)}
            squareSize={squareSize}
            onComplete={onFlyingComplete}
          />
        )}

        {/* 爆発エフェクト（着地後に表示） */}
        {showExplosion && moveAnimation && squareSize > 0 && (
          <ExplosionEffect
            position={getSquarePosition(moveAnimation.toSquareId)}
            squareSize={squareSize}
            onComplete={() => setShowExplosion(false)}
          />
        )}
        {children}
      </div>
    </div>
  );
};

export default GameBoard;