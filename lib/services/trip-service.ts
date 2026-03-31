import type { Trip } from '@prisma/client';
import type { User } from '@prisma/client';
import { TripImageRepository } from '@/lib/db/repositories/trip-image-repository';
import { TripRepository } from '@/lib/db/repositories/trip-repository';
import type { CreateTripRequestInput } from '@/lib/validators/trip-schemas';

type CreateTripParams = {
  input: CreateTripRequestInput;
  currentUser: User;
};

export const TripService = {
  async createTrip({ input, currentUser }: CreateTripParams): Promise<Trip> {
    if (currentUser.role !== 'DRIVER') {
      throw Object.assign(new Error('只有司机可以创建出车记录'), { status: 403 });
    }

    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw Object.assign(new Error('日期格式不正确'), { status: 400 });
    }

    const trip = await TripRepository.createTrip({
      driverId: currentUser.id,
      driverName: input.driverName,
      licensePlate: input.licensePlate,
      date,
      departureLocation: input.departureLocation,
      destination: input.destination,
      cargoType: input.cargoType,
      numberOfLoads: input.numberOfLoads,
      totalWeight: input.totalWeight,
      status: input.status,
    });

    if (input.images && input.images.length > 0) {
      await Promise.all(
        input.images.map((img) =>
          TripImageRepository.createImage({
            tripId: trip.id,
            type: img.type,
            imageUrl: img.imageUrl,
          }),
        ),
      );
    }

    return trip;
  },
};

