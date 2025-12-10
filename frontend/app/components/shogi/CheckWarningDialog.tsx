'use client';

import React from 'react';

export interface CheckWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CheckWarningDialog: React.FC<CheckWarningDialogProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-6 m-4 max-w-sm w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-red-600">
                    ⚠️ 王手です！
                </h2>
                <p className="text-center text-zinc-700 dark:text-zinc-300 mb-6">
                    その手では王手を回避できません。<br />
                    別の手を選んでください。
                </p>
                <button
                    onClick={onClose}
                    className="
            w-full py-3 px-4 rounded-lg
            bg-gradient-to-r from-blue-500 to-blue-600
            text-white font-bold text-lg
            hover:from-blue-600 hover:to-blue-700
            transition-all shadow-lg hover:shadow-xl
          "
                >
                    了解
                </button>
            </div>
        </div>
    );
};

export default CheckWarningDialog;
