/**
 * 将棋コンポーネントのエクスポート
 * 他のファイルから簡単にインポートできるようにする
 */

// 型定義（旧）
export * from './types';

// 定数（旧）
export * from './constants';

// フック
export * from './hooks/useJShogi';

// 旧コンポーネント（互換性のため残す）
export { ShogiPiece } from './ShogiPiece';
export { ShogiBoard } from './ShogiBoard';

// 新コンポーネント（対局用）
export { GameBoard } from './GameBoard';
export { GameController } from './GameController';
export { CapturedPieces } from './CapturedPieces';
export { TurnIndicator } from './TurnIndicator';
export { PromotionDialog } from './PromotionDialog';
export { GameOverDialog } from './GameOverDialog';
export { ResignConfirmDialog } from './ResignConfirmDialog';
