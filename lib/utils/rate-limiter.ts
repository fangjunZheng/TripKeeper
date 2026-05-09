type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

/**
 * 简单的内存速率限制器（单实例有效，无法跨多个 Serverless 实例共享）。
 * 生产环境如需跨实例限流，应替换为 Redis（如 Upstash）后端。
 *
 * @param key    限流 key，如 `sms:phone:13800138000` 或 `sms:ip:1.2.3.4`
 * @param limit  在时间窗口内允许的最大请求次数
 * @param windowMs 时间窗口（毫秒）
 * @returns `{ allowed: boolean; remaining: number; retryAfterMs: number }`
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

/** 定期清理过期条目，防止内存无限增长（每 5 分钟自动执行一次）。 */
function sweepExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(sweepExpiredEntries, 5 * 60 * 1000);
}
