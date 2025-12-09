/**
 * 対局画面
 * 将棋盤を表示し、AIと対局を行う画面
 */
'use client';

import BackgroundMusic from './components/BackgroundMusic';
import { ShogiBoard, PieceStand } from '../components/shogi';
import { useGame } from '../hooks/useGame';

export default function GamePage() {
  const {
    gameState,
    isConnected,
    error,
    selectSquare,
    selectHandPiece,
    startGame,
    resetGame,
  } = useGame();

  // ゲーム結果のメッセージ
  const getResultMessage = () => {
    if (gameState.result === 'player_win') {
      return '🎉 あなたの勝ちです！';
    } else if (gameState.result === 'ai_win') {
      return '😢 AIの勝ちです';
    } else if (gameState.result === 'draw') {
      return '🤝 引き分けです';
    }
    return '';
  };

  // 終了理由のメッセージ
  const getReasonMessage = () => {
    switch (gameState.reason) {
      case 'resign': return '（AIが投了）';
      case 'checkmate': return '（詰み）';
      case 'rep_draw': return '（千日手）';
      case 'win': return '（入玉宣言）';
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      {/* BGM */}
      <BackgroundMusic />

      <main className="flex flex-col items-center justify-center gap-6 w-full max-w-4xl">
        {/* ページタイトル */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
          対局画面
        </h1>

        {/* 接続状態 */}
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
          />
          <span className="text-zinc-600 dark:text-zinc-400">
            {isConnected ? 'サーバー接続中' : 'サーバー未接続'}
          </span>
        </div>

        {/* ゲーム状態表示 */}
        {gameState.gameStatus === 'waiting' && (
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors"
          >
            🎮 ゲームを開始
          </button>
        )}

        {gameState.gameStatus === 'playing' && (
          <div className="text-center">
            <p className={`text-lg font-bold ${gameState.isPlayerTurn ? 'text-green-600' : 'text-orange-500'}`}>
              {gameState.isPlayerTurn ? '🎯 あなたの番です' : '🤔 AIが考え中...'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              手数: {gameState.moveHistory.length}
            </p>
          </div>
        )}

        {gameState.gameStatus === 'game_over' && (
          <div className="text-center">
            <p className="text-2xl font-bold text-black dark:text-white">
              {getResultMessage()} {getReasonMessage()}
            </p>
            <button
              onClick={resetGame}
              className="mt-4 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              🔄 もう一度
            </button>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            ⚠️ {error}
          </div>
        )}

        {/* 将棋盤と駒台 */}
        <div className="flex items-center gap-4">
          {/* 後手（AI）の駒台 */}
          <PieceStand
            capturedPieces={gameState.aiCaptured}
            owner="gote"
            interactive={false}
          />

          {/* 将棋盤 */}
          <ShogiBoard
            boardState={gameState.board}
            selectedPosition={gameState.selectedPosition}
            lastMove={gameState.lastMove}
            onSquareClick={selectSquare}
            interactive={gameState.gameStatus === 'playing' && gameState.isPlayerTurn}
          />

          {/* 先手（プレイヤー）の駒台 */}
          <PieceStand
            capturedPieces={gameState.playerCaptured}
            owner="sente"
            selectedPiece={gameState.selectedHandPiece}
            onPieceClick={selectHandPiece}
            interactive={gameState.gameStatus === 'playing' && gameState.isPlayerTurn}
          />
        </div>

        {/* 操作説明 */}
        {gameState.gameStatus === 'playing' && gameState.isPlayerTurn && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            <p>先手（下側）の駒をクリックして選択し、移動先をクリック</p>
            <p>持ち駒をクリックして選択し、盤面をクリックで駒を打つ</p>
          </div>
        )}

        {/* 直近の手履歴 */}
        {gameState.moveHistory.length > 0 && (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 max-w-md overflow-x-auto">
            <span className="font-bold">履歴: </span>
            {gameState.moveHistory.slice(-10).join(' ')}
          </div>
        )}
      </main>
    </div>
  );
}
