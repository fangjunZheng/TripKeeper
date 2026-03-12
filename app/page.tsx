export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <h1 className="mb-2 text-2xl font-semibold">
        运程管家 · 司机出车记录系统
      </h1>
      <p className="mb-4 text-sm text-slate-600">
        Next.js 15 + TypeScript + Tailwind CSS 脚手架已就绪。
      </p>
      <button className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
        这是一个 Tailwind 按钮
      </button>
      <p className="mt-4 text-xs text-slate-500">
        当前阶段：任务 0-2 —— 验证 Tailwind 样式是否生效。
      </p>
    </main>
  );
}

