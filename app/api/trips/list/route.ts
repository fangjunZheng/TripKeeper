import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { TripRepository } from '@/lib/db/repositories/trip-repository';

function getDayRange(dateParam: string): { from: Date; to: Date } | null {
  let baseDate: Date;

  if (dateParam === 'today') {
    baseDate = new Date();
  } else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return null;
    }
    baseDate = new Date(`${dateParam}T00:00:00`);
    if (Number.isNaN(baseDate.getTime())) {
      return null;
    }
  }

  const from = new Date(baseDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(baseDate);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let from: Date;
    let to: Date;

    if (dateParam) {
      const range = getDayRange(dateParam);
      if (!range) {
        return NextResponse.json(
          { ok: false, error: 'date 参数格式错误，应为 YYYY-MM-DD 或 today' },
          { status: 400 },
        );
      }
      from = range.from;
      to = range.to;
    } else {
      from = new Date('1970-01-01T00:00:00.000Z');
      to = new Date('2999-12-31T23:59:59.999Z');
    }

    const trips = await TripRepository.findTripsByDriverAndDateRange(currentUser.id, from, to);
    return NextResponse.json({ ok: true, trips });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message =
      error instanceof Error ? error.message : status === 401 ? 'Unauthorized' : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
