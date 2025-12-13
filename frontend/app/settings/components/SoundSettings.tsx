'use client'; 

import { useState, useRef, useEffect } from 'react';

export default function SoundSettings() {
  // === 状態管理（State） ===
  // 画面に表示する数値や、再生中かどうかのフラグです。
  // set〇〇を使うと、値が更新されて画面の見た目も変わります。
  const [homeBgmVolume, setHomeBgmVolume] = useState<number>(30); // 追加: ホームBGM用
  const [bgmVolume, setBgmVolume] = useState<number>(30);         // 対局BGM用
  const [seVolume, setSeVolume] = useState<number>(80);
  
  const [isPlayingHomeBgm, setIsPlayingHomeBgm] = useState<boolean>(false); // 追加: ホームBGM再生フラグ
  const [isPlayingBgm, setIsPlayingBgm] = useState<boolean>(false);         // 対局BGM再生フラグ

  // === プレイヤーの保持（Ref） ===
  // 音楽ファイルの実体です。画面が再描画されてもリセットされない「箱」に入れておきます。
  const homeBgmPlayer = useRef<HTMLAudioElement | null>(null); // 追加: ホームBGM用（野山）
  const bgmPlayer = useRef<HTMLAudioElement | null>(null);     // 対局BGM用（朧月）
  const sePlayer = useRef<HTMLAudioElement | null>(null);

  // === 初期設定（Effect） ===
  // 画面が開かれた瞬間に「1回だけ」実行されます。
  useEffect(() => {
    // 1. 音声ファイルをセット
    // 追加: ホームBGM（野山）を個別にセット
    homeBgmPlayer.current = new Audio('/sounds/野山.mp3'); 
    homeBgmPlayer.current.loop = true;

    // 対局BGM（覗くは朧月）
    bgmPlayer.current = new Audio('/sounds/覗くは朧月.mp3'); 
    bgmPlayer.current.loop = true; // BGMはループ再生
    sePlayer.current = new Audio('/sounds/将棋の駒を打つ.mp3');

    // 2. ブラウザの保存データ（localStorage）があれば読み込む
    
    // --- 追加: ホームBGMの読み込み処理 ---
    const savedHomeBgmVolume = localStorage.getItem('shogi_home_bgm_volume');
    if (savedHomeBgmVolume) {
      const volumeNum = Number(savedHomeBgmVolume);
      setHomeBgmVolume(volumeNum);
      homeBgmPlayer.current.volume = volumeNum / 100;
    } else {
      homeBgmPlayer.current.volume = 30 / 100; // 初期値
    }
    // ------------------------------------

    // 対局BGMの読み込み
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
      // 追加: ホームBGMの停止
      if (homeBgmPlayer.current) {
        homeBgmPlayer.current.pause();
        homeBgmPlayer.current = null;
      }
      if (bgmPlayer.current) {
        bgmPlayer.current.pause();
        bgmPlayer.current = null;
      }
    };
  }, []);

  // === 操作時の処理 ===

  // --- 追加: ホームBGMスライダーを動かした時 ---
  const handleHomeBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setHomeBgmVolume(newVolume);
    
    localStorage.setItem('shogi_home_bgm_volume', newVolume.toString());
    
    if (homeBgmPlayer.current) {
      homeBgmPlayer.current.volume = newVolume / 100;
    }
  };

  // --- 追加: ホームBGM再生・停止ボタン ---
  const toggleHomeBgm = () => {
    if (!homeBgmPlayer.current) return;
    
    // 混ざらないように、もし対局BGMが鳴っていたら止める
    if (isPlayingBgm && bgmPlayer.current) {
      bgmPlayer.current.pause();
      setIsPlayingBgm(false);
    }

    if (isPlayingHomeBgm) {
      homeBgmPlayer.current.pause();
      setIsPlayingHomeBgm(false);
    } else {
      homeBgmPlayer.current.volume = homeBgmVolume / 100;
      homeBgmPlayer.current.play().catch(e => console.error("再生エラー:", e));
      setIsPlayingHomeBgm(true);
    }
  };
  // -----------------------------------------

  // 対局BGMスライダーを動かした時
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

  // 対局BGM 再生・停止ボタンを押した時
  const toggleBgm = () => {
    if (!bgmPlayer.current) return;
    
    // 混ざらないように、もしホームBGMが鳴っていたら止める
    if (isPlayingHomeBgm && homeBgmPlayer.current) {
      homeBgmPlayer.current.pause();
      setIsPlayingHomeBgm(false);
    }

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

      {/* --- 追加: ホームBGM (野山) の設定エリア --- */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="home-bgm-slider" className="font-semibold text-stone-700">
            ホーム画面BGM
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleHomeBgm}
              className={`text-xs px-3 py-1 rounded-full transition-colors font-bold ${
                isPlayingHomeBgm 
                  ? "bg-amber-600 text-white hover:bg-amber-700" 
                  : "bg-stone-200 text-stone-600 hover:bg-stone-300"
              }`}
            >
              {isPlayingHomeBgm ? "■ 停止" : "▶ テスト"}
            </button>
            <span className="text-stone-500 text-sm w-8 text-right">
              {homeBgmVolume}
            </span>
          </div>
        </div>
        <input
          id="home-bgm-slider"
          type="range"
          min="0"
          max="100"
          value={homeBgmVolume}
          onChange={handleHomeBgmChange}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        />
      </div>

      {/* --- 対局BGM (朧月) の設定エリア --- */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="bgm-slider" className="font-semibold text-stone-700">
            対局画面BGM
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
              {isPlayingBgm ? "■ 停止" : "▶ テスト"}
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