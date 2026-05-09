import { NextResponse } from 'next/server';

/**
 * 在非开发环境下返回 404，用于保护只应存在于开发环境的接口。
 * 返回非 null 时表示应终止请求处理，直接将返回值作为响应。
 */
export function devEnvGuard(): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'Not Found' }, { status: 404 });
  }
  return null;
}
