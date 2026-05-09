import { NextResponse } from 'next/server';
import { loginRequestSchema } from '@/lib/validators/auth-schemas';
import { SmsService } from '@/lib/services/sms-service';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

/** 每个手机号 60 秒内最多发送 1 次验证码 */
const PHONE_LIMIT = 1;
const PHONE_WINDOW_MS = 60 * 1000;

/** 每个 IP 60 秒内最多发送 5 次（防止枚举攻击） */
const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 1000;

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

    // IP 级速率限制
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const ipCheck = checkRateLimit(`sms:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: `请求过于频繁，请 ${Math.ceil(ipCheck.retryAfterMs / 1000)} 秒后再试` },
        { status: 429 },
      );
    }

    // 手机号级速率限制
    const phoneCheck = checkRateLimit(`sms:phone:${phone}`, PHONE_LIMIT, PHONE_WINDOW_MS);
    if (!phoneCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: `验证码已发送，请 ${Math.ceil(phoneCheck.retryAfterMs / 1000)} 秒后再试` },
        { status: 429 },
      );
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableRealSmsInDev = process.env.ENABLE_REAL_SMS_IN_DEV === 'true';

    if (isDevelopment && !enableRealSmsInDev) {
      // 开发模式：不发送真实短信，但不在响应中暴露测试验证码
      return NextResponse.json({
        ok: true,
        message: '验证码已发送（开发模式）',
      });
    }

    const result = await SmsService.sendSmsVerifyCode(phone);

    if (result.success) {
      return NextResponse.json({
        ok: true,
        message: '验证码已发送',
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
