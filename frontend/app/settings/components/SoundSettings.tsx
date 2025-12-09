'use client'; 

import { useState, useRef, useEffect } from 'react';

export default function SoundSettings() {
  // === 状態管理（State） ===
  // 画面に表示する数値や、再生中かどうかのフラグです。
  // set〇〇を使うと、値が更新されて画面の見た目も変わります。
  const [bgmVolume, setBgmVolume] = useState<number>(30);
  const [seVolume, setSeVolume] = useState<number>(80);
  const [isPlayingBgm, setIsPlayingBgm] = useState<boolean>(false);

  // === プレイヤーの保持（Ref） ===
  // 音楽ファイルの実体です。画面が再描画されてもリセットされない「箱」に入れておきます。
  const bgmPlayer = useRef<HTMLAudioElement | null>(null);
  const sePlayer = useRef<HTMLAudioElement | null>(null);

  // === 初期設定（Effect） ===
  // 画面が開かれた瞬間に「1回だけ」実行されます。
  useEffect(() => {
    // 1. 音声ファイルをセット
    bgmPlayer.current = new Audio('/sounds/覗くは朧月.mp3'); 
    bgmPlayer.current.loop = true; // BGMはループ再生
    sePlayer.current = new Audio('/sounds/将棋の駒を打つ.mp3');

    // 2. ブラウザの保存データ（localStorage）があれば読み込む
    const savedBgmVolume = localStorage.getItem('shogi_bgm_volume');
    if (savedBgmVolume) {
      const volumeNum = Number(savedBgmVolume);
      setBgmVolume(volumeNum);
      bgmPlayer.current.volume = volumeNum / 100; // 音量は0.0~1.0で指定
    } else {
      bgmPlayer.current.volume = 30 / 100; // データがなければ初期値
    }

    // SEも同様に読み込み
    const savedSeVolume = localStorage.getItem('shogi_se_volume');
    if (savedSeVolume) {
      setSeVolume(Number(savedSeVolume));
    }

    // 3. お片付け（画面を閉じた時に音を止める）
    return () => {
      if (bgmPlayer.current) {
        bgmPlayer.current.pause();
        bgmPlayer.current = null;
      }
    };
  }, []);

  // === 操作時の処理 ===

  // BGMスライダーを動かした時
  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setBgmVolume(newVolume); // 画面の数値を更新
    
    // ここでブラウザに保存（次回アクセス時に設定を引き継ぐため）
    localStorage.setItem('shogi_bgm_volume', newVolume.toString());
    
    // 実際に鳴っている音量も即座に変更
    if (bgmPlayer.current) {
      bgmPlayer.current.volume = newVolume / 100;
    }
  };

  // 再生・停止ボタンを押した時
  const toggleBgm = () => {
    if (!bgmPlayer.current) return;
    if (isPlayingBgm) {
      bgmPlayer.current.pause();
      setIsPlayingBgm(false);
    } else {
      bgmPlayer.current.volume = bgmVolume / 100;
      bgmPlayer.current.play().catch(e => console.error("再生エラー:", e));
      setIsPlayingBgm(true);
    }
  };

  // SEスライダーを動かした時
  const handleSeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setSeVolume(newVolume);
    localStorage.setItem('shogi_se_volume', newVolume.toString());
  };

  // 音確認ボタンを押した時
  const playTestSe = () => {
    if (sePlayer.current) {
      sePlayer.current.volume = seVolume / 100;
      sePlayer.current.currentTime = 0; // 連打できるように再生位置をリセット
      sePlayer.current.play().catch(e => console.error("再生エラー:", e));
    }
  };

  // === 見た目（JSX） ===
  return (
    <div className="space-y-8">
      {/* 見出し */}
      <h2 className="text-xl font-bold text-stone-700 border-l-4 border-amber-500 pl-3">
        音量設定
      </h2>

      {/* --- BGMの設定エリア --- */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="bgm-slider" className="font-semibold text-stone-700">
            BGM
          </label>
          <div className="flex items-center gap-2">
            {/* 再生ボタン */}
            <button
              onClick={toggleBgm}
              className={`text-xs px-3 py-1 rounded-full transition-colors font-bold ${
                isPlayingBgm 
                  ? "bg-amber-600 text-white hover:bg-amber-700" 
                  : "bg-stone-200 text-stone-600 hover:bg-stone-300"
              }`}
            >
              {isPlayingBgm ? "■ 停止" : "▶ 再生テスト"}
            </button>
            <span className="text-stone-500 text-sm w-8 text-right">
              {bgmVolume}
            </span>
          </div>
        </div>
        {/* スライダー本体 */}
        <input
          id="bgm-slider"
          type="range"
          min="0"
          max="100"
          value={bgmVolume}
          onChange={handleBgmChange}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        />
      </div>

      {/* --- 効果音の設定エリア --- */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="se-slider" className="font-semibold text-stone-700">
            効果音
          </label>
          <span className="text-stone-500 text-sm w-8 text-right">
            {seVolume}
          </span>
        </div>
        <input
          id="se-slider"
          type="range"
          min="0"
          max="100"
          value={seVolume}
          onChange={handleSeChange}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        />
        <div className="flex justify-end mt-2">
          <button 
            onClick={playTestSe}
            className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1 rounded transition-colors border border-stone-300"
          >
            🔊 音を確認する
          </button>
        </div>
      </div>
    </div>
  );
}