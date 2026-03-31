import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { UserRepository } from '@/lib/db/repositories/user-repository';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: '缺少用户名或密码' }, { status: 400 });
    }

    if (username !== 'admin' || password !== 'admin') {
      return NextResponse.json({ ok: false, error: '用户名或密码错误' }, { status: 401 });
    }

    // 使用固定账号 admin 写入/更新到 User 表，角色为 ADMIN
    const user = await UserRepository.upsertByPhone({
      phone: 'admin',
      name: '管理员',
      role: Role.ADMIN,
    });

    await createSession(user, 'admin');

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

