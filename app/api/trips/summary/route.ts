import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { TripRepository } from '@/lib/db/repositories/trip-repository';
import { handleApiError } from '@/lib/api/handle-error';

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth('driver');

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json(
        { ok: false, error: '缺少 month 参数，格式为 YYYY-MM' },
        { status: 400 },
      );
    }

    const summary = await TripRepository.getMonthlySummary(currentUser.id, month);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return handleApiError(error);
  }
}

