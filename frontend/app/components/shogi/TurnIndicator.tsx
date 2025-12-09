'use client';

import React from 'react';
import { Color } from './types';

interface TurnIndicatorProps {
  currentPlayer: Color;
  winner: Color | null;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ currentPlayer, winner }) => {
  if (winner !== null) {
    return (
      <div className="text-xl md:text-2xl font-bold text-red-600 my-4 px-6 py-2 bg-red-50 rounded-full border-2 border-red-200">
        {winner === 0 ? '☗ 先手' : '☖ 後手'} の勝ち！
      </div>
    );
  }

  return (
    <div className={`
      text-lg md:text-xl font-bold my-4 px-8 py-2 rounded-full border-2 transition-colors
      ${currentPlayer === 0 
        ? 'bg-blue-50 border-blue-400 text-blue-900' 
        : 'bg-green-50 border-green-400 text-green-900'
      }
    `}>
      手番: {currentPlayer === 0 ? '☗ 先手' : '☖ 後手'}
    </div>
  );
};