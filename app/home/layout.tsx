"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type MeResponse =
  | { ok: true; user: { id: string; name: string | null; phone: string; role: string } }
  | { ok: false; error: string };

function formatTodayLabel() {
  const d = new Date();
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month} 月 ${day} 日 · 周${weekday}`;
}

const tabs = [
  { href: "/home/today", label: "今日出车" },
  { href: "/home/monthly", label: "当月总结" },
  { href: "/home/me", label: "我的" },
];

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  /** 避免 SSR 与客户端时区不一致导致 hydration mismatch */
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setTodayLabel(formatTodayLabel());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/auth/me");
        const json = (await res.json()) as MeResponse;
        if (!cancelled) setMe(json);
      } catch {
        if (!cancelled) setMe({ ok: false, error: "未登录" });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const initial =
    me && me.ok
      ? (me.user.name?.[0] ?? me.user.phone?.slice(-1) ?? "?")
      : "?";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
          >
            {initial}
          </button>
          <div className="flex-1 text-left">
            <p className="text-xs text-slate-500">
              {me && me.ok ? "欢迎回来" : "欢迎使用运程管家，"}
            </p>
            <p className="text-sm font-medium text-slate-900">
              {me && me.ok ? me.user.name || me.user.phone : "请先登录"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">今天</p>
            <p className="text-xs font-medium text-slate-700">
              {todayLabel || "\u00a0"}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-16 pt-4">
        <div className="mx-auto w-full max-w-md">
          {children}
        </div>
      </main>

      <nav className="sticky bottom-0 z-20 border-t border-slate-100 bg-white/90 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1"
              >
                <Button
                  type="button"
                  variant={active ? "default" : "ghost"}
                  className={
                    active
                      ? "h-9 w-full rounded-full text-xs font-medium"
                      : "h-9 w-full rounded-full text-xs font-medium text-slate-500"
                  }
                >
                  {tab.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

