import { NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import type { TripStatus } from '@prisma/client';
import { TripRepository } from '@/lib/db/repositories/trip-repository';
import { handleApiError } from '@/lib/api/handle-error';

function parseYmdToUtcStart(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return new Date(`${ymd}T00:00:00.000Z`);
}

function parseYmdToUtcEnd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return new Date(`${ymd}T23:59:59.999Z`);
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth('admin');
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId') ?? undefined;
    const statusRaw = searchParams.get('status') ?? undefined;
    const fromRaw = searchParams.get('from') ?? undefined;
    const toRaw = searchParams.get('to') ?? undefined;
    const departureLocation = searchParams.get('departureLocation') ?? undefined;
    const destination = searchParams.get('destination') ?? undefined;
    const pageSizeRaw = searchParams.get('pageSize') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;

    let status: TripStatus | undefined;
    if (statusRaw) {
      if (statusRaw !== 'IN_TRANSIT' && statusRaw !== 'COMPLETED') {
        return NextResponse.json(
          { ok: false, error: 'status 参数必须为 IN_TRANSIT 或 COMPLETED' },
          { status: 400 },
        );
      }
      status = statusRaw;
    }

    const from = fromRaw ? parseYmdToUtcStart(fromRaw) : null;
    const to = toRaw ? parseYmdToUtcEnd(toRaw) : null;

    if (fromRaw && !from) {
      return NextResponse.json(
        { ok: false, error: 'from 参数格式错误，应为 YYYY-MM-DD' },
        { status: 400 },
      );
    }
    if (toRaw && !to) {
      return NextResponse.json(
        { ok: false, error: 'to 参数格式错误，应为 YYYY-MM-DD' },
        { status: 400 },
      );
    }

    const pageSize = pageSizeRaw ? Number(pageSizeRaw) : undefined;

    const { trips, nextCursor } = await TripRepository.findAdminTrips({
      driverId,
      status,
      from: from ?? undefined,
      to: to ?? undefined,
      departureLocation: departureLocation || undefined,
      destination: destination || undefined,
      pageSize: pageSize && Number.isFinite(pageSize) && pageSize > 0 ? pageSize : undefined,
      cursor: cursor || undefined,
    });

    return NextResponse.json({
      ok: true,
      trips,
      hasMore: nextCursor !== null,
      nextCursor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
