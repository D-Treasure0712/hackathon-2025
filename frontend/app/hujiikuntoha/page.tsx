'use client';

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";

// --- データの定義 ---
const timelineData = [
  {
    date: "2002年 7月19日",
    title: "藤井聡太 誕生",
    desc: "愛知県瀬戸市にて生を受ける。",
  },
  {
    date: "2012年 9月",
    title: "奨励会入会（6級）",
    desc: "",
  },
  {
    date: "2016年 10月1日",
    title: "四段昇段（プロ入り）",
    desc: "14歳2ヶ月でのプロ入りは、加藤一二三九段の記録を62年ぶりに更新する史上最年少記録。中学生棋士は史上5人目。",
  },
  {
    date: "2017年 6月26日",
    title: "公式戦29連勝達成",
    desc: "デビューからの無敗記録として、神谷広志八段の持つ歴代最多連勝記録（28連勝）を30年ぶりに更新。",
  },
  {
    date: "2018年 2月17日",
    title: "第11回朝日杯将棋オープン戦 優勝、六段昇段",
    desc: "全棋士参加棋戦優勝の史上最年少記録。",
  },
  {
    date: "2018年 5月18日",
    title: "七段昇段",
    desc: "竜王ランキング戦連続昇級による。",
  },
  {
    date: "2020年 7月16日",
    title: "初タイトル「棋聖」獲得",
    desc: "第91期棋聖戦で渡辺明棋聖に勝利。17歳11ヶ月でのタイトル獲得は史上最年少記録。",
  },
  {
    date: "2020年 8月20日",
    title: "「王位」獲得（二冠）、八段昇段",
    desc: "第61期王位戦で木村一基王位に勝利。史上最年少での二冠達成および八段昇段。",
  },
  {
    date: "2021年 9月13日",
    title: "「叡王」獲得（三冠）",
    desc: "第6期叡王戦で豊島将之叡王に勝利。史上最年少三冠。",
  },
  {
    date: "2021年 11月13日",
    title: "「竜王」獲得（四冠）、九段昇段",
    desc: "第34期竜王戦で豊島将之竜王に勝利。最高位である竜王を奪取し、序列1位に。",
  },
  {
    date: "2022年 2月12日",
    title: "「王将」獲得（五冠）",
    desc: "第71期王将戦で渡辺明王将に勝利。史上最年少五冠。",
  },
  {
    date: "2023年 3月19日",
    title: "「棋王」獲得（六冠）",
    desc: "第48期棋王戦で渡辺明棋王に勝利。史上最年少六冠。",
  },
  {
    date: "2023年 6月1日",
    title: "「名人」獲得（七冠）",
    desc: "第81期名人戦で渡辺明名人に勝利。谷川浩司十七世名人の記録を更新する史上最年少名人（20歳10ヶ月）となり、同時に七冠を達成。",
  },
  {
    date: "2023年 10月11日",
    title: "「王座」獲得（八冠）",
    desc: "第71期王座戦で永瀬拓矢王座に勝利。将棋界史上初となる全八冠独占を達成。",
  },
  {
    date: "2024年 6月20日",
    title: "叡王失冠（七冠へ後退）",
    desc: "第9期叡王戦で伊藤匠七段に敗れる。タイトル戦での敗退は初。",
  },
  {
    date: "2024年 7月1日",
    title: "「永世棋聖」資格獲得",
    desc: "第95期棋聖戦を防衛し、タイトル通算5期により史上最年少での永世称号資格を獲得。",
  },
];

