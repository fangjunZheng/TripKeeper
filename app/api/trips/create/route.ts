import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { TripService } from '@/lib/services/trip-service';
import { createTripRequestSchema } from '@/lib/validators/trip-schemas';
import { handleApiError } from '@/lib/api/handle-error';

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();

    const json = await request.json();
    const parsed = createTripRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: '参数校验失败',
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const trip = await TripService.createTrip({
      input: parsed.data,
      currentUser,
    });

    return NextResponse.json({ ok: true, trip });
  } catch (error) {
    return handleApiError(error);
  }
}

