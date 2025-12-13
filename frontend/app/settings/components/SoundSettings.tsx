'use client'; 

import { useState, useRef, useEffect } from 'react';

export default function SoundSettings() {
  // === 状態管理（State） ===
  // 画面に表示する数値や、再生中かどうかのフラグです。
  // set〇〇を使うと、値が更新されて画面の見た目も変わります。
  const [bgmVolume, setBgmVolume] = useState<number>(30);
  const [seVolume, setSeVolume] = useState<number>(80);
  
  // 変更点：どちらの曲を再生中か管理するフラグを分けました
  const [isPlayingHome, setIsPlayingHome] = useState<boolean>(false); // 野山用
  const [isPlayingGame, setIsPlayingGame] = useState<boolean>(false); // 朧月用

  // === プレイヤーの保持（Ref） ===
  // 音楽ファイルの実体です。画面が再描画されてもリセットされない「箱」に入れておきます。
  const homeBgmPlayer = useRef<HTMLAudioElement | null>(null); // 追加：野山用
  const gameBgmPlayer = useRef<HTMLAudioElement | null>(null); // 追加：朧月用
  const sePlayer = useRef<HTMLAudioElement | null>(null);

  // === 初期設定（Effect） ===
  // 画面が開かれた瞬間に「1回だけ」実行されます。
  useEffect(() => {
    // 1. 音声ファイルをセット
    // ホーム画面用
    homeBgmPlayer.current = new Audio('/sounds/野山.mp3'); 
    homeBgmPlayer.current.loop = true;
    
    // 対局画面用
    gameBgmPlayer.current = new Audio('/sounds/覗くは朧月.mp3'); 
    gameBgmPlayer.current.loop = true; 

    // 効果音用
    sePlayer.current = new Audio('/sounds/将棋の駒を打つ.mp3');

    // 2. ブラウザの保存データ（localStorage）があれば読み込む
    const savedBgmVolume = localStorage.getItem('shogi_bgm_volume');
    if (savedBgmVolume) {
      const volumeNum = Number(savedBgmVolume);
      setBgmVolume(volumeNum);
      // 両方のプレイヤーに初期音量を適用
      homeBgmPlayer.current.volume = volumeNum / 100;
      gameBgmPlayer.current.volume = volumeNum / 100;
    } else {
      // データがなければ初期値
      homeBgmPlayer.current.volume = 30 / 100; 
      gameBgmPlayer.current.volume = 30 / 100;
    }

    // SEも同様に読み込み
    const savedSeVolume = localStorage.getItem('shogi_se_volume');
    if (savedSeVolume) {
      setSeVolume(Number(savedSeVolume));
    }

    // 3. お片付け（画面を閉じた時に音を止める）
    return () => {
      if (homeBgmPlayer.current) {
        homeBgmPlayer.current.pause();
        homeBgmPlayer.current = null;
      }
      if (gameBgmPlayer.current) {
        gameBgmPlayer.current.pause();
        gameBgmPlayer.current = null;
      }
    };
  }, []);

  // === 操作時の処理 ===

  // BGMスライダーを動かした時（一括設定）
  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setBgmVolume(newVolume); // 画面の数値を更新
    
    // ここでブラウザに保存（次回アクセス時に設定を引き継ぐため）
    // 対局用とホーム用の両方のキーに同じ値を保存します
    localStorage.setItem('shogi_bgm_volume', newVolume.toString());
    
    // 実際に鳴っている音量も即座に変更（両方に適用）
    if (homeBgmPlayer.current) {
      homeBgmPlayer.current.volume = newVolume / 100;
    }
    if (gameBgmPlayer.current) {
      gameBgmPlayer.current.volume = newVolume / 100;
    }
  };

  // ホームBGM（野山）の再生テスト
  const toggleHomeBgm = () => {
    if (!homeBgmPlayer.current) return;

    // もし対局BGMが鳴っていたら止める（混ざらないように）
    if (isPlayingGame && gameBgmPlayer.current) {
      gameBgmPlayer.current.pause();
      setIsPlayingGame(false);
    }

    if (isPlayingHome) {
      homeBgmPlayer.current.pause();
      setIsPlayingHome(false);
    } else {
      homeBgmPlayer.current.volume = bgmVolume / 100;
      homeBgmPlayer.current.play().catch(e => console.error("再生エラー:", e));
      setIsPlayingHome(true);
    }
  };

  // 対局BGM（朧月）の再生テスト
  const toggleGameBgm = () => {
    if (!gameBgmPlayer.current) return;

    // もしホームBGMが鳴っていたら止める
    if (isPlayingHome && homeBgmPlayer.current) {
      homeBgmPlayer.current.pause();
      setIsPlayingHome(false);
    }

    if (isPlayingGame) {
      gameBgmPlayer.current.pause();
      setIsPlayingGame(false);
    } else {
      gameBgmPlayer.current.volume = bgmVolume / 100;
      gameBgmPlayer.current.play().catch(e => console.error("再生エラー:", e));
      setIsPlayingGame(true);
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
            {/* ホームBGM テストボタン */}
            <button
              onClick={toggleHomeBgm}
              className={`text-xs px-2 py-1 rounded transition-colors font-bold border ${
                isPlayingHome 
                  ? "bg-amber-600 text-white border-amber-700 hover:bg-amber-700" 
                  : "bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200"
              }`}
            >
              {isPlayingHome ? "■ HOME" : "▶ HOME"}
            </button>

            {/* 対局BGM テストボタン */}
            <button
              onClick={toggleGameBgm}
              className={`text-xs px-2 py-1 rounded transition-colors font-bold border ${
                isPlayingGame 
                  ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700" 
                  : "bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200"
              }`}
            >
              {isPlayingGame ? "■ GAME" : "▶ GAME"}
            </button>

            <span className="text-stone-500 text-sm w-8 text-right ml-1">
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