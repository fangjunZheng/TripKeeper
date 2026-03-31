import type { User } from '@prisma/client';

// ---------- Auth ----------

export type LoginRequest = {
  phone: string;
};

export type VerifyOtpRequest = {
  phone: string;
  code: string;
  name?: string;
};

export type AuthUserResponse = {
  ok: boolean;
  user?: User;
  error?: string;
};

