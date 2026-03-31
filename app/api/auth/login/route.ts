import { NextResponse } from 'next/server';
import { loginRequestSchema } from '@/lib/validators/auth-schemas';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = loginRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues.map((i) => i.message).join('; '),
        },
        { status: 400 },
      );
    }

    // 阶段 3 约定：先返回固定验证码，方便本地开发。
    return NextResponse.json({
      ok: true,
      devCode: '123456',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

