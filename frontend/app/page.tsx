import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center justify-center gap-12 px-8 py-16">
        {/* ロゴ配置エリア */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            {/* ロゴプレースホルダー */}
            <span className="text-4xl">♟</span>
          </div>
        </div>

        {/* アプリ名 */}
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
          Fujii-Kun
        </h1>

        {/* サブタイトル（オプション） */}
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          将棋対局アプリ
        </p>

        {/* 対局開始ボタン */}
        <Link
          href="/game"
          className="flex h-14 w-48 items-center justify-center rounded-full bg-foreground px-6 text-lg font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          対局開始
        </Link>
      </main>
    </div>
  );
}

