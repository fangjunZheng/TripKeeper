import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message =
      error instanceof Error ? error.message : status === 401 ? 'Unauthorized' : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