// --- アニメーション設定 ---
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-stone-200 font-serif selection:bg-amber-900 selection:text-white">
      {/* 背景装飾（和風の霞のようなグラデーション） */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-950/80 to-transparent opacity-60" />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-radial-gradient from-blue-900/20 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 flex flex-col gap-24">
        
        {/* === 1. ヘッダー＆導入セクション === */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center space-y-12"
        >
          {/* タイトル */}
          <div className="relative inline-block py-4 px-12 border-y border-stone-600">
            <h1 className="text-3xl md:text-5xl font-bold tracking-[0.2em] text-white drop-shadow-lg">
              藤井君とは
            </h1>
            <div className="absolute -top-1 left-0 w-4 h-4 border-t border-l border-amber-500" />
            <div className="absolute -bottom-1 right-0 w-4 h-4 border-b border-r border-amber-500" />
          </div>

          {/* 導入テキスト */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 md:p-12 rounded-sm shadow-2xl space-y-6 text-left leading-loose tracking-wider">
            <p>
              <span className="font-bold text-amber-400 text-lg">「藤井君」</span>とは、
              技育CAMP2025ハッカソン Vol.15で、チーム<span className="font-bold border-b border-amber-500/50 mx-1">「田中角行」</span>から作成された、
              最強の棋士「藤井聡太」と戦うことができるWebアプリである。
            </p>
            <p>
              この世に藤井聡太は1人しかいない。<br />
              だが、棋士「藤井聡太」と戦いたいアマチュアの猛者たちは世の中にごまんといる。<br />
              そのニッチなニーズを叶えるためにこのアプリは作成された。
            </p>
          </div>
        </motion.section>


        {/* === 2. 年表セクション === */}
        <section className="relative">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-2xl font-bold text-center mb-16 tracking-widest text-amber-500"
          >
            ー 藤井聡太 棋士遍歴 ー
          </motion.h2>

          {/* 縦線 */}
          <div className="absolute left-4 md:left-1/2 top-16 bottom-0 w-px bg-gradient-to-b from-amber-500/0 via-amber-500/50 to-amber-500/0 md:-translate-x-1/2" />

          <div className="space-y-12">
            {timelineData.map((item, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className={`relative flex flex-col md:flex-row gap-4 md:gap-0 items-start ${
                  index % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* 1. コンテンツ部分 */}
                <div className="w-full md:w-1/2 pl-12 md:pl-6 md:px-12">
                  <div className={`space-y-2 ${index % 2 === 0 ? "md:text-left" : "md:text-right"}`}>
                    <span className="inline-block text-amber-400 font-bold text-lg tracking-widest border-b border-amber-500/30 pb-1 mb-1">
                      {item.date}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                      {item.title}
                    </h3>
                    {item.desc && (
                      <p className="text-stone-400 text-sm md:text-base leading-loose mt-2">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. 中央の丸（ドット） */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)] transform -translate-x-1.5 md:-translate-x-1.5 mt-2 z-10 border border-slate-900" />
                
                {/* 3. 反対側の空白（レイアウト調整用） */}
                <div className="w-full md:w-1/2 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </section>


        {/* === 3. 現在セクション === */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 p-8 md:p-12 rounded-lg text-center space-y-6 shadow-2xl"
        >
          <h3 className="text-2xl font-bold text-white tracking-[0.3em] mb-4">
            現在の藤井君
          </h3>
          <p className="leading-loose tracking-wider text-stone-300">
            上記のように、史上初の八冠独占という偉業を成し遂げた後、<br className="hidden md:block" />
            現在は七冠（竜王・名人・王位・王座・棋王・王将・棋聖）を保持し、<br className="hidden md:block" />
            将棋界の第一人者として君臨しています。
          </p>
          {/* 装飾用アイコン的なもの */}
          <div className="pt-6 flex justify-center gap-4 opacity-50">
            <div className="w-2 h-2 bg-amber-500 rotate-45" />
            <div className="w-2 h-2 bg-amber-500 rotate-45" />
            <div className="w-2 h-2 bg-amber-500 rotate-45" />
          </div>
        </motion.section>

        {/* === 戻るボタン === */}
        <div className="flex justify-center pb-12">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-transparent border border-white/30 rounded-full hover:bg-white/10 hover:border-white/60 focus:outline-none"
          >
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            <span className="relative tracking-widest group-hover:scale-105 transition-transform">
              タイトルへ戻る
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
}