/**
 * 将棋の型定義
 * 駒の種類、プレイヤー、盤面状態などを定義
 */

// =====================================
// プレイヤー定義
// =====================================

/** 先手/後手を表す型 */
export type Player = 'sente' | 'gote';

// =====================================
// 駒の種類定義
// =====================================

/** 基本駒（成っていない状態） */
export type BasePieceType =
  | 'king'    // 玉（王）
  | 'rook'    // 飛車
  | 'bishop'  // 角行
  | 'gold'    // 金将
  | 'silver'  // 銀将
  | 'knight'  // 桂馬
  | 'lance'   // 香車
  | 'pawn';   // 歩兵

/** 成り駒 */
export type PromotedPieceType =
  | 'dragon'          // 龍（成飛）
  | 'horse'           // 馬（成角）
  | 'promotedSilver'  // 成銀
  | 'promotedKnight'  // 成桂
  | 'promotedLance'   // 成香
  | 'promotedPawn';   // と金

/** 全ての駒の種類 */
export type PieceType = BasePieceType | PromotedPieceType;

// =====================================
// 駒の定義
// =====================================

/** 駒を表すインターフェース */
export interface Piece {
  /** 駒の種類 */
  type: PieceType;
  /** 所有者（先手/後手） */
  owner: Player;
}

// =====================================
// 盤面の定義
// =====================================

/**
 * 盤面の状態を表す型
 * 9x9の2次元配列で、各要素は駒またはnull（空マス）
 * 
 * インデックスの説明:
 * - boardState[row][col]
 * - row: 0が一番上（後手側の奥）、8が一番下（先手側の奥）
 * - col: 0が左（9筋）、8が右（1筋）
 * 
 * 将棋の座標系との対応:
 * - 筋（縦の列）: 9筋〜1筋 = col 0〜8
 * - 段（横の行）: 一段〜九段 = row 0〜8
 */
export type BoardState = (Piece | null)[][];

// =====================================
// マス目の位置
// =====================================

/** 盤上の位置を表すインターフェース */
export interface Position {
  /** 行（0-8、上から下） */
  row: number;
  /** 列（0-8、左から右） */
  col: number;
}

// =====================================
// 持ち駒の定義
// =====================================

/** 持ち駒として使える駒の種類（成り駒は持ち駒にできない） */
export type HandPieceType = Exclude<BasePieceType, 'king'>;

/** 持ち駒の状態（駒の種類ごとの個数） */
export type CapturedPieces = {
  [key in HandPieceType]: number;
};

/** 初期の持ち駒（全て0） */
export const EMPTY_CAPTURED_PIECES: CapturedPieces = {
  rook: 0,
  bishop: 0,
  gold: 0,
  silver: 0,
  knight: 0,
  lance: 0,
  pawn: 0,
};
