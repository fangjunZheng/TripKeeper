import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: Request) {
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

