import { NextResponse } from 'next/server';
import { TripRepository } from '@/lib/db/repositories/trip-repository';
import { devEnvGuard } from '@/lib/utils/dev-guard';

export async function GET(request: Request) {
  const guard = devEnvGuard();
  if (guard) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!driverId || !from || !to) {
      return NextResponse.json(
        { ok: false, error: 'Query params required: driverId, from, to' },
        { status: 400 },
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid from/to date' }, { status: 400 });
    }

    const trips = await TripRepository.findTripsByDriverAndDateRange(driverId, fromDate, toDate);
    return NextResponse.json({ ok: true, trips });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

