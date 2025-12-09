/**
 * ShogiBoard コンポーネント
 * 将棋盤（9x9マス）を表示するコンポーネント
 * 
 * 機能:
 * - 9x9のグリッド表示
 * - 各マスへの駒配置
 * - 駒の選択・移動
 * - レスポンシブ対応
 */

'use client';

import React from 'react';
import { BoardState, Position } from './types';
import { ShogiPiece } from './ShogiPiece';

// =====================================
// Props定義
// =====================================

export interface ShogiBoardProps {
  /** 盤面の状態 */
  boardState: BoardState;
  /** 選択中のマス */
  selectedPosition?: Position | null;
  /** 最後に打った手（ハイライト用） */
  lastMove?: { from: Position | null; to: Position } | null;
  /** マスクリック時のコールバック */
  onSquareClick?: (row: number, col: number) => void;
  /** インタラクティブかどうか */
  interactive?: boolean;
  /** 追加のCSSクラス（オプション） */
  className?: string;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 将棋盤を表示するコンポーネント
 * 
 * @example
 * import { INITIAL_BOARD_STATE } from './constants';
 * 
 * <ShogiBoard boardState={INITIAL_BOARD_STATE} />
 */
export const ShogiBoard: React.FC<ShogiBoardProps> = ({
  boardState,
  selectedPosition = null,
  lastMove = null,
  onSquareClick,
  interactive = false,
}) => {
  const handleSquareClick = (row: number, col: number) => {
    if (interactive && onSquareClick) {
      onSquareClick(row, col);
    }
  };

  return (
    <div className={`flex flex-col items-center `}>
      {/* 
        盤面コンテナ
        aspect-squareで正方形を維持
        最大幅を設定してレスポンシブ対応
      */}
      {/* 
        盤面サイズ調整:
        - min(90vw, 75vh) で画面幅と高さの小さい方に合わせる
        - インラインスタイルで直接CSS指定（TailwindCSS v4の任意値問題を回避）
      */}
      <div
        className="
          aspect-square
          bg-amber-100 dark:bg-amber-900
          border-2 border-amber-800 dark:border-amber-600
          p-1
        "
        style={{
          width: 'min(90vw, 75vh)',
          maxWidth: '100%',
        }}
      >
        {/* 
          9x9グリッド
          CSS Gridで均等分割
        */}
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
          {/* 各マスをレンダリング */}
          {boardState.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isSelected = selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex;
              const isLastMoveFrom = lastMove?.from?.row === rowIndex && lastMove?.from?.col === colIndex;
              const isLastMoveTo = lastMove?.to?.row === rowIndex && lastMove?.to?.col === colIndex;
              const isLastMove = isLastMoveFrom || isLastMoveTo;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    flex items-center justify-center
                    aspect-square
                    ${isSelected ? 'bg-green-300 dark:bg-green-400 ring-2 ring-green-500' :
                      isLastMove ? 'bg-yellow-200 dark:bg-yellow-300' :
                        'bg-amber-100 dark:bg-amber-200'}
                    ${interactive ? 'cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-300 transition-colors' : ''}
                  `}
                  data-row={rowIndex}
                  data-col={colIndex}
                  data-position={`${9 - colIndex}${['一', '二', '三', '四', '五', '六', '七', '八', '九'][rowIndex]}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {/* 駒がある場合のみShogiPieceを表示 */}
                  {piece && (
                    <ShogiPiece
                      type={piece.type}
                      owner={piece.owner}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 
        座標表示（オプション）
        将来的に筋・段の番号を表示する場合はここに追加
      */}
    </div>
  );
};

export default ShogiBoard;
