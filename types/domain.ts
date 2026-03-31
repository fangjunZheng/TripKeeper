import type { TripStatus, TripImageType } from '@prisma/client';

export type ImageData = {
  type: TripImageType;
  imageUrl: string;
};

export type DriverData = {
  driverName: string;
  licensePlate: string;
  date: string; // YYYY-MM-DD
  departureLocation: string;
  destination: string;
  cargoType: string;
  numberOfLoads: number;
  totalWeight: number;
  status?: TripStatus;
  images?: ImageData[];
};

