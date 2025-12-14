
'use client';

import Image from "next/image";
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
 * * 役割:
 * - useJShogi フックを使用してゲーム状態を管理（Container Component）
 * - 盤面、持ち駒、情報表示、操作ボタンをレイアウトする
 * - AI対局モードでWebSocket通信を管理
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
  // ここで初期設定（playerColor: 0 = 先手視点, useAI: true = AI対局モード）を行います
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
    // WebSocket関連
    isConnected,
    isAIThinking,
    lastMoveIsBook,
    gameStatus,
    gameResult,
    wsError,
    connect,
  } = useJShogi({ playerColor: 0, useAI: true });

  // コンポーネントマウント時に自動的にAI対局を開始
  useEffect(() => {
    if (isReady && gameStatus === 'waiting') {
      connect();
    }
  }, [isReady, gameStatus, connect]);

  // リセットして再接続するラッパー関数（「もう一度対局」「最初から」ボタン用）
  const resetGameAndConnect = () => {
    resetGame();
    // resetGame後にgameStatusが'waiting'になるので、useEffectで自動的にconnectが呼ばれる
  };

  // 準備完了前はローディング表示
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-zinc-500">読み込み中...</div>
      </div>
    );
  }

  // ステータス表示のテキスト
  const getStatusText = () => {
    if (gameStatus === 'waiting') return '接続準備中...';
    if (gameStatus === 'connecting') return '接続中...';
    if (gameStatus === 'game_over') {
      if (gameResult) {
        const winnerText = gameResult.winner === 'player' ? 'あなたの勝ち！' :
          gameResult.winner === 'ai' ? 'AIの勝ち' : '引き分け';
        const reasonText = gameResult.reason === 'resign' ? '（投了）' :
          gameResult.reason === 'checkmate' ? '（詰み）' :
            gameResult.reason === 'rep_draw' ? '（千日手）' : '';
        return `${winnerText}${reasonText}`;
      }
      return '対局終了';
    }
    if (isAIThinking) return 'AI思考中...';
    if (currentPlayer === 0) return 'あなたの番です';
    return 'AIの番です';
  };

  // ステータス表示のスタイル
  const getStatusStyle = () => {
    if (gameStatus === 'waiting') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    if (gameStatus === 'connecting') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    if (gameStatus === 'game_over') {
      if (gameResult?.winner === 'player') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      if (gameResult?.winner === 'ai') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      return 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400';
    }
    if (isAIThinking) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">

      {/* 0. ゲームステータス / エラー表示 */}
      <div className="w-full">
        {/* エラー表示 */}
        {wsError && (
          <div className="mb-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-center text-sm">
            ⚠️ {wsError}
          </div>
        )}

        {/* ステータス表示 */}
        <div className={`px-4 py-3 rounded-lg text-center font-medium ${getStatusStyle()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* 1. 後手（AI）の持ち駒 */}
      <div className="w-full">
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
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 pl-2">
          AI（後手）
        </div>
        <CapturedPieces
          hands={hands}
          targetPlayer={1} // 後手
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
      <div className={`relative ${(isAIThinking || gameStatus === 'waiting' || gameStatus === 'connecting') ? 'pointer-events-none' : ''}`}>
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

        {/* AI思考中オーバーレイ */}
        {isAIThinking && (
          // z-10 を追加して確実に他の要素の上に表示させます
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-left rounded-lg z-10">
            {/* 画像に合わせてコンテナのスタイルを調整 */}
            {/* animate-pulse を追加して、考えているようにゆっくり点滅させます */}
            <div className="dark:bg-zinc-800 p-3 translate-x-[-300px] rounded-full shadow-xl animate-pulse">
              <Image
                src="/images/hujii2.png" // ここに画像のパスを指定します
                alt="ふじい君考え中..."
                width={100}  // 画像の幅を指定（適切に調整してください）
                height={100} // 画像の高さを指定（適切に調整してください）
                className="object-contain drop-shadow-xl"
              />
              {/* もしテキストも下に表示したい場合は、以下のコメントを解除してください */}
              {/* <p className="text-center text-sm text-zinc-700 dark:text-zinc-300 mt-2 font-bold">ふじい中...</p> */}
            </div>
          </div>
        )}

      </div>

      {/* 4. 先手（自分）の持ち駒 */}
      <div className="w-full">
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 pl-2">
          あなた（先手）
        </div>
        <CapturedPieces
          hands={hands}
          targetPlayer={0} // 先手
          currentPlayer={currentPlayer}
          selectedHandPieceId={selectedHandPieceId}
          onHandPieceClick={onHandPieceClick}
          pieceFolder={pieceFolder}
        />
      </div>



      {/* 接続状態インジケータ */}
      <div className="text-xs text-zinc-400 dark:text-zinc-500">
        {isConnected ? (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            接続中
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            未接続
          </span>
        )}
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
        onConnect={connect}
      />

      {/* 9. 投了・最初からダイアログ */}
      <GameMenuDialog
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onResignRequest={onResignRequest}
        onRestart={resetGame}
        onConnect={connect}
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