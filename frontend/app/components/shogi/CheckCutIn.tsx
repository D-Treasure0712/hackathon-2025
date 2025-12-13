'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Color } from './types';

interface CheckCutInProps {
    /** 王手をかけた側 */
    attackerColor: Color;
    /** アニメーション完了コールバック */
    onComplete: () => void;
}

/**
 * 王手カットインアニメーション
 * 画面全体にダイナミックな「王手！」演出
 */
export const CheckCutIn: React.FC<CheckCutInProps> = ({
    attackerColor,
    onComplete,
}) => {
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        const timer = setTimeout(() => {
            onCompleteRef.current();
        }, 2200); // 表示時間を延長
        return () => clearTimeout(timer);
    }, []);

    const isFirst = attackerColor === 0;
    const bgGradient = isFirst
        ? 'linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.95) 100%)'
        : 'linear-gradient(135deg, rgba(34,197,94,0.9) 0%, rgba(22,163,74,0.95) 100%)';
    const accentColor = isFirst ? '#60a5fa' : '#4ade80';

    return (
        <motion.div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
        >
            {/* 背景オーバーレイ */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0.8, 0] }}
                transition={{ duration: 2.2, times: [0, 0.1, 0.5, 0.85, 1] }}
            />

            {/* 斜めストライプ（左から右へスライド） */}
            <motion.div
                style={{
                    position: 'absolute',
                    width: '200%',
                    height: '30vh',
                    background: bgGradient,
                    transform: 'skewY(-8deg)',
                    boxShadow: `0 0 60px ${accentColor}`,
                }}
                initial={{ x: '-100%' }}
                animate={{ x: ['-100%', '0%', '0%', '0%', '100%'] }}
                transition={{
                    duration: 2.2,
                    times: [0, 0.12, 0.5, 0.85, 1],
                    ease: [0.22, 1, 0.36, 1],
                }}
            />

            {/* 王手テキスト */}
            <motion.div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}
                initial={{ scale: 0, rotate: -10 }}
                animate={{
                    scale: [0, 1.3, 1, 1, 1],
                    rotate: [-10, 5, 0, 0, 0],
                    opacity: [0, 1, 1, 1, 0],
                }}
                transition={{
                    duration: 2.2,
                    times: [0, 0.12, 0.2, 0.85, 1],
                    ease: [0.34, 1.56, 0.64, 1],
                }}
            >
                {/* メインテキスト */}
                <motion.span
                    style={{
                        fontSize: 'clamp(4rem, 15vw, 10rem)',
                        fontWeight: 900,
                        color: 'white',
                        textShadow: `
              0 0 20px ${accentColor},
              0 0 40px ${accentColor},
              0 0 60px ${accentColor},
              4px 4px 0 rgba(0,0,0,0.3)
            `,
                        letterSpacing: '0.2em',
                        fontFamily: 'serif',
                    }}
                    animate={{
                        textShadow: [
                            `0 0 20px ${accentColor}, 0 0 40px ${accentColor}, 0 0 60px ${accentColor}, 4px 4px 0 rgba(0,0,0,0.3)`,
                            `0 0 40px ${accentColor}, 0 0 80px ${accentColor}, 0 0 120px ${accentColor}, 4px 4px 0 rgba(0,0,0,0.3)`,
                            `0 0 20px ${accentColor}, 0 0 40px ${accentColor}, 0 0 60px ${accentColor}, 4px 4px 0 rgba(0,0,0,0.3)`,
                        ],
                    }}
                    transition={{ duration: 0.6, repeat: 3 }}
                >
                    王手！
                </motion.span>

                {/* サブテキスト */}
                <motion.span
                    style={{
                        fontSize: 'clamp(1rem, 4vw, 2rem)',
                        fontWeight: 700,
                        color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                        letterSpacing: '0.5em',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: [0, 1, 1, 1, 0], y: [20, 0, 0, 0, 0] }}
                    transition={{ duration: 2.2, times: [0, 0.15, 0.5, 0.85, 1] }}
                >
                    {isFirst ? '☗ 先手' : '☖ 後手'}
                </motion.span>
            </motion.div>

            {/* 閃光エフェクト */}
            <motion.div
                style={{
                    position: 'absolute',
                    width: '150%',
                    height: '150%',
                    background: `radial-gradient(circle, ${accentColor}40 0%, transparent 50%)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: [0, 2, 2.5],
                    opacity: [0, 0.8, 0],
                }}
                transition={{ duration: 0.6, delay: 0.1 }}
            />
        </motion.div>
    );
};

export default CheckCutIn;
