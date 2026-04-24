"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "forbidden") {
      showToast("error", "需要管理员权限，请使用 admin/admin 登录。");
    }
  }, []);

  async function handleLogin() {
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "登录失败");
      }
      showToast("success", "登录成功");
      router.push("/admin");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={
            toast.type === "success"
              ? "fixed right-4 top-4 z-50 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg"
              : "fixed right-4 top-4 z-50 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white shadow-lg"
          }
        >
          {toast.text}
        </div>
      )}
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6">
          <p className="text-xs font-medium tracking-wide text-primary">
            运程管家 · 管理端
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            管理员登录
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            使用固定账号密码登录：admin / admin（仅用于开发环境）。
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              用户名
            </label>
            <input
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              密码
            </label>
            <input
              type="password"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="pt-2">
            <Button
              type="button"
              className="h-10 w-full rounded-full text-sm font-medium"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </div>

        </div>
      </div>
    </main>
  );
}

