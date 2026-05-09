"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/lib/context/user-context";
import type { TripItem, TripsListResponse, CreateTripResponse } from "@/types/api";
import {
  Truck, Weight, Hash, Activity,
  MapPin, Navigation, Package, RefreshCw,
  ImageIcon, Calendar, ChevronRight,
} from "lucide-react";

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function TodayPage() {
  const { user, loading: meLoading, error: meError, refresh: refreshUser } = useUser();

  const [trips, setTrips] = useState<TripItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState({
    driverName: "",
    licensePlate: "",
    date: "",
    departureLocation: "",
    destination: "",
    cargoType: "",
    numberOfLoads: "1",
    totalWeight: "",
    status: "IN_TRANSIT" as "IN_TRANSIT" | "COMPLETED",
  });

  const [departureDocFiles, setDepartureDocFiles] = useState<File[]>([]);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [departureFileInputKey, setDepartureFileInputKey] = useState(0);

  // 客户端挂载后再写入「今天」，避免与 SSR 时区不一致导致 hydration 报错
  useEffect(() => {
    setForm((s) => ({ ...s, date: formatYmd(new Date()) }));
  }, []);

  // 当获取到当前用户信息后，只在初始为空时填充司机姓名
  useEffect(() => {
    if (user && !form.driverName) {
      setForm((s) => ({ ...s, driverName: user.name || user.phone }));
    }
  }, [user, form.driverName]);

  async function fetchTrips() {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/trips/list?date=${encodeURIComponent("today")}`);
      const json = (await res.json()) as TripsListResponse;
      if (res.status === 401 || (!json.ok && json.error === "Unauthorized")) {
        setListError(null);
        setTrips([]);
        return;
      }
      if (!res.ok || !json.ok) {
        throw new Error(!json.ok ? json.error : "加载失败");
      }
      setTrips(json.trips ?? []);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "加载失败");
      setTrips([]);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUnauthorized =
    !meLoading &&
    !user &&
    (meError === "Unauthorized" || meError === "未登录");

  const canUse = !meLoading && !!user;

  const stats = useMemo(() => {
    const tripsCount = trips.length;
    const totalLoads = trips.reduce((sum, t) => sum + (t.numberOfLoads ?? 0), 0);
    const totalWeight = trips.reduce((sum, t) => sum + (t.totalWeight ?? 0), 0);
    const inTransit = trips.filter((t) => t.status === "IN_TRANSIT").length;
    const completed = trips.filter((t) => t.status === "COMPLETED").length;
    return { tripsCount, totalLoads, totalWeight, inTransit, completed };
  }, [trips]);

  async function handleSubmit() {
    setSubmitLoading(true);
    setMessage(null);
    try {
      const numberOfLoads = Number(form.numberOfLoads);
      const totalWeight = Number(form.totalWeight);
      if (!Number.isFinite(numberOfLoads) || !Number.isFinite(totalWeight) || totalWeight <= 0) {
        throw new Error("车数/总吨数必须是数字");
      }

      const payload = {
        driverName: form.driverName,
        licensePlate: form.licensePlate,
        date: form.date,
        departureLocation: form.departureLocation,
        destination: form.destination,
        cargoType: form.cargoType,
        numberOfLoads,
        totalWeight,
        status: form.status,
      };

      const res = await fetch("/api/trips/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as CreateTripResponse;
      if (!res.ok || !json.ok) {
        const errMsg = !json.ok ? json.error : "创建失败";
        throw new Error(errMsg);
      }

      const tripId = json.trip.id;

      if (departureDocFiles.length > 0) {
        const uploads = departureDocFiles.map(async (file) => {
          const fd = new FormData();
          fd.append("tripId", tripId);
          fd.append("type", "DEPARTURE");
          fd.append("file", file, file.name);

          const r = await fetch("/api/trips/upload-image", {
            method: "POST",
            body: fd,
          });
          const j = await r.json();
          if (!r.ok || !j.ok) {
            throw new Error(!j.ok ? j.error : "图片上传失败");
          }
        });
        await Promise.all(uploads);
      }

      await fetchTrips();
      setMessage(null);
      setToast("录入成功");
      setDepartureDocFiles([]);
      setDepartureFileInputKey((k) => k + 1);
      setForm({
        driverName: user?.name || user?.phone || "",
        licensePlate: "",
        date: formatYmd(new Date()),
        departureLocation: "",
        destination: "",
        cargoType: "",
        numberOfLoads: "1",
        totalWeight: "",
        status: "IN_TRANSIT",
      });
      window.setTimeout(() => setToast(null), 2500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建失败");
      await refreshUser();
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="space-y-4 pb-2">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
      <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              今日出车
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {form.date
                ? `${form.date} · 录入并查看今天的出车记录`
                : "录入并查看今天的出车记录"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrips}
            disabled={listLoading}
            className="shrink-0 gap-1.5 rounded-full"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? "animate-spin" : ""}`} />
            {listLoading ? "刷新中" : "刷新"}
          </Button>
        </div>

        {meLoading && (
          <p className="mt-4 text-sm text-slate-500">加载中...</p>
        )}

        {!meLoading && isUnauthorized && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">
              当前未登录，请先通过手机号 + 验证码登录。
            </p>
            <Button
              className="w-full"
              onClick={() => { window.location.href = "/login"; }}
            >
              去登录
            </Button>
          </div>
        )}

        {!meLoading && user && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <StatCard icon={<Truck className="h-4 w-4" />} label="今日趟次" value={stats.tripsCount} color="blue" />
            <StatCard icon={<Hash className="h-4 w-4" />} label="总车数" value={stats.totalLoads} color="violet" />
            <StatCard icon={<Weight className="h-4 w-4" />} label="总吨数（吨）" value={stats.totalWeight} color="amber" />
            <StatCard icon={<Activity className="h-4 w-4" />} label="运输中/完成" value={`${stats.inTransit}/${stats.completed}`} color="emerald" />
          </div>
        )}
      </div>

      {canUse && (
        <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Truck className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">录入出车记录</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            填写今日出车信息，提交后自动归入记录。
          </p>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">司机姓名</label>
              <input
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-500 outline-none"
                value={form.driverName}
                readOnly
                placeholder="从当前登录用户读取"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">车牌号</label>
              <input
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                value={form.licensePlate}
                onChange={(e) => setForm((s) => ({ ...s, licensePlate: e.target.value }))}
                placeholder="例如：晋123456"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">日期</label>
                <input
                  type="date"
                  className="block w-full max-w-[12rem] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary sm:max-w-none"
                  value={form.date}
                  onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">状态</label>
                <select
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  value={form.status}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      status: e.target.value as "IN_TRANSIT" | "COMPLETED",
                    }))
                  }
                >
                  <option value="IN_TRANSIT">运输中</option>
                  <option value="COMPLETED">运输完成</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">出发地</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  value={form.departureLocation}
                  onChange={(e) => setForm((s) => ({ ...s, departureLocation: e.target.value }))}
                  placeholder="起点地址"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">目的地</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  value={form.destination}
                  onChange={(e) => setForm((s) => ({ ...s, destination: e.target.value }))}
                  placeholder="终点地址"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">运输品类</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  value={form.cargoType}
                  onChange={(e) => setForm((s) => ({ ...s, cargoType: e.target.value }))}
                  placeholder="砂石 / 煤 / 钢材…"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                出车单图片（可多张）
              </label>
              <input
                key={departureFileInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const next = e.target.files ? Array.from(e.target.files) : [];
                  setDepartureDocFiles(next);
                }}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              />
              {departureDocFiles.length > 0 ? (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                  <ImageIcon className="h-3 w-3" />
                  已选 {departureDocFiles.length} 张图片
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">上传后存入云存储，管理后台可查看。</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">车数</label>
                <input
                  inputMode="numeric"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  value={form.numberOfLoads}
                  onChange={(e) => setForm((s) => ({ ...s, numberOfLoads: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">总吨数</label>
                <input
                  inputMode="decimal"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  value={form.totalWeight}
                  onChange={(e) => setForm((s) => ({ ...s, totalWeight: e.target.value }))}
                />
              </div>
            </div>

            <div className="pt-1">
              <Button
                className="h-10 w-full rounded-full text-sm font-medium"
                onClick={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? "提交中..." : "提交"}
              </Button>
            </div>

            {message && (
              <p className="text-xs text-red-500">{message}</p>
            )}
          </div>
        </div>
      )}

      {canUse && (
        <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">今日记录</h2>
            <p className="text-xs text-slate-500">
              {listLoading ? "加载中..." : `${trips.length} 条`}
            </p>
          </div>

          {listError && (
            <p className="mt-3 text-xs text-red-500">{listError}</p>
          )}

          {!listLoading && !listError && trips.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              今天还没有记录，先提交一条吧。
            </p>
          )}

          <div className="mt-4 space-y-2.5">
            {trips.map((t) => (
              <Link
                key={t.id}
                href={`/home/today/${t.id}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-slate-200 hover:bg-slate-50/60 active:scale-[0.99]"
              >
                {/* 左侧图标 */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.status === "COMPLETED" ? "bg-emerald-50" : "bg-amber-50"}`}>
                  <Truck className={`h-5 w-5 ${t.status === "COMPLETED" ? "text-emerald-500" : "text-amber-500"}`} />
                </div>

                {/* 内容 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <span className="truncate">{t.departureLocation}</span>
                    <span className="shrink-0 text-slate-400">→</span>
                    <span className="truncate">{t.destination}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {t.licensePlate} · {t.cargoType} · {t.numberOfLoads}车 {t.totalWeight}吨
                  </p>
                </div>

                {/* 右侧 */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {t.status === "COMPLETED" ? "完成" : "运输中"}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type StatColor = "blue" | "violet" | "amber" | "emerald";

const COLOR_MAP: Record<StatColor, { bg: string; icon: string; text: string }> = {
  blue:    { bg: "bg-blue-50",    icon: "text-blue-500",    text: "text-blue-900" },
  violet:  { bg: "bg-violet-50",  icon: "text-violet-500",  text: "text-violet-900" },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-500",   text: "text-amber-900" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", text: "text-emerald-900" },
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: StatColor;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-2xl ${c.bg} p-3`}>
      <div className={`mb-1.5 ${c.icon}`}>{icon}</div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${c.text}`}>{value}</p>
    </div>
  );
}
