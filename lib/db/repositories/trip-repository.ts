import { Prisma, TripImageType, TripStatus, type Trip } from '@prisma/client';
import { prisma } from '@/lib/db/client';

export type CreateTripInput = {
  driverId: string;
  driverName: string;
  licensePlate: string;
  date: Date;
  departureLocation: string;
  destination: string;
  cargoType: string;
  numberOfLoads: number;
  totalWeight: number;
  status?: TripStatus;
};

export type DailySummary = {
  date: string; // YYYY-MM-DD
  tripsCount: number;
  totalWeight: number;
};

export type TripImagePreview = {
  id: string;
  type: TripImageType;
  imageUrl: string;
};

/** 带图片的 Trip（用于详情接口 & 管理员列表） */
export type TripWithImages = Omit<Trip, 'images'> & {
  images: TripImagePreview[];
};

export type AdminTripFilters = {
  driverId?: string;
  status?: TripStatus;
  from?: Date;
  to?: Date;
  departureLocation?: string;
  destination?: string;
  /** 每页条数，默认 50，最大 100 */
  pageSize?: number;
  /** 游标：上一页最后一条 trip 的 id，不传则从头开始 */
  cursor?: string;
};

const IMAGE_SELECT = {
  select: {
    id: true,
    type: true,
    imageUrl: true,
  },
} satisfies Prisma.TripImageFindManyArgs;

export const TripRepository = {
  async createTrip(data: CreateTripInput): Promise<Trip> {
    return prisma.trip.create({
      data: {
        driverId: data.driverId,
        driverName: data.driverName,
        licensePlate: data.licensePlate,
        date: data.date,
        departureLocation: data.departureLocation,
        destination: data.destination,
        cargoType: data.cargoType,
        numberOfLoads: data.numberOfLoads,
        totalWeight: data.totalWeight,
        status: data.status ?? TripStatus.IN_TRANSIT,
      },
    });
  },

  /**
   * 司机列表查询：不含图片，保持响应体轻量。
   * 图片数据由详情接口 findTripDetailByIdForDriver 单独返回。
   */
  async findTripsByDriverAndDateRange(driverId: string, from: Date, to: Date): Promise<Trip[]> {
    return prisma.trip.findMany({
      where: {
        driverId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: 'desc' },
    });
  },

  async findTripDetailByIdForDriver(
    tripId: string,
    driverId: string,
  ): Promise<TripWithImages | null> {
    return (await prisma.trip.findFirst({
      where: { id: tripId, driverId },
      include: {
        images: {
          ...IMAGE_SELECT,
          orderBy: { uploadTime: 'asc' },
        },
      },
    })) as TripWithImages | null;
  },

  async getMonthlySummary(driverId: string, month: string): Promise<DailySummary[]> {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      throw new Error('Invalid month format. Expected "YYYY-MM".');
    }

    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

    const rows = await prisma.$queryRaw<
      Array<{ day: string; trips_count: bigint; total_weight: number | null }>
    >`
      SELECT
        to_char(date_trunc('day', "date" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        COUNT(*)::bigint AS trips_count,
        SUM("totalWeight")::float8 AS total_weight
      FROM "Trip"
      WHERE "driverId" = ${driverId}
        AND "date" >= ${start}
        AND "date" < ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map((r) => ({
      date: r.day,
      tripsCount: Number(r.trips_count),
      totalWeight: r.total_weight ?? 0,
    }));
  },

  /**
   * 管理员列表查询（游标分页）：包含图片（Blob URL），支持管理后台图片预览。
   * 返回 { trips, nextCursor } 供前端实现"加载更多"。
   */
  async findAdminTrips(
    filters: AdminTripFilters = {},
  ): Promise<{ trips: TripWithImages[]; nextCursor: string | null }> {
    const where: Prisma.TripWhereInput = {};

    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.status) where.status = filters.status;

    if (filters.departureLocation) {
      where.departureLocation = { contains: filters.departureLocation, mode: 'insensitive' };
    }
    if (filters.destination) {
      where.destination = { contains: filters.destination, mode: 'insensitive' };
    }

    if (filters.from || filters.to) {
      where.date = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }

    const pageSize = Math.min(filters.pageSize ?? 50, 100);

    // 多取 1 条用来判断是否还有下一页
    const rows = await prisma.trip.findMany({
      where,
      orderBy: { date: 'desc' },
      take: pageSize + 1,
      ...(filters.cursor
        ? { cursor: { id: filters.cursor }, skip: 1 }
        : {}),
      include: { images: IMAGE_SELECT },
    });

    const hasMore = rows.length > pageSize;
    const trips = (hasMore ? rows.slice(0, pageSize) : rows) as TripWithImages[];
    const nextCursor = hasMore ? trips[trips.length - 1].id : null;

    return { trips, nextCursor };
  },
};
