'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PieceKind, Color } from './types';

// 駒画像パスを取得する関数
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
    const prefix = color === 0 ? '0' : '1';
    const pieceKind = (kind === 'OU' && color === 1) ? 'GY' : kind;
    return `/pieces/${folder}/${prefix}${pieceKind}.svg`;
};

// 成り後の駒種を取得
const getPromotedKind = (kind: PieceKind): PieceKind => {
    const promotionMap: Partial<Record<PieceKind, PieceKind>> = {
        'FU': 'TO', 'KY': 'NY', 'KE': 'NK', 'GI': 'NG', 'HI': 'RY', 'KA': 'UM'
    };
    return promotionMap[kind] || kind;
};

interface PromotionAnimationProps {
    /** 成る前の駒種 */
    originalKind: PieceKind;
    /** 駒の所有者 */
    color: Color;
    /** 駒画像フォルダ */
    pieceFolder: string;
    /** 表示位置 */
    position: { x: number; y: number };
    /** マスのサイズ */
    squareSize: number;
    /** アニメーション完了コールバック */
    onComplete: () => void;
}

/**
 * 成り演出アニメーション
 * 駒が回転しながら成り駒に変化する
 */
export const PromotionAnimation: React.FC<PromotionAnimationProps> = ({
    originalKind,
    color,
    pieceFolder,
    position,
    squareSize,
    onComplete,
}) => {
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const promotedKind = getPromotedKind(originalKind);

    useEffect(() => {
        const timer = setTimeout(() => {
            onCompleteRef.current();
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: squareSize,
                height: squareSize,
                pointerEvents: 'none',
                zIndex: 60,
                perspective: 1000,
            }}
        >
            {/* 背景のオーラエフェクト */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: -squareSize * 0.3,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,165,0,0.3) 40%, transparent 70%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: [0, 1.5, 1.2],
                    opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.8, times: [0, 0.3, 1] }}
            />

            {/* 回転する駒 */}
            <motion.div
                style={{
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 720 }} // 2回転
                transition={{
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1], // バウンス感
                }}
            >
                {/* 表面（元の駒） - 最初の半回転まで表示 */}
                <motion.div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                    }}
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{ duration: 0.7, times: [0, 0.35, 0.36, 1] }}
                >
                    <Image
                        src={getPieceImagePath(pieceFolder, originalKind, color)}
                        alt="成る前の駒"
                        fill
                        className="object-contain"
                        draggable={false}
                        priority
                    />
                </motion.div>

                {/* 裏面（成り駒） - 半回転後から表示 */}
                <motion.div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                    }}
                    animate={{ opacity: [0, 0, 1, 1] }}
                    transition={{ duration: 0.7, times: [0, 0.35, 0.36, 1] }}
                >
                    <Image
                        src={getPieceImagePath(pieceFolder, promotedKind, color)}
                        alt="成り駒"
                        fill
                        className="object-contain"
                        draggable={false}
                        priority
                    />
                </motion.div>
            </motion.div>

            {/* キラキラエフェクト */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#FFD700',
                        boxShadow: '0 0 8px #FFD700',
                    }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                        x: Math.cos((i / 6) * Math.PI * 2) * squareSize * 0.8,
                        y: Math.sin((i / 6) * Math.PI * 2) * squareSize * 0.8,
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: 0.6,
                        delay: 0.2 + i * 0.05,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </div>
    );
};

export default PromotionAnimation;
