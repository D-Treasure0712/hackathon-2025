/**
 * PromotionDialog コンポーネント
 * 成り選択ダイアログ
 */

'use client';

import React from 'react';

// =====================================
// Props定義
// =====================================

export interface PromotionDialogProps {
  /** 表示するかどうか */
  isOpen: boolean;
  /** 成り選択コールバック */
  onSelect: (promote: boolean) => void;
}

// =====================================
// コンポーネント
// =====================================

/**
 * 成り選択ダイアログ
 */
export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  isOpen,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-6 m-4 max-w-sm w-full">
        {/* タイトル */}
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-white">
          成りますか？
        </h2>

        {/* ボタン */}
        <div className="flex gap-4">
          <button
            onClick={() => onSelect(true)}
            className="
              flex-1 py-3 px-4 rounded-lg
              bg-gradient-to-r from-red-500 to-orange-500
              text-white font-bold text-lg
              hover:from-red-600 hover:to-orange-600
              transition-all shadow-lg hover:shadow-xl
            "
          >
            成る
          </button>
          <button
            onClick={() => onSelect(false)}
            className="
              flex-1 py-3 px-4 rounded-lg
              bg-zinc-200 dark:bg-zinc-700
              text-zinc-700 dark:text-zinc-300 font-bold text-lg
              hover:bg-zinc-300 dark:hover:bg-zinc-600
              transition-all
            "
          >
            成らない
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionDialog;
