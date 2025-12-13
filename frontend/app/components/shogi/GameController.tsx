'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useJShogi } from './hooks/useJShogi';
import { GameBoard, PIECE_FOLDERS, BOARD_BACKGROUNDS } from './GameBoard';
import { CapturedPieces } from './CapturedPieces';
import { TurnIndicator } from './TurnIndicator';
import { PromotionDialog } from './PromotionDialog';
import { CheckWarningDialog } from './CheckWarningDialog';
import { ResignConfirmDialog } from './ResignConfirmDialog';
import { GameOverDialog } from './GameOverDialog';

import { CheckCutIn } from './CheckCutIn';
import { GameMenuDialog } from './GameMenuDialog';

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
  const [showMenu, setShowMenu] = useState(false);

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
    // アニメーション関連
    moveAnimation,
    flyingPiece,
    onAnimationComplete,
    onFlyingComplete,
    // 王手カットイン関連
    showCheckCutIn,
    checkAttacker,
    onCheckCutInComplete,
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
      {/* 1. 上部エリア：メニューボタン + 後手（相手）の持ち駒 */}
      <div className="w-full flex items-start gap-2">
        {/* メニューボタン */}
        <button
          onClick={() => setShowMenu(true)}
          className="
            flex-shrink-0 w-10 h-10 mt-2 bg-stone-200 dark:bg-stone-700 
            rounded border border-stone-400 dark:border-stone-500
            flex items-center justify-center hover:bg-stone-300 dark:hover:bg-stone-600
            transition-colors
          "
          aria-label="メニュー"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-stone-700 dark:text-stone-300">
            <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        <div className="flex-grow">
          <CapturedPieces
            hands={hands}
            targetPlayer={1}
            currentPlayer={currentPlayer}
            selectedHandPieceId={selectedHandPieceId}
            onHandPieceClick={onHandPieceClick}
          />
        </div>
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
        // アニメーション関連
        moveAnimation={moveAnimation}
        flyingPiece={flyingPiece}
        onAnimationComplete={onAnimationComplete}

        onFlyingComplete={onFlyingComplete}
      >
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`
            absolute -right-24 bottom-0
            px-3 py-1 rounded font-bold transition-colors
            flex items-center gap-1
            ${canUndo
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
              : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }
          `}
          title="一手戻る（待った）"
        >
          <span>↩</span> 待った
        </button>
      </GameBoard>
        

      {/* 4. 先手（自分）の持ち駒 + 待ったボタン */}
      <div className="w-full">
        <CapturedPieces
          hands={hands}
          targetPlayer={0}
          currentPlayer={currentPlayer}
          selectedHandPieceId={selectedHandPieceId}
          onHandPieceClick={onHandPieceClick}
        />
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

      {/* 9. 投了・最初からダイアログ */}
      <GameMenuDialog
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onResignRequest={onResignRequest}
        onRestart={resetGame}
      />

      {/* 10. 王手カットインアニメーション */}
      <AnimatePresence>
        {showCheckCutIn && (
          <CheckCutIn
            attackerColor={checkAttacker}
            onComplete={onCheckCutInComplete}
          />
        )}
      </AnimatePresence>

    </div>
  );
};