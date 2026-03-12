import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">
        运程管家 · 司机出车记录系统
      </h1>
      <p className="mb-4 text-sm text-slate-600">
        Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui 脚手架已就绪。
      </p>
      <Button>
        这是一个 shadcn/ui Button
      </Button>
      <p className="mt-4 text-xs text-slate-500">
        当前阶段：任务 0-3 —— 验证 shadcn/ui 是否接入成功。
      </p>
    </main>
  );
}

