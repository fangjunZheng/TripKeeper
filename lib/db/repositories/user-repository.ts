import { Role, type User } from '@prisma/client';
import { prisma } from '@/lib/db/client';

export type CreateUserInput = {
  phone: string;
  name?: string;
  role?: Role;
};

export const UserRepository = {
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } });
  },

  async createUser(data: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        role: data.role ?? Role.DRIVER,
      },
    });
  },

  async upsertByPhone(data: CreateUserInput): Promise<User> {
    return prisma.user.upsert({
      where: { phone: data.phone },
      create: {
        phone: data.phone,
        name: data.name,
        role: data.role ?? Role.DRIVER,
      },
      update: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
      },
    });
  },
};

