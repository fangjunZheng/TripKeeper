import { z } from 'zod';

export const imageDataSchema = z.object({
  // 使用字符串枚举以避免直接依赖 Prisma 生成的枚举类型
  type: z.enum(['DEPARTURE', 'ARRIVAL'] as const),
  imageUrl: z.string().url('图片地址必须是合法的 URL'),
});

export const createTripRequestSchema = z.object({
  driverName: z.string().min(1, '司机姓名不能为空').max(50, '司机姓名过长'),
  licensePlate: z.string().min(1, '车牌号不能为空').max(20, '车牌号过长'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
  departureLocation: z.string().min(1, '出发地不能为空').max(100, '出发地过长'),
  destination: z.string().min(1, '目的地不能为空').max(100, '目的地过长'),
  cargoType: z.string().min(1, '运输品类不能为空').max(100, '运输品类过长'),
  numberOfLoads: z
    .number()
    .int('车数必须是整数')
    .min(1, '车数至少为 1'),
  totalWeight: z
    .number()
    .positive('总吨数必须大于 0'),
  status: z.enum(['IN_TRANSIT', 'COMPLETED'] as const).optional(),
  images: z.array(imageDataSchema).optional(),
});

export type CreateTripRequestInput = z.infer<typeof createTripRequestSchema>;

