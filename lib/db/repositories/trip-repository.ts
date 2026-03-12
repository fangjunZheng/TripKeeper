import { TripStatus, type Trip } from '@prisma/client';
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

  async findTripsByDriverAndDateRange(driverId: string, from: Date, to: Date): Promise<Trip[]> {
    return prisma.trip.findMany({
      where: {
        driverId,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'desc' },
    });
  },

  async getMonthlySummary(driverId: string, month: string): Promise<DailySummary[]> {
    // month: "YYYY-MM"
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1; // 0-based
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      throw new Error('Invalid month format. Expected "YYYY-MM".');
    }

    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

    // Use raw SQL to group by day in UTC.
    const rows = await prisma.$queryRaw<Array<{ day: string; trips_count: bigint; total_weight: number | null }>>`
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
};

