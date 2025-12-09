/**
 * ResignConfirmDialog コンポーネント
 * 投了確認ダイアログ
 */

'use client';

import React from 'react';

// =====================================
// Props定義
// =====================================

export interface ResignConfirmDialogProps {
  /** 表示するかどうか */
  isOpen: boolean;
  /** 確認コールバック（true: 投了する, false: キャンセル） */
  onConfirm: (confirm: boolean) => void;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 投了確認ダイアログ
 */
export const ResignConfirmDialog: React.FC<ResignConfirmDialogProps> = ({
  isOpen,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-6 m-4 max-w-sm w-full">
        {/* 警告アイコン */}
        <div className="text-center text-4xl mb-4">⚠️</div>

        {/* タイトル */}
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-white">
          投了しますか？
        </h2>

        {/* 説明 */}
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-6">
          投了すると負けが確定します。
        </p>

        {/* ボタン */}
        <div className="flex gap-4">
          <button
            onClick={() => onConfirm(false)}
            className="
              flex-1 py-3 px-4 rounded-lg
              bg-zinc-200 dark:bg-zinc-700
              text-zinc-700 dark:text-zinc-300 font-bold text-lg
              hover:bg-zinc-300 dark:hover:bg-zinc-600
              transition-all
            "
          >
            キャンセル
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="
              flex-1 py-3 px-4 rounded-lg
              bg-red-500
              text-white font-bold text-lg
              hover:bg-red-600
              transition-all
            "
          >
            投了する
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResignConfirmDialog;
