'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface GameMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResignRequest: () => void;
  onRestart: () => void;
  onConnect: () => void;
}

export const GameMenuDialog: React.FC<GameMenuDialogProps> = ({
  isOpen,
  onClose,
  onResignRequest,
  onRestart,
  onConnect,
}) => {
  const [showRestartWarn, setShowRestartWarn] = useState(false);

  // ダイアログが開閉されるたびに内部状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setShowRestartWarn(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-6 m-4 w-full max-w-sm border border-stone-200 dark:border-zinc-700"
            onClick={e => e.stopPropagation()}
          >
            {!showRestartWarn ? (
              <>
                <h2 className="text-xl font-bold text-center text-zinc-800 dark:text-zinc-100 mb-6">
                  メニュー
                </h2>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      onClose();
                      onResignRequest();
                    }}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl"></span> 投了
                  </button>
                  <button
                    onClick={() => setShowRestartWarn(true)}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl"></span> 最初から
                  </button>
                  <Link
                    href="/"
                    className="
                        w-full py-3 px-4 rounded-lg
                        bg-blue-400 hover:bg-blue-400
                        text-white dark:text-zinc-300 font-bold text-lg
                        transition-all text-center
                      "
                  >
                    タイトルに戻る
                  </Link>
                </div>
                <div className="mt-6 text-center">
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl"></span> 閉じる
                  </button>
                </div>
              </>
            ) : (
              // 警告モード: ResignConfirmDialogとデザインを統一
              <>
                <div className="text-center text-4xl mb-4">⚠️</div>
                <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-white">
                  最初から始めますか？
                </h2>
                <p className="text-center text-zinc-600 dark:text-zinc-400 mb-6">
                  現在の対局データは失われます。
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
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
                    onClick={() => {
                      onRestart();
                      onConnect();
                      onClose();
                    }}
                    className="
                          flex-1 py-3 px-4 rounded-lg
                          bg-amber-500
                          text-white font-bold text-lg
                          hover:bg-amber-600
                          transition-all
                          shadow-md
                        "
                  >
                    最初から
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
