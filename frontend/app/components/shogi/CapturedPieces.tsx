'use client';

import Image from 'next/image';
import { Hand, Color, PieceKind, Piece } from './types';

// =====================================
// ヘルパー関数（画像パス生成）
// =====================================
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
  // color: 0 = Black/Sente(先手/下側), 1 = White/Gote(後手/上側)
  // 画像ファイル: 0 = 上向き(先手用: 0XX.svg), 1 = 下向き(後手用: 1XX.svg)
  const prefix = color === 0 ? '0' : '1';

  // 後手の王は「玉」(GY)の画像を使用（持ち駒にはならないが念のため）
  const pieceKind = (kind === 'OU' && color === 1) ? 'GY' : kind;

  return `/pieces/${folder}/${prefix}${pieceKind}.svg`;
};

// 持ち駒の並び順定義
const ORDER: PieceKind[] = ['HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'];

interface CapturedPiecesProps {
  hands: Hand[];
  targetPlayer: Color; // 表示対象のプレイヤー (0:先手, 1:後手)
  currentPlayer: Color; // 現在の手番（操作可能か判定用）
  selectedHandPieceId: string | null;
  onHandPieceClick: (pieceId: string) => void;
  children?: React.ReactNode;
  pieceFolder: string; // 駒画像フォルダ
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  hands,
  targetPlayer,
  currentPlayer,
  selectedHandPieceId,
  onHandPieceClick,
  children,
  pieceFolder,
}) => {
  // 対象プレイヤーの持ち駒オブジェクトを取得
  const targetHand = hands.find(h => h.color === targetPlayer);
  const pieces = targetHand ? targetHand.pieces : [];

  // 種類ごとにグループ化してカウント & 代表IDを保持
  const groupedPieces = pieces.reduce((acc, piece) => {
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
      flex flex-wrap gap-2 p-3 rounded-lg min-h-[70px] items-center backdrop-blur-sm shadow-lg
      ${targetPlayer === 0
        ? 'bg-white/80 dark:bg-black/70 self-end border border-white/20'
        : 'bg-white/80 dark:bg-black/70 self-start border border-white/20'
      }
    `}>
      <div className="text-xs font-bold text-stone-600 dark:text-stone-300 w-full mb-1">
        {targetPlayer === 0 ? '☗ 先手' : '☖ 後手'} 持ち駒
      </div>

      {ORDER.map((kind) => {
        const group = groupedPieces[kind];
        if (!group) return null;

        // 選択中かどうか判定
        const isSelected = selectedHandPieceId?.startsWith(`${kind}-`);

        return (
          <button
            key={kind}
            disabled={!isSelf} // 自分の手番でなければ選択不可
            onClick={() => {
              // useJShogi側では "FU-0" などを期待
              onHandPieceClick(`${kind}-0`);
            }}
            className={`
              relative px-1 py-1 border rounded shadow-sm
              transition-all flex items-center justify-center
              ${isSelected
                ? 'bg-blue-600 border-blue-800 ring-2 ring-blue-400'
                : isSelf
                  ? 'bg-transparent hover:bg-white/20 border-transparent cursor-pointer'
                  : 'bg-transparent border-transparent cursor-default'
              }
            `}
            style={{ width: '48px', height: '54px' }}
          >
            {/* 駒画像を表示 */}
            <div className="relative w-full h-full">
              <Image
                src={getPieceImagePath(pieceFolder, kind, targetPlayer)}
                alt={kind}
                fill
                className="object-contain drop-shadow-md"
                draggable={false}
              />
            </div>

            {/* 枚数バッジ */}
            {group.count > 1 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-white z-10">
                {group.count}
              </span>
            )}
          </button>
        );
      })}

      {pieces.length === 0 && (
        <span className="text-sm text-stone-400">なし</span>
      )}
      {children}
    </div>
  );
};