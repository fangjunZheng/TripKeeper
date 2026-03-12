import type { User } from '@prisma/client';
import { UserRepository } from '@/lib/db/repositories/user-repository';

export const AuthService = {
  async findOrCreateUserByPhone(phone: string, name?: string): Promise<User> {
    const existing = await UserRepository.findByPhone(phone);
    if (existing) {
      // 如果传入了 name，并且和当前不一样，则顺便更新。
      if (name !== undefined && name !== existing.name) {
        return UserRepository.upsertByPhone({ phone, name, role: existing.role });
      }
      return existing;
    }

    return UserRepository.createUser({ phone, name });
  },
};

