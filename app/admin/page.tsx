import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth/session";
import { TripRepository } from "@/lib/db/repositories/trip-repository";
import AdminTripsClient from "./AdminTripsClient";

export default async function AdminPage() {
  const user = await getUserFromRequest('admin');
  if (!user) {
    redirect("/admin/login");
  }
  // 防止普通司机访问时直接抛错导致 500
  if (user.role !== Role.ADMIN) {
    redirect("/admin/login?error=forbidden");
  }

  let trips: Array<{
    id: string;
    driverName: string;
    licensePlate: string;
    date: string; // serialize for client
    departureLocation: string;
    destination: string;
    cargoType: string;
    totalWeight: number;
    status: "IN_TRANSIT" | "COMPLETED";
    images: Array<{ id: string; type: "DEPARTURE" | "ARRIVAL"; imageUrl: string }>;
  }> = [];

  try {
    const raw = await TripRepository.findAdminTrips({ limit: 50 });
    trips = raw.map((t) => ({
      ...t,
      date: t.date.toISOString(),
    }));
  } catch {
    // 数据加载失败时保持页面可渲染，表格提示后续接入
    trips = [];
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              管理后台
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              以表格形式查看和筛选所有司机的出车记录。
            </p>
          </div>
          <p className="text-xs text-slate-500">
            当前管理员：<span className="font-medium text-slate-900">{user.name ?? user.phone}</span>
          </p>
        </header>

        <AdminTripsClient initialTrips={trips} />
      </div>
    </main>
  );
}

