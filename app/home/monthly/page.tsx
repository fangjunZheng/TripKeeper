"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DailySummary = {
  date: string;
  tripsCount: number;
  totalWeight: number;
};

type SummaryResponse =
  | { ok: true; summary: DailySummary[] }
  | { ok: false; error: string };

type Trip = {
  id: string;
  driverName: string;
  licensePlate: string;
  date: string;
  departureLocation: string;
  destination: string;
  cargoType: string;
  numberOfLoads: number;
  totalWeight: number;
  status: "IN_TRANSIT" | "COMPLETED";
};

type TripsListResponse =
  | { ok: true; trips: Trip[] }
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

  // 当日记录列表
  const [dayTrips, setDayTrips] = useState<Trip[]>([]);
  const [dayTripsLoading, setDayTripsLoading] = useState(false);
  const [dayTripsError, setDayTripsError] = useState<string | null>(null);

  useEffect(() => {
    if (!month) return;

    let cancelled = false;
    setSelectedDate(null);
    setDayTrips([]);

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

  // 点击柱状图后加载当日记录
  useEffect(() => {
    if (!selectedDate) {
      setDayTrips([]);
      return;
    }

    let cancelled = false;
    async function loadDayTrips() {
      setDayTripsLoading(true);
      setDayTripsError(null);
      try {
        const res = await fetch(`/api/trips/list?date=${encodeURIComponent(selectedDate!)}`);
        const json = (await res.json()) as TripsListResponse;
        if (!res.ok || !json.ok) {
          throw new Error(!json.ok ? json.error : "加载失败");
        }
        if (!cancelled) setDayTrips(json.trips ?? []);
      } catch (e) {
        if (!cancelled) {
          setDayTripsError(e instanceof Error ? e.message : "加载失败");
          setDayTrips([]);
        }
      } finally {
        if (!cancelled) setDayTripsLoading(false);
      }
    }
    loadDayTrips();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const maxTrips = useMemo(
    () => data.reduce((max, d) => Math.max(max, d.tripsCount), 0) || 1,
    [data],
  );

  const selectedSummary = selectedDate
    ? data.find((d) => d.date === selectedDate)
    : null;

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

            {selectedDate && selectedSummary && (
              <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                <p className="font-medium text-slate-700">{selectedDate}</p>
                <p className="mt-1 text-slate-600">
                  出车 {selectedSummary.tripsCount} 次 · 总吨数 {selectedSummary.totalWeight}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 当日记录列表 */}
      {selectedDate && (
        <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            {selectedDate} 出车记录
          </h2>

          {dayTripsLoading && (
            <p className="mt-3 text-sm text-slate-500">加载中...</p>
          )}
          {dayTripsError && (
            <p className="mt-3 text-xs text-red-500">{dayTripsError}</p>
          )}
          {!dayTripsLoading && !dayTripsError && dayTrips.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">当天暂无记录。</p>
          )}

          <div className="mt-3 space-y-2">
            {dayTrips.map((t) => (
              <Link
                key={t.id}
                href={`/home/today/${t.id}`}
                className="block rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {t.departureLocation} → {t.destination}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.driverName} · {t.licensePlate} · {t.cargoType}
                    </p>
                  </div>
                  <span
                    className={
                      t.status === "COMPLETED"
                        ? "shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                        : "shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700"
                    }
                  >
                    {t.status === "COMPLETED" ? "完成" : "运输中"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-500">车数</p>
                    <p className="mt-0.5 font-medium text-slate-900">{t.numberOfLoads}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-500">总吨数</p>
                    <p className="mt-0.5 font-medium text-slate-900">{t.totalWeight}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
