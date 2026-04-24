import { NextResponse } from 'next/server';
import { loginRequestSchema } from '@/lib/validators/auth-schemas';
import { SmsService } from '@/lib/services/sms-service';

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

    const { phone } = parsed.data;

    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableRealSmsInDev = process.env.ENABLE_REAL_SMS_IN_DEV === 'true';
    
    if (isDevelopment && !enableRealSmsInDev) {
      return NextResponse.json({
        ok: true,
        devCode: '123456',
        message: '开发环境：使用固定验证码 123456',
      });
    }

    const result = await SmsService.sendSmsVerifyCode(phone);
    
    if (result.success) {
      return NextResponse.json({
        ok: true,
        message: '验证码已发送'
      });
    } else {
      console.log('短信发送失败:', result);
      return NextResponse.json(
        {
          ok: false,
          error: result.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

