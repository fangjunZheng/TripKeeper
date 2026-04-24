import { NextResponse } from 'next/server';
import { verifyOtpRequestSchema } from '@/lib/validators/auth-schemas';
import { AuthService } from '@/lib/services/auth-service';
import { createSession } from '@/lib/auth/session';
import { SmsService } from '@/lib/services/sms-service';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = verifyOtpRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues.map((i) => i.message).join('; '),
        },
        { status: 400 },
      );
    }

    const { phone, code } = parsed.data;

    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableRealSmsInDev = process.env.ENABLE_REAL_SMS_IN_DEV === 'true';

    if (isDevelopment && !enableRealSmsInDev) {
      if (code !== '123456') {
        return NextResponse.json({ ok: false, error: '验证码不正确' }, { status: 400 });
      }
    } else {
      const verification = await SmsService.checkSmsVerifyCode(phone, code);
      if (!verification.valid) {
        return NextResponse.json({ ok: false, error: verification.message }, { status: 400 });
      }
    }
    
    const user = await AuthService.findOrCreateUserByPhone(phone);

    await createSession(user, 'driver');

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

