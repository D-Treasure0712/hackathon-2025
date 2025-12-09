'use client'; 

import { useEffect, useRef } from 'react';

// このコンポーネントは、画面には何も表示せず「BGMを流す」
export default function BackgroundMusic() {
  // 音楽プレイヤーを保持する
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  // 画面が表示された時に1回だけ実行されます
  useEffect(() => {
    // 1. 音楽ファイルを準備
    // ※設定画面と同じファイルパスを指定
    const audio = new Audio('/sounds/覗くは朧月.mp3'); 
    audio.loop = true; // BGMなのでループ再生させます
    audioPlayer.current = audio;

    // 2. 設定画面で保存した音量データを読み込む
    const savedVolume = localStorage.getItem('shogi_bgm_volume');
    
    // データがあればその音量に、なければ小さめ(30%)に設定
    if (savedVolume) {
      audio.volume = Number(savedVolume) / 100;
    } else {
      audio.volume = 0.3;
    }

    // 3. 再生スタート！
    // ※ブラウザによっては自動再生がブロックされることがありますが、
    // ユーザーが「対局開始」ボタンなどを押して遷移してきた直後なら鳴ります
    audio.play().catch((err) => {
      console.log('自動再生がブロックされました:', err);
    });

    // 4. お片付け（画面を離れる時に音楽を止める）
    return () => {
      audio.pause();
      audioPlayer.current = null;
    };
  }, []);

  // この部品は音を鳴らすだけなので、画面には何も表示しません
  return null;
}