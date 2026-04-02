"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type AdminTrip = {
  id: string;
  driverName: string;
  licensePlate: string;
  date: string; // ISO string from server
  departureLocation: string;
  destination: string;
  cargoType: string;
  totalWeight: number;
  status: "IN_TRANSIT" | "COMPLETED";
  images: Array<{ id: string; type: "DEPARTURE" | "ARRIVAL"; imageUrl: string }>;
};

type AdminTripsClientProps = {
  initialTrips: AdminTrip[];
};

export default function AdminTripsClient({ initialTrips }: AdminTripsClientProps) {
  const [trips, setTrips] = useState<AdminTrip[]>(initialTrips);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type Driver = { id: string; name: string | null; phone: string };
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string>("");

  const [status, setStatus] = useState<"ALL" | "IN_TRANSIT" | "COMPLETED">("ALL");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [departureLocation, setDepartureLocation] = useState<string>("");
  const [destination, setDestination] = useState<string>("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewImages, setPreviewImages] = useState<AdminTrip["images"]>([]);

  function openPreview(images: AdminTrip["images"], index: number) {
    if (!images || images.length === 0) return;
    setPreviewImages(images);
    setPreviewIndex(Math.min(Math.max(index, 0), images.length - 1));
    setPreviewOpen(true);
  }

  function closePreview() {
    setPreviewOpen(false);
  }

  function prev() {
    setPreviewIndex((i) => (i - 1 + previewImages.length) % previewImages.length);
  }

  function next() {
    setPreviewIndex((i) => (i + 1) % previewImages.length);
  }

  const isActive = useMemo(() => {
    return Boolean(
      status !== "ALL" || from || to || departureLocation || destination || driverId,
    );
  }, [status, from, to, departureLocation, destination, driverId]);

  useEffect(() => {
    let cancelled = false;
    async function loadDrivers() {
      setDriversLoading(true);
      setDriversError(null);
      try {
        const res = await fetch("/api/admin/drivers");
        const json = (await res.json()) as { ok: boolean; drivers: Driver[]; error?: string };
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "加载司机列表失败");
        }
        if (!cancelled) setDrivers(json.drivers ?? []);
      } catch (e) {
        if (!cancelled) {
          setDriversError(e instanceof Error ? e.message : "加载司机列表失败");
          setDrivers([]);
        }
      } finally {
        if (!cancelled) setDriversLoading(false);
      }
    }
    loadDrivers();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runSearch(
    next?: Partial<{
      status: typeof status;
      from: string;
      to: string;
      departureLocation: string;
      destination: string;
      driverId: string;
    }>,
  ) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const s = next?.status ?? status;
      const f = next?.from ?? from;
      const t = next?.to ?? to;
      const dep = next?.departureLocation ?? departureLocation;
      const dest = next?.destination ?? destination;
      const dId = next?.driverId ?? driverId;

      if (s !== "ALL") params.set("status", s);
      if (f) params.set("from", f);
      if (t) params.set("to", t);
      if (dep) params.set("departureLocation", dep);
      if (dest) params.set("destination", dest);
      if (dId) params.set("driverId", dId);
      params.set("limit", "50");

      const url = `/api/admin/trips?${params.toString()}`;
      const res = await fetch(url);
      const json = (await res.json()) as { ok: boolean; trips: AdminTrip[]; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "搜索失败");
      }

      // 让 date 在客户端以 string 处理
      setTrips(
        (json.trips ?? []).map((x: any) => ({
          ...x,
          images: x.images ?? [],
          date: typeof x.date === "string" ? x.date : new Date(x.date).toISOString(),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜索失败");
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setStatus("ALL");
    setFrom("");
    setTo("");
    setDepartureLocation("");
    setDestination("");
    setDriverId("");
    await runSearch({
      status: "ALL",
      from: "",
      to: "",
      departureLocation: "",
      destination: "",
      driverId: "",
    });
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <section className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">筛选条件</h2>
        <p className="mt-1 text-xs text-slate-500">
          司机、时间范围、状态、出发地/到达地筛选后点击搜索。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">司机</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              disabled={driversLoading}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
            >
              <option value="">全部司机</option>
              {driversLoading ? (
                <option value="">加载中...</option>
              ) : (
                drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name ?? d.phone}
                  </option>
                ))
              )}
            </select>
            {driversError && (
              <p className="pt-1 text-[11px] text-red-500">{driversError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">时间范围</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                type="date"
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">出发地</label>
            <input
              value={departureLocation}
              onChange={(e) => setDepartureLocation(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">到达地</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-medium text-slate-700">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">全部</option>
              <option value="IN_TRANSIT">运输中</option>
              <option value="COMPLETED">运输完成</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <div className="flex flex-wrap gap-2 pt-6">
              <Button
                type="button"
                className="h-9 rounded-full px-5 text-xs font-medium"
                onClick={() => runSearch()}
                disabled={loading}
              >
                {loading ? "搜索中..." : "搜索"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full px-5 text-xs font-medium"
                onClick={handleReset}
                disabled={loading || !isActive}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </section>

      <section className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">出车记录表格</h2>
        <p className="mt-1 text-xs text-slate-500">显示符合条件的 Trip 记录。</p>

        <div className="mt-4 -mx-5 touch-pan-x overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="whitespace-nowrap px-3 py-2 font-medium">司机</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">车牌号</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">日期</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">出发地</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">目的地</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">图片预览</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">品类</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">总吨数</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                    暂无数据。
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{t.driverName}</td>
                    <td className="px-3 py-2 text-slate-700">{t.licensePlate}</td>
                    <td className="px-3 py-2 text-slate-700">{new Date(t.date).toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2 text-slate-700">{t.departureLocation}</td>
                    <td className="px-3 py-2 text-slate-700">{t.destination}</td>
                      <td className="px-3 py-2">
                        {(() => {
                          const depImgs = (t.images ?? []).filter((x) => x.type === "DEPARTURE");
                          const show = depImgs.slice(0, 3);
                          const rest = depImgs.length - show.length;
                          if (depImgs.length === 0) {
                            return <span className="text-slate-400">—</span>;
                          }
                          return (
                            <div className="flex items-center gap-1">
                              {show.map((img, idx) => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => openPreview(depImgs, idx)}
                                  className="relative"
                                >
                                  <img
                                    src={img.imageUrl}
                                    alt=""
                                    className="h-10 w-10 rounded-lg border border-slate-100 object-cover"
                                  />
                                </button>
                              ))}
                              {rest > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openPreview(depImgs, show.length)}
                                  className="h-10 w-10 rounded-lg border border-slate-100 bg-slate-50 text-[10px] text-slate-500"
                                >
                                  +{rest}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    <td className="px-3 py-2 text-slate-700">{t.cargoType}</td>
                    <td className="px-3 py-2 text-slate-700">{t.totalWeight}</td>
                    <td className="px-3 py-2">
                      {t.status === "COMPLETED" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                          完成
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                          运输中
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {previewOpen && previewImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="text-xs font-medium text-white/90">
              {previewIndex + 1}/{previewImages.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-white/20 bg-white/10 px-4 text-xs text-white hover:bg-white/15"
                onClick={prev}
              >
                上一张
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-white/20 bg-white/10 px-4 text-xs text-white hover:bg-white/15"
                onClick={next}
              >
                下一张
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-full px-3 text-xs text-white hover:bg-white/15"
                onClick={closePreview}
              >
                关闭
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="flex h-full items-center justify-center">
              <img
                src={previewImages[previewIndex]?.imageUrl}
                alt=""
                className="max-h-[80vh] max-w-full rounded-lg border border-white/10 object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

