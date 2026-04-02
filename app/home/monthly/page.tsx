"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type DailySummary = {
  date: string;
  tripsCount: number;
  totalWeight: number;
};

type SummaryResponse =
  | { ok: true; summary: DailySummary[] }
  | { ok: false; error: string };

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function MonthlyPage() {
  const [month, setMonth] = useState("");

  useEffect(() => {
    setMonth(getCurrentMonth());
  }, []);
  const [data, setData] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!month) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/summary?month=${encodeURIComponent(month)}`);
        const json = (await res.json()) as SummaryResponse;
        if (res.status === 401 || (!json.ok && json.error === "Unauthorized")) {
          if (!cancelled) {
            setError("请先登录后查看当月总结。");
            setData([]);
          }
          return;
        }
        if (!res.ok || !json.ok) {
          throw new Error(!json.ok ? json.error : "加载失败");
        }
        if (!cancelled) {
          setData(json.summary ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "加载失败");
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const maxTrips = useMemo(
    () => data.reduce((max, d) => Math.max(max, d.tripsCount), 0) || 1,
    [data],
  );

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              当月总结
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              查看本月每天的出车次数与总吨数。
            </p>
          </div>
          <input
            type="month"
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-slate-500">加载中...</p>
        )}

        {error && !loading && (
          <p className="mt-4 text-xs text-red-500">{error}</p>
        )}

        {!loading && !error && data.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            当前月份还没有记录。
          </p>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-end gap-1 overflow-x-auto pb-2">
              {data.map((d) => {
                const height = (d.tripsCount / maxTrips) * 80 + 16;
                const active = selectedDate === d.date;
                const day = d.date.split("-")[2];
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate((prev) => (prev === d.date ? null : d.date))}
                    className="flex flex-col items-center gap-1 text-[10px]"
                  >
                    <div
                      className={[
                        "w-5 rounded-t-full transition",
                        active ? "bg-primary" : "bg-slate-200",
                      ].join(" ")}
                      style={{ height }}
                    />
                    <span className={active ? "text-primary font-medium" : "text-slate-500"}>
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                <p className="text-slate-500">
                  已选日期：{selectedDate}
                </p>
                <p className="mt-1 text-slate-700">
                  出车 {data.find((d) => d.date === selectedDate)?.tripsCount ?? 0} 次，
                  总吨数 {data.find((d) => d.date === selectedDate)?.totalWeight ?? 0}
                </p>
                <p className="mt-1 text-slate-400">
                  详细列表可后续接入 /api/trips/list?date=选中日期。
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white px-6 py-5 text-xs text-slate-500 shadow-sm ring-1 ring-slate-100">
        这里后续可以接入点击柱子后的当日 Trip 列表，以及跳转到历史记录等功能。
      </div>
    </div>
  );
}

