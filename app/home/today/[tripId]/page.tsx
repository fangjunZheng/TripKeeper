"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { TripDetail, TripDetailResponse } from "@/types/api";
import {
  ArrowLeft, Truck, MapPin, Navigation,
  Package, Hash, Weight, Calendar,
  CheckCircle2, Clock, Image as ImageIcon,
} from "lucide-react";

export default function TripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params?.tripId;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!tripId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        const json = (await res.json()) as TripDetailResponse;
        if (!res.ok || !json.ok) throw new Error(!json.ok ? json.error : "加载失败");
        setTrip(json.trip);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId]);

  const isCompleted = trip?.status === "COMPLETED";

  return (
    <div className="space-y-3 pb-4">
      {/* 顶部导航 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1 rounded-full px-3 text-xs text-slate-600"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/home/today");
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-400">加载中…</p>
        </div>
      )}
      {error && (
        <div className="rounded-3xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && trip && (
        <>
          {/* 路线横幅 */}
          <div className={`rounded-3xl px-5 py-5 shadow-sm ${isCompleted ? "bg-emerald-600" : "bg-amber-500"}`}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-white/80" />
                <span className="text-xs font-medium text-white/80">{trip.licensePlate}</span>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white">
                {isCompleted ? "运输完成" : "运输中"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[10px] text-white/60">出发地</p>
                <p className="truncate text-base font-semibold text-white">{trip.departureLocation}</p>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div className="h-px w-10 bg-white/40" />
                <Truck className="h-4 w-4 text-white/60" />
                <div className="h-px w-10 bg-white/40" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-white/60">目的地</p>
                <p className="truncate text-base font-semibold text-white">{trip.destination}</p>
              </div>
            </div>

            <p className="mt-3 text-right text-xs text-white/60">
              {new Date(trip.date).toISOString().slice(0, 10)} · {trip.driverName}
            </p>
          </div>

          {/* 详情信息 */}
          <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">运输信息</h2>
            <div className="space-y-0 divide-y divide-slate-50">
              <InfoRow icon={<Package className="h-3.5 w-3.5 text-slate-400" />} label="运输品类" value={trip.cargoType} />
              <InfoRow icon={<Hash className="h-3.5 w-3.5 text-slate-400" />} label="车数" value={`${trip.numberOfLoads} 车`} />
              <InfoRow icon={<Weight className="h-3.5 w-3.5 text-slate-400" />} label="总吨数" value={`${trip.totalWeight} 吨`} />
              <InfoRow icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />} label="日期" value={new Date(trip.date).toISOString().slice(0, 10)} />
              <InfoRow
                icon={isCompleted
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  : <Clock className="h-3.5 w-3.5 text-amber-500" />
                }
                label="状态"
                value={isCompleted ? "运输完成" : "运输中"}
                valueClass={isCompleted ? "text-emerald-600" : "text-amber-600"}
              />
            </div>
          </div>

          {/* 图片 */}
          <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                出车单图片
                {trip.images.length > 0 && <span className="ml-1 text-slate-300">({trip.images.length})</span>}
              </h2>
            </div>

            {trip.images.length === 0 ? (
              <div className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl bg-slate-50">
                <ImageIcon className="h-5 w-5 text-slate-300" />
                <p className="text-xs text-slate-400">暂无图片</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {trip.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setPreviewIndex(idx)}
                    className="group relative overflow-hidden rounded-xl"
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.type}
                      className="h-24 w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 px-2 py-1.5">
                      <p className="text-[9px] font-medium text-white">
                        {img.type === "DEPARTURE" ? "出车单" : "到达单"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 图片全屏预览 */}
      {trip && previewIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={() => setPreviewIndex(null)}
        >
          <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-medium text-white/70">
              {previewIndex + 1} / {trip.images.length}
            </p>
            <div className="flex gap-2">
              {previewIndex > 0 && (
                <button type="button" className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white" onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex - 1); }}>
                  上一张
                </button>
              )}
              {previewIndex < trip.images.length - 1 && (
                <button type="button" className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white" onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex + 1); }}>
                  下一张
                </button>
              )}
              <button type="button" className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white" onClick={() => setPreviewIndex(null)}>
                关闭
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <img
              src={trip.images[previewIndex]?.imageUrl}
              alt=""
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
          </div>
          <p className="pb-4 text-center text-xs text-white/40">
            {trip.images[previewIndex]?.type === "DEPARTURE" ? "出车单" : "到达单"}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon, label, value, valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-medium text-slate-900 ${valueClass ?? ""}`}>{value || "-"}</p>
    </div>
  );
}
