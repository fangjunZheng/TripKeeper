"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type TripDetail = {
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
  images: Array<{ id: string; type: "DEPARTURE" | "ARRIVAL"; imageUrl: string }>;
};

type TripDetailResponse =
  | { ok: true; trip: TripDetail }
  | { ok: false; error: string };

export default function TripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params?.tripId;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; type: "DEPARTURE" | "ARRIVAL" } | null>(null);

  useEffect(() => {
    async function load() {
      if (!tripId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        const json = (await res.json()) as TripDetailResponse;
        if (!res.ok || !json.ok) {
          throw new Error(!json.ok ? json.error : "加载失败");
        }
        setTrip(json.trip);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId]);

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
        <Button
          type="button"
          variant="ghost"
          className="mb-2 h-9 rounded-full px-3 text-xs"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/home/today");
          }}
        >
          ← 返回
        </Button>
        <h1 className="text-base font-semibold text-slate-900">出车详情</h1>
        <p className="mt-1 text-xs text-slate-500">展示该条记录的全部信息。</p>
      </div>

      <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
        {loading && <p className="text-sm text-slate-500">加载中...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && trip && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Info label="司机姓名" value={trip.driverName} />
              <Info label="车牌号" value={trip.licensePlate} />
              <Info label="日期" value={new Date(trip.date).toISOString().slice(0, 10)} />
              <Info label="状态" value={trip.status === "COMPLETED" ? "运输完成" : "运输中"} />
              <Info label="出发地" value={trip.departureLocation} />
              <Info label="目的地" value={trip.destination} />
              <Info label="运输品类" value={trip.cargoType} />
              <Info label="车数" value={String(trip.numberOfLoads)} />
              <Info label="总吨数" value={String(trip.totalWeight)} />
              <Info label="记录ID" value={trip.id} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xs font-medium text-slate-700">图片</h2>
              {trip.images.length === 0 ? (
                <p className="text-xs text-slate-500">暂无图片</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {trip.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      className="block text-left"
                      onClick={() => setPreviewImage({ url: img.imageUrl, type: img.type })}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.type}
                        className="h-24 w-full rounded-lg border border-slate-100 object-cover"
                      />
                      <p className="mt-1 text-[10px] text-slate-500">
                        {img.type === "DEPARTURE" ? "出车单" : "到达单"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-0 top-0 rounded-full bg-black/50 px-3 py-1 text-xs text-white"
              onClick={() => setPreviewImage(null)}
            >
              关闭
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.type}
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 break-all">{value || "-"}</p>
    </div>
  );
}

