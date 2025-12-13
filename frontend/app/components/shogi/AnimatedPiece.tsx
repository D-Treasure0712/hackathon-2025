'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { PieceKind, Color, MoveAnimationState } from './types';

// 駒画像パスを取得する関数
const getPieceImagePath = (folder: string, kind: PieceKind, color: Color): string => {
  const prefix = color === 0 ? '0' : '1';
  const pieceKind = (kind === 'OU' && color === 1) ? 'GY' : kind;
  return `/pieces/${folder}/${prefix}${pieceKind}.svg`;
};

interface AnimatedPieceProps {
  animationState: MoveAnimationState;
  pieceFolder: string;
  squareSize: number;
  onAnimationComplete: () => void;
  onLanded?: () => void;
}

/**
 * framer-motion を使用したスムーズなスライドアニメーション
 * シンプルで高速な直線移動
 */
export const AnimatedPiece: React.FC<AnimatedPieceProps> = ({
  animationState,
  pieceFolder,
  squareSize,
  onAnimationComplete,
  onLanded,
}) => {
  const { fromPosition, toPosition, isCapture } = animationState;
  const onCompleteRef = useRef(onAnimationComplete);
  const onLandedRef = useRef(onLanded);
  onCompleteRef.current = onAnimationComplete;
  onLandedRef.current = onLanded;

  // 移動量を計算
  const moveX = toPosition.x - fromPosition.x;
  const moveY = toPosition.y - fromPosition.y;

  /* 
   * アニメーション制御
   * sequence:
   * 1. Moving (移動)
   * 2. Landed (着地) -> 爆発エフェクト開始
   * 3. (If Capture) Wait (爆発待ち)
   * 4. (If Promote) Floating (浮き上がり + 光る?) -> Flip (回転して種類変更) -> Landing (再着地)
   * 5. Complete
   */
  const [displayedKind, setDisplayedKind] = React.useState(animationState.pieceKind);
  const controls = useAnimation();

  useEffect(() => {
    const runSequence = async () => {
      // 1. 移動
      await controls.start({
        x: moveX,
        y: moveY,
        scale: animationState.isDrop ? 1.0 : 1.05,
        transition: {
          duration: animationState.isDrop ? 0.6 : 0.4,
          ease: animationState.isDrop ? "easeInOut" : "circOut", // 移動はキビキビと
          type: "tween"
        }
      });

      // 2. 着地 ( & 爆発エフェクト開始)
      if (onLandedRef.current) {
        onLandedRef.current();
      }

      // 3. 待機 (爆発エフェクトがある場合)
      if (animationState.isCapture) {
        await new Promise(resolve => setTimeout(resolve, 600)); // 爆発エフェクトの継続時間に合わせて待機
      }

      // 4. 成りアニメーション
      if (animationState.promote && animationState.promotedKind) {
        // 浮き上がり & 回転開始 (90度まで)
        await controls.start({
          scale: 1.5,
          rotateY: 90,
          transition: { duration: 0.3, ease: "easeIn" }
        });

        // 種類変更 (裏返す)
        setDisplayedKind(animationState.promotedKind);

        // 回転終了 (-90度から戻るように見せるため、一度瞬時に-90度にする手もあるが、
        // framer-motionは賢いのでそのまま90->180と回しても良いし、
        // ここではシンプルに 90度で画像切り替え -> 0度に戻す(逆回転) or 180度へ進む
        // 3D的な裏返しなら 0 -> 90 (画像変更) -> 0 に戻る動きが「めくる」感じに近い
        // ただし rotateY: 90 の状態で画像を変えて rotateY: 0 に戻すと
        // 「開いた扉を閉じる」みたいになる。
        // 「ひっくり返す」なら 0 -> 90 (変) -> 180 (完) だが、画像が反転してしまう。
        // 90度で画像変えて、scale戻しつつ 0度に戻すのが視覚的には「ポンと裏返った」感が出る
        
        // ここでは 90 -> 0 に戻す動きを採用
        await controls.start({
          scale: 1.0,
          rotateY: 0,
          transition: { duration: 0.3, ease: "easeOut" }
        });
      }

      // 5. 完了
      onCompleteRef.current();
    };

    runSequence();
  }, [controls, moveX, moveY, animationState.isDrop, animationState.promote, animationState.promotedKind, animationState.isCapture]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: fromPosition.x,
        top: fromPosition.y,
        width: squareSize,
        height: squareSize,
        pointerEvents: 'none',
        zIndex: 50,
        filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))',
      }}
      initial={{
        x: 0,
        y: 0,
        scale: 1,
        rotateY: 0
      }}
      animate={controls}
    >
      <Image
        src={getPieceImagePath(pieceFolder, displayedKind, animationState.pieceColor)}
        alt="移動中の駒"
        fill
        className="object-contain"
        draggable={false}
        priority
      />
    </motion.div>
  );
};

export default AnimatedPiece;
