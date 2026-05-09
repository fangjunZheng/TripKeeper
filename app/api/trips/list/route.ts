import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { TripRepository } from '@/lib/db/repositories/trip-repository';
import { handleApiError } from '@/lib/api/handle-error';

/**
 * 将 YYYY-MM-DD 字符串或 'today' 转为当日 UTC 00:00 ~ 23:59:59.999 的范围。
 * 与 getMonthlySummary 保持一致，均以 UTC 为基准，避免服务器时区差异导致跨日错误。
 */
function getDayRangeUtc(dateParam: string): { from: Date; to: Date } | null {
  let ymd: string;

  if (dateParam === 'today') {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    ymd = `${y}-${m}-${d}`;
  } else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return null;
    ymd = dateParam;
  }

  const [y, mo, d] = ymd.split('-').map(Number);
  if (!y || !mo || !d) return null;

  const from = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
  const to = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999));

  if (Number.isNaN(from.getTime())) return null;

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
      const range = getDayRangeUtc(dateParam);
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
    return handleApiError(error);
  }
}
