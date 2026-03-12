import { TripImageType, type TripImage } from '@prisma/client';
import { prisma } from '@/lib/db/client';

export type CreateTripImageInput = {
  tripId: string;
  type: TripImageType;
  imageUrl: string;
};

export const TripImageRepository = {
  async createImage(data: CreateTripImageInput): Promise<TripImage> {
    return prisma.tripImage.create({
      data: {
        tripId: data.tripId,
        type: data.type,
        imageUrl: data.imageUrl,
      },
    });
  },

  async findByTripId(tripId: string): Promise<TripImage[]> {
    return prisma.tripImage.findMany({
      where: { tripId },
      orderBy: { uploadTime: 'desc' },
    });
  },
};

