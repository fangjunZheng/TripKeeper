import { z } from 'zod';

export const loginRequestSchema = z.object({
  phone: z
    .string()
    .min(6, '手机号太短')
    .max(20, '手机号太长')
    .regex(/^[0-9+\-\s]+$/, '手机号格式不正确'),
});

export const verifyOtpRequestSchema = z.object({
  phone: z
    .string()
    .min(6, '手机号太短')
    .max(20, '手机号太长')
    .regex(/^[0-9+\-\s]+$/, '手机号格式不正确'),
  code: z
    .string()
    .min(4, '验证码太短')
    .max(8, '验证码太长'),
  name: z
    .string()
    .min(1, '姓名不能为空')
    .max(50, '姓名太长')
    .optional(),
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
export type VerifyOtpRequestInput = z.infer<typeof verifyOtpRequestSchema>;

