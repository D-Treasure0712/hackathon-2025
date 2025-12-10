/**
 * 将棋の定数定義
 * 駒の表示名、成り駒マッピング、初期配置などを定義
 */

import { PieceType, BoardState, Piece, Player } from './types';

// =====================================
// 駒の表示名マッピング
// =====================================

/**
 * 駒の種類から表示する文字へのマッピング
 * 先手の玉は「玉」、後手の玉は「王」として表示することも可能
 */
export const PIECE_DISPLAY_NAMES: Record<PieceType, string> = {
  // 基本駒
  king: '玉',
  rook: '飛',
  bishop: '角',
  gold: '金',
  silver: '銀',
  knight: '桂',
  lance: '香',
  pawn: '歩',
  // 成り駒
  dragon: '龍',
  horse: '馬',
  promotedSilver: '全',
  promotedKnight: '圭',
  promotedLance: '杏',
  promotedPawn: 'と',
};

/**
 * 後手の玉を「王」として表示する場合のマッピング
 */
export const GOTE_KING_DISPLAY = '王';

// =====================================
// 成り駒への変換マッピング
// =====================================

/**
 * 基本駒から成り駒への変換マッピング
 * 金と玉は成れないためundefined
 */
export const PROMOTION_MAP: Partial<Record<PieceType, PieceType>> = {
  rook: 'dragon',
  bishop: 'horse',
  silver: 'promotedSilver',
  knight: 'promotedKnight',
  lance: 'promotedLance',
  pawn: 'promotedPawn',
};

/**
 * 成り駒から元の駒への変換マッピング（成り戻し用）
 */
export const UNPROMOTION_MAP: Partial<Record<PieceType, PieceType>> = {
  dragon: 'rook',
  horse: 'bishop',
  promotedSilver: 'silver',
  promotedKnight: 'knight',
  promotedLance: 'lance',
  promotedPawn: 'pawn',
};

// =====================================
// 成り駒かどうかの判定
// =====================================

/** 成り駒の種類一覧 */
export const PROMOTED_PIECES: PieceType[] = [
  'dragon',
  'horse',
  'promotedSilver',
  'promotedKnight',
  'promotedLance',
  'promotedPawn',
];

/**
 * 指定された駒が成り駒かどうかを判定
 */
export function isPromoted(pieceType: PieceType): boolean {
  return PROMOTED_PIECES.includes(pieceType);
}

// =====================================
// 初期配置（平手）
// =====================================

/**
 * 駒を作成するヘルパー関数
 */
function piece(type: PieceType, owner: Player): Piece {
  return { type, owner };
}

/**
 * 平手の初期配置
 * 将棋の標準的な初期配置を定義
 * 
 * 配列のインデックス:
 * - [0][0] = 9一（後手の香車）
 * - [8][8] = 1九（先手の香車）
 */
export const INITIAL_BOARD_STATE: BoardState = [
  // 1段目（後手陣・最奥）
  [
    piece('lance', 'gote'),
    piece('knight', 'gote'),
    piece('silver', 'gote'),
    piece('gold', 'gote'),
    piece('king', 'gote'),
    piece('gold', 'gote'),
    piece('silver', 'gote'),
    piece('knight', 'gote'),
    piece('lance', 'gote'),
  ],
  // 2段目（後手の飛角）
  [
    null,
    piece('rook', 'gote'),
    null,
    null,
    null,
    null,
    null,
    piece('bishop', 'gote'),
    null,
  ],
  // 3段目（後手の歩）
  [
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
    piece('pawn', 'gote'),
  ],
  // 4段目（空）
  [null, null, null, null, null, null, null, null, null],
  // 5段目（空）
  [null, null, null, null, null, null, null, null, null],
  // 6段目（空）
  [null, null, null, null, null, null, null, null, null],
  // 7段目（先手の歩）
  [
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
    piece('pawn', 'sente'),
  ],
  // 8段目（先手の飛角）
  [
    null,
    piece('bishop', 'sente'),
    null,
    null,
    null,
    null,
    null,
    piece('rook', 'sente'),
    null,
  ],
  // 9段目（先手陣・最手前）
  [
    piece('lance', 'sente'),
    piece('knight', 'sente'),
    piece('silver', 'sente'),
    piece('gold', 'sente'),
    piece('king', 'sente'),
    piece('gold', 'sente'),
    piece('silver', 'sente'),
    piece('knight', 'sente'),
    piece('lance', 'sente'),
  ],
];

// =====================================
// 盤面サイズ
// =====================================

/** 盤面の行数 */
export const BOARD_ROWS = 9;

/** 盤面の列数 */
export const BOARD_COLS = 9;
