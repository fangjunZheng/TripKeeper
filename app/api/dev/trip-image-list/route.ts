import { NextResponse } from 'next/server';
import { TripImageRepository } from '@/lib/db/repositories/trip-image-repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ ok: false, error: 'tripId is required' }, { status: 400 });
    }

    const images = await TripImageRepository.findByTripId(tripId);
    return NextResponse.json({ ok: true, images });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

