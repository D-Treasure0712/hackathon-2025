'use client';

import React from 'react';
import { Hand, Color, PieceKind, Piece } from './types';

// 表示用ラベル（shogi.jsの略称 -> 漢字）
const HAND_PIECE_DISPLAY: Record<PieceKind, string> = {
  'FU': '歩',
  'KY': '香',
  'KE': '桂',
  'GI': '銀',
  'KI': '金',
  'OU': '王',
  'HI': '飛',
  'KA': '角',
  // 成り駒が持ち駒になることはないが、型定義上含めておく
  'TO': 'と',
  'NY': '杏',
  'NK': '圭',
  'NG': '全',
  'RY': '龍',
  'UM': '馬',
};

// 持ち駒の並び順定義
const ORDER: PieceKind[] = ['HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'];

interface CapturedPiecesProps {
  hands: Hand[];
  targetPlayer: Color; // 表示対象のプレイヤー (0:先手, 1:後手)
  currentPlayer: Color; // 現在の手番（操作可能か判定用）
  selectedHandPieceId: string | null;
  onHandPieceClick: (pieceId: string) => void;
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  hands,
  targetPlayer,
  currentPlayer,
  selectedHandPieceId,
  onHandPieceClick,
}) => {
  // 対象プレイヤーの持ち駒オブジェクトを取得
  const targetHand = hands.find(h => h.color === targetPlayer);
  const pieces = targetHand ? targetHand.pieces : [];

  // 種類ごとにグループ化してカウント & 代表IDを保持
  // Map<種類, { count: 枚数, firstId: クリック時に送るID }>
  const groupedPieces = pieces.reduce((acc, piece, index) => {
    // PieceのIDは useJShogi で "FU-0" のように生成されている想定
    // もし生成されていない場合、ここでindexを使って擬似IDを作る必要がありますが、
    // 前回の useJShogi 実装に合わせて "kind-index" 形式が来ている前提で進めます。
    // ※ useJShogiの実装では ID = `${kind}-${i}` としています。

    // ここでは単純に配列内の順番でIDを特定します（useJShogi側で生成したIDと一致させるため）
    // useJShogiのhands生成ロジックと合わせる必要があります。
    // 今回は useJShogi 側で `handPieces.push({ kind, color })` としており、IDを持たせていませんでした。
    // ★修正★ useJShogi側でIDを持たせるのがベストですが、
    // ここでは「種類」をクリックしたら「その種類の持っている駒のどれか」を選択するようにします。

    // 補足: useJShogi側で onHandPieceClick("FU-0") を期待しているため、
    // UI側で適切なIDを構築して渡す必要があります。

    if (!acc[piece.kind]) {
      acc[piece.kind] = { count: 0, pieces: [] };
    }
    acc[piece.kind].count++;
    acc[piece.kind].pieces.push(piece);
    return acc;
  }, {} as Record<PieceKind, { count: number, pieces: Piece[] }>);

  const isSelf = targetPlayer === currentPlayer;

  return (
    <div className={`
      flex flex-wrap gap-2 p-2 rounded-lg min-h-[60px] items-center
      ${targetPlayer === 0 ? 'bg-amber-100 dark:bg-amber-900/30 self-end' : 'bg-amber-100 dark:bg-amber-900/30 self-start'}
    `}>
      <div className="text-xs font-bold text-stone-500 w-full mb-1">
        {targetPlayer === 0 ? '☗ 先手' : '☖ 後手'} 持駒
      </div>

      {ORDER.map((kind) => {
        const group = groupedPieces[kind];
        if (!group) return null;

        // 選択中かどうか判定 (選択中のIDが、このグループのいずれかのIDと一致するか)
        // ※ useJShogi側で生成したID形式 "KIND-index" と照合
        const isSelected = selectedHandPieceId?.startsWith(`${kind}-`);

        return (
          <button
            key={kind}
            disabled={!isSelf} // 自分の手番でなければ選択不可
            onClick={() => {
              // その種類の駒の0番目のIDを指定してクリックイベント発火
              // useJShogi側では "FU-0", "FU-1" ... と生成されている前提
              onHandPieceClick(`${kind}-0`);
            }}
            className={`
              relative px-2 py-1 border rounded shadow-sm text-lg font-serif
              transition-all
              ${isSelected
                ? 'bg-blue-600 text-white border-blue-800'
                : isSelf
                  ? 'bg-amber-50 hover:bg-amber-200 border-amber-300 text-stone-900 cursor-pointer'
                  : 'bg-stone-200 text-stone-500 cursor-default'
              }
            `}
          >
            <span>{HAND_PIECE_DISPLAY[kind]}</span>
            {group.count > 1 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {group.count}
              </span>
            )}
          </button>
        );
      })}

      {pieces.length === 0 && (
        <span className="text-sm text-stone-400">なし</span>
      )}
    </div>
  );
};
