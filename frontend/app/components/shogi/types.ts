/**
 * 将棋の型定義
 * shogi.js の仕様に準拠しつつ、UI用の型を定義
 */

// =====================================
// shogi.js 準拠の基本型
// =====================================

/** 手番 (0: 先手/Black, 1: 後手/White) */
export type Color = 0 | 1;

/** 駒の種類（shogi.jsの略称に準拠） */
export type PieceKind =
  | 'FU' | 'KY' | 'KE' | 'GI' | 'KI' | 'OU' | 'HI' | 'KA' // 基本
  | 'TO' | 'NY' | 'NK' | 'NG' | 'RY' | 'UM';              // 成り

// =====================================
// UI連携用の型
// =====================================

/** * UI上の駒情報
 * shogi.js の Piece オブジェクトをラップ、あるいは互換性を持たせる
 */
export interface Piece {
  /** 駒の種類 (FU, HI, ...) */
  kind: PieceKind;
  /** 所有者 (0: 先手, 1: 後手) */
  color: Color;
}

/** * 盤面の1マス
 * GameBoardコンポーネントが描画に使用する情報
 */
export interface Square {
  /** 一意なID (例: "77", "28") - 筋+段 */
  id: string;
  /** UI描画用のX座標 (0-8: 9筋->1筋) */
  x: number;
  /** UI描画用のY座標 (0-8: 一段->九段) */
  y: number;
  /** そのマスにある駒（なければnull） */
  piece: Piece | null;
}

/** 持ち駒 */
export interface Hand {
  /** 所有者 */
  color: Color;
  /** * 持ち駒のリスト
   * shogi.jsは通常 {FU: 2, KI: 1} のようなカウントを持つが、
   * UI表示用に展開した配列として扱う（従来のUIと合わせるため）
   */
  pieces: Piece[];
}

/** 座標インターフェース */
export interface Position {
  x: number;
  y: number;
}

// =====================================
// アニメーション用の型定義
// =====================================

/** アニメーションのフェーズ */
export type AnimationPhase =
  | 'idle'      // 待機中（アニメーションなし）
  | 'lifting'   // 浮き上がり中
  | 'moving'    // 移動中
  | 'landing'   // 着地中（駒を取らない場合）
  | 'stomping'; // 踏みつけ中（駒を取る場合）

/** 移動アニメーションの状態 */
export interface MoveAnimationState {
  /** 移動する駒の種類 */
  pieceKind: PieceKind;
  /** 移動する駒の所有者 */
  pieceColor: Color;
  /** 移動元のマスID */
  fromSquareId: string;
  /** 移動先のマスID */
  toSquareId: string;
  /** 移動元のピクセル座標 */
  fromPosition: { x: number; y: number };
  /** 移動先のピクセル座標 */
  toPosition: { x: number; y: number };
  /** 相手の駒を取るかどうか */
  isCapture: boolean;
  /** 取られる駒の情報（ある場合） */
  capturedPiece?: { kind: PieceKind; color: Color };
  /** 現在のアニメーションフェーズ */
  phase: AnimationPhase;
  /** ドロップ（打ち）かどうか */
  isDrop?: boolean;
  /** ドロップ開始位置（クライアント座標） */
  dropStartPosition?: { x: number; y: number };
  /** 成りかどうか */
  promote?: boolean;
  /** 成った後の駒の種類 */
  promotedKind?: PieceKind;
}
