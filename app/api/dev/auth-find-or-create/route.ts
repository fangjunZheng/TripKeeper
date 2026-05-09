import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { devEnvGuard } from '@/lib/utils/dev-guard';

export async function POST(request: Request) {
  const guard = devEnvGuard();
  if (guard) return guard;

  try {
    const body = (await request.json()) as { phone?: string; name?: string };

    if (!body.phone) {
      return NextResponse.json({ ok: false, error: 'phone is required' }, { status: 400 });
    }

    const user = await AuthService.findOrCreateUserByPhone(body.phone, body.name);

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

