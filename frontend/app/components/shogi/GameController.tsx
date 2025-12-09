'use client';

import React from 'react';
import { useJShogi } from './hooks/useJShogi';
import { GameBoard } from './GameBoard';
import { CapturedPieces } from './CapturedPieces';
import { TurnIndicator } from './TurnIndicator';
import { PromotionDialog } from './PromotionDialog';
import { CheckWarningDialog } from './CheckWarningDialog';
import { ResignConfirmDialog } from './ResignConfirmDialog';
import { GameOverDialog } from './GameOverDialog';

/**
 * GameController コンポーネント
 * * 役割:
 * - useJShogi フックを使用してゲーム状態を管理（Container Component）
 * - 盤面、持ち駒、情報表示、操作ボタンをレイアウトする
 */
export const GameController: React.FC = () => {
  // フックからゲーム状態と操作関数を取得
  // ここで初期設定（playerColor: 0 = 先手視点）を行います
  const {
    squares,
    hands,
    currentPlayer,
    winner,
    selectedSquareId,
    selectedHandPieceId,
    waitingForPromotion,
    waitingForResignConfirm,
    showCheckWarning,
    lastMoveToSquareId,
    onSquareClick,
    onHandPieceClick,
    onPromotionSelect,
    onCheckWarningClose,
    onResignRequest,
    onResignConfirm,
    resetGame,
    availableMoves,
  } = useJShogi({ playerColor: 0 });

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">

      {/* 1. 後手（相手）の持ち駒 */}
      <div className="w-full">
        <CapturedPieces
          hands={hands}
          targetPlayer={1} // 後手
          currentPlayer={currentPlayer}
          selectedHandPieceId={selectedHandPieceId}
          onHandPieceClick={onHandPieceClick}
        />
      </div>

      {/* 2. 手番インジケータ */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        winner={winner}
      />

      {/* 3. 将棋盤 */}
      <GameBoard
        squares={squares}
        currentPlayer={currentPlayer}
        selectedSquareId={selectedSquareId}
        lastMoveToSquareId={lastMoveToSquareId}
        availableMoves={availableMoves}
        onSquareClick={onSquareClick}
      />

      {/* 4. 先手（自分）の持ち駒 */}
      <div className="w-full">
        <CapturedPieces
          hands={hands}
          targetPlayer={0} // 先手
          currentPlayer={currentPlayer}
          selectedHandPieceId={selectedHandPieceId}
          onHandPieceClick={onHandPieceClick}
        />
      </div>

      {/* 5. 操作ボタンエリア */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onResignRequest}
          disabled={winner !== null}
          className={`
            px-4 py-2 rounded font-bold text-white transition-colors
            ${winner === null
              ? 'bg-red-500 hover:bg-red-600 shadow-md'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          投了
        </button>

        <button
          onClick={resetGame}
          className="
            px-4 py-2 rounded font-bold text-stone-700 bg-stone-200
            hover:bg-stone-300 transition-colors shadow-sm
          "
        >
          最初から
        </button>
      </div>

      {/* 6. 成りダイアログ */}
      <PromotionDialog
        isOpen={waitingForPromotion}
        onSelect={onPromotionSelect}
      />

      {/* 7. 王手警告ダイアログ */}
      <CheckWarningDialog
        isOpen={showCheckWarning}
        onClose={onCheckWarningClose}
      />

      {/* 8. 投了確認ダイアログ */}
      <ResignConfirmDialog
        isOpen={waitingForResignConfirm}
        onConfirm={onResignConfirm}
      />

      {/* 9. 対局終了ダイアログ */}
      <GameOverDialog
        winner={winner}
        playerNumber={0} // 先手視点
        onRematch={resetGame}
      />

    </div>
  );
};