import { NextResponse } from 'next/server';

type ApiErrorLike = {
  status?: number;
  message?: string;
};

/**
 * 统一的 API 错误响应处理。
 * 用法：在 catch 块末尾 `return handleApiError(error)`。
 */
export function handleApiError(error: unknown): NextResponse {
  const status = (error as ApiErrorLike)?.status ?? 500;
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (status === 401) {
    message = 'Unauthorized';
  } else {
    message = 'Unknown error';
  }

  return NextResponse.json({ ok: false, error: message }, { status });
}
