import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { TripRepository } from '@/lib/db/repositories/trip-repository';

export async function GET(
  _request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  try {
    const currentUser = await requireAuth('driver');
    const { tripId } = await context.params;

    if (!tripId) {
      return NextResponse.json({ ok: false, error: 'tripId is required' }, { status: 400 });
    }

    const trip = await TripRepository.findTripDetailByIdForDriver(tripId, currentUser.id);
    if (!trip) {
      return NextResponse.json({ ok: false, error: '记录不存在' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, trip });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message =
      error instanceof Error ? error.message : status === 401 ? 'Unauthorized' : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

