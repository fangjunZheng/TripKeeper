import { NextResponse } from 'next/server';
import { TripImageType } from '@prisma/client';
import { TripImageRepository } from '@/lib/db/repositories/trip-image-repository';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tripId?: string; type?: TripImageType; imageUrl?: string };

    if (!body.tripId) {
      return NextResponse.json({ ok: false, error: 'tripId is required' }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ ok: false, error: 'type is required' }, { status: 400 });
    }
    if (!body.imageUrl) {
      return NextResponse.json({ ok: false, error: 'imageUrl is required' }, { status: 400 });
    }

    const image = await TripImageRepository.createImage({
      tripId: body.tripId,
      type: body.type,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json({ ok: true, image });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

