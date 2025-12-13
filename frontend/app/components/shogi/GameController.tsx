'use client';

import React, { useState, useEffect } from 'react';
import { useJShogi } from './hooks/useJShogi';
import { GameBoard, PIECE_FOLDERS, BOARD_BACKGROUNDS } from './GameBoard';
import { CapturedPieces } from './CapturedPieces';
import { TurnIndicator } from './TurnIndicator';
import { PromotionDialog } from './PromotionDialog';
import { CheckWarningDialog } from './CheckWarningDialog';
import { ResignConfirmDialog } from './ResignConfirmDialog';
import { GameOverDialog } from './GameOverDialog';

/**
 * GameController コンポーネント
 * 役割:
 * - useJShogi フックを使用してゲーム状態を管理
 * - 盤面・駒画像のランダム選択
 * - 盤面、持ち駒、情報表示、操作ボタンをレイアウトする
 */
export const GameController: React.FC = () => {
  // ランダムテーマ選択（クライアントサイドでのみ）
  const [pieceFolder, setPieceFolder] = useState<string>('kanji_brown');
  const [boardBg, setBoardBg] = useState<string>('/gameboard/tile_wood1.png');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // クライアントサイドでランダム選択
    setPieceFolder(PIECE_FOLDERS[Math.floor(Math.random() * PIECE_FOLDERS.length)]);
    setBoardBg(BOARD_BACKGROUNDS[Math.floor(Math.random() * BOARD_BACKGROUNDS.length)]);
    setIsReady(true);
  }, []);

  // フックからゲーム状態と操作関数を取得
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
    canUndo,
    onUndo,
  } = useJShogi({ playerColor: 0 });

  // 準備完了前はローディング表示
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-zinc-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">

      {/* 1. 後手（相手）の持ち駒 */}
      <div className="w-full">
        <CapturedPieces
          hands={hands}
          targetPlayer={1}
          currentPlayer={currentPlayer}
          selectedHandPieceId={selectedHandPieceId}
          onHandPieceClick={onHandPieceClick}
          pieceFolder={pieceFolder}
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
        pieceFolder={pieceFolder}
        boardBackground={boardBg}
      />

      {/* 4. 先手（自分）の持ち駒 */}
      <div className="w-full">
        <CapturedPieces
          hands={hands}
          targetPlayer={0}
          currentPlayer={currentPlayer}
          selectedHandPieceId={selectedHandPieceId}
          onHandPieceClick={onHandPieceClick}
          pieceFolder={pieceFolder}
        />
      </div>

      {/* 5. 操作ボタンエリア */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`
            px-4 py-2 rounded font-bold transition-colors
            ${canUndo
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          待った
        </button>

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
        playerNumber={0}
        onRematch={resetGame}
      />

    </div>
  );
};