/**
 * ShogiBoard コンポーネント
 * 将棋盤（9x9マス）を表示するコンポーネント
 * 
 * 機能:
 * - 9x9のグリッド表示
 * - 各マスへの駒配置
 * - レスポンシブ対応
 */

import React from 'react';
import { BoardState } from './types';
import { ShogiPiece } from './ShogiPiece';
// import { BOARD_ROWS, BOARD_COLS } from './constants';

// =====================================
// Props定義
// =====================================

export interface ShogiBoardProps {
  /** 盤面の状態 */
  boardState: BoardState;
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
  // className = '',
}) => {
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
          border-2 border-black
          p-1
        "
        style={{
          width: 'min(90vw, 75vh)',
          maxWidth: '100%',
          backgroundImage: 'url(/tile_wood6.png)',
          backgroundSize: 'cover',
        }}
      >
        {/* 
          9x9グリッド
          CSS Gridで均等分割
          グリッド線は黒
        */}
        <div
          className="
            grid
            grid-cols-9
            grid-rows-9
            w-full h-full
            gap-px
            bg-black
          "
        >
          {/* 各マスをレンダリング */}
          {boardState.map((row, rowIndex) =>
            row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="
                  flex items-center justify-center
                  aspect-square
                "
                style={{
                  backgroundImage: 'url(/tile_wood6.png)',
                  backgroundSize: '900% 900%',
                  backgroundPosition: `${colIndex * 12.5}% ${rowIndex * 12.5}%`,
                }}
                data-row={rowIndex}
                data-col={colIndex}
                data-position={`${9 - colIndex}${['一', '二', '三', '四', '五', '六', '七', '八', '九'][rowIndex]}`}
              >
                {/* 駒がある場合のみShogiPieceを表示 */}
                {piece && (
                  <ShogiPiece
                    type={piece.type}
                    owner={piece.owner}
                  />
                )}
              </div>
            ))
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
