"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

type CreateTripResponse =
  | { ok: true; trip: Trip }
  | { ok: false; error: string; issues?: unknown };

type MeResponse =
  | { ok: true; user: { id: string; name: string | null; phone: string; role: string } }
  | { ok: false; error: string };

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function TodayPage() {
  const todayYmd = useMemo(() => formatYmd(new Date()), []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState({
    driverName: "",
    licensePlate: "",
    date: todayYmd,
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

  // 当获取到当前用户信息后，只在初始为空时填充司机姓名
  useEffect(() => {
    if (me && me.ok && !form.driverName) {
      const name = me.user.name || me.user.phone;
      setForm((s) => ({ ...s, driverName: name }));
    }
  }, [me, form.driverName]);

  async function fetchMe() {
    setMeLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const json = (await res.json()) as MeResponse;
      setMe(json);
    } catch {
      setMe({ ok: false, error: "请求失败，请稍后重试" });
    } finally {
      setMeLoading(false);
    }
  }

  async function fetchTrips() {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/trips/list?date=${encodeURIComponent("today")}`);
      const json = (await res.json()) as TripsListResponse;
      if (res.status === 401 || (!json.ok && json.error === "Unauthorized")) {
        // 未登录时，不展示错误，由顶部登录提示统一处理
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
    let cancelled = false;

    async function init() {
      await fetchMe();
      if (!cancelled) {
        await fetchTrips();
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const isUnauthorized =
    !meLoading &&
    me &&
    !me.ok &&
    (me.error === "Unauthorized" || me.error === "未登录");

  const canUse = !meLoading && me?.ok;

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

      // 上传图片到数据库（先拿 tripId，再写入 TripImage）
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
            const errMsg = !j.ok ? j.error : "图片上传失败";
            throw new Error(errMsg);
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
        driverName: "",
        licensePlate: "",
        date: todayYmd,
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
      await fetchMe();
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
              {todayYmd} · 录入并查看今天的出车记录
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchTrips}
            disabled={listLoading}
            className="shrink-0"
          >
            {listLoading ? "刷新中..." : "刷新"}
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
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              去登录
            </Button>
          </div>
        )}

        {!meLoading && me && me.ok && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">今日趟次</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {stats.tripsCount}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">总车数</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {stats.totalLoads}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">总吨数</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {stats.totalWeight}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">状态</p>
              <p className="mt-1 text-sm text-slate-900">
                运输中 {stats.inTransit} / 完成 {stats.completed}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {canUse && (
        <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            录入出车记录
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            提交后将写入数据库，并出现在下方列表中。
          </p>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                司机姓名
              </label>
              <input
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                value={form.driverName}
                readOnly
                placeholder="从当前登录用户读取"
              />
            </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              车牌号
            </label>
            <input
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              value={form.licensePlate}
              onChange={(e) => setForm((s) => ({ ...s, licensePlate: e.target.value }))}
              placeholder="例如：晋123456"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                日期
              </label>
              <input
                type="date"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                状态
              </label>
              <select
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
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
            <label className="block text-xs font-medium text-slate-700">
              出发地
            </label>
            <input
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              value={form.departureLocation}
              onChange={(e) => setForm((s) => ({ ...s, departureLocation: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              目的地
            </label>
            <input
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              value={form.destination}
              onChange={(e) => setForm((s) => ({ ...s, destination: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              运输品类
            </label>
            <input
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              value={form.cargoType}
              onChange={(e) => setForm((s) => ({ ...s, cargoType: e.target.value }))}
              placeholder="例如：砂石 / 煤 / 钢材"
            />
          </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
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
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] leading-relaxed text-slate-500">
                选择后会上传到数据库，并在管理员列表中展示预览。
              </p>
              {departureDocFiles.length > 0 && (
                <p className="text-[11px] text-slate-600">
                  已选择 {departureDocFiles.length} 张图片
                </p>
              )}
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                车数
              </label>
              <input
                inputMode="numeric"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                value={form.numberOfLoads}
                onChange={(e) => setForm((s) => ({ ...s, numberOfLoads: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                总吨数
              </label>
              <input
                inputMode="decimal"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
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
              <p
                className={
                  message === "创建成功"
                    ? "text-xs text-emerald-600"
                    : "text-xs text-red-500"
                }
              >
                {message}
              </p>
            )}
          </div>
        </div>
      )}

      {canUse && (
        <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              今日记录
            </h2>
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

          <div className="mt-4 space-y-3">
            {trips.map((t) => (
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
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-500">车数</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {t.numberOfLoads}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-500">总吨数</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {t.totalWeight}
                    </p>
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

