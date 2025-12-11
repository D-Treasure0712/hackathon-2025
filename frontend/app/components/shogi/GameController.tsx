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
 * - AI対局モードでWebSocket通信を管理
 */
export const GameController: React.FC = () => {
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
    // WebSocket関連
    isConnected,
    isAIThinking,
    lastMoveIsBook,
    gameStatus,
    gameResult,
    wsError,
    connect,
  } = useJShogi({ playerColor: 0, useAI: true });

  // ステータス表示のテキスト
  const getStatusText = () => {
    if (gameStatus === 'waiting') return 'AIとの対局を開始してください';
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
    if (gameStatus === 'waiting') return 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400';
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

        {/* 定石表示 */}
        {gameStatus === 'playing' && lastMoveIsBook && (
          <div className="mt-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-sm text-center inline-flex items-center justify-center gap-1 mx-auto">
            📚 定石からの手
          </div>
        )}

        {/* 対局開始ボタン（待機中のみ表示） */}
        {gameStatus === 'waiting' && (
          <button
            onClick={connect}
            className="
              w-full mt-3 py-3 px-4 rounded-lg
              bg-gradient-to-r from-blue-500 to-purple-500
              text-white font-bold text-lg
              hover:from-blue-600 hover:to-purple-600
              transition-all shadow-lg hover:shadow-xl
            "
          >
            🎮 対局開始
          </button>
        )}
      </div>

      {/* 1. 後手（AI）の持ち駒 */}
      <div className="w-full">
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 pl-2">
          AI（後手）
        </div>
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
      <div className={`relative ${(isAIThinking || gameStatus === 'waiting' || gameStatus === 'connecting') ? 'pointer-events-none' : ''}`}>
        <GameBoard
          squares={squares}
          currentPlayer={currentPlayer}
          selectedSquareId={selectedSquareId}
          lastMoveToSquareId={lastMoveToSquareId}
          availableMoves={availableMoves}
          onSquareClick={onSquareClick}
        />
        {/* AI思考中オーバーレイ */}
        {isAIThinking && (
          <div className="absolute inset-0 bg-black/10 dark:bg-white/5 flex items-center justify-center rounded-lg">
            <div className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-zinc-700 dark:text-zinc-300">思考中...</span>
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
        />
      </div>

      {/* 5. 操作ボタンエリア */}
      <div className="flex gap-4 mt-6">
        {/* 待ったボタン - AI対局では無効 */}
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

        {/* 投了ボタン */}
        <button
          onClick={onResignRequest}
          disabled={gameStatus !== 'playing' || winner !== null}
          className={`
            px-4 py-2 rounded font-bold text-white transition-colors
            ${gameStatus === 'playing' && winner === null
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
      />

    </div>
  );
};