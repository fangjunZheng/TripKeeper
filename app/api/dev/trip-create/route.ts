import { NextResponse } from 'next/server';
import { TripRepository } from '@/lib/db/repositories/trip-repository';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      driverId?: string;
      driverName?: string;
      licensePlate?: string;
      date?: string;
      departureLocation?: string;
      destination?: string;
      cargoType?: string;
      numberOfLoads?: number;
      totalWeight?: number;
    };

    const missing: string[] = [];
    if (!body.driverId) missing.push('driverId');
    if (!body.driverName) missing.push('driverName');
    if (!body.licensePlate) missing.push('licensePlate');
    if (!body.date) missing.push('date');
    if (!body.departureLocation) missing.push('departureLocation');
    if (!body.destination) missing.push('destination');
    if (!body.cargoType) missing.push('cargoType');
    if (body.numberOfLoads === undefined) missing.push('numberOfLoads');
    if (body.totalWeight === undefined) missing.push('totalWeight');

    if (missing.length > 0) {
      return NextResponse.json({ ok: false, error: `Missing: ${missing.join(', ')}` }, { status: 400 });
    }

    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid date' }, { status: 400 });
    }

    const trip = await TripRepository.createTrip({
      driverId: body.driverId,
      driverName: body.driverName,
      licensePlate: body.licensePlate,
      date,
      departureLocation: body.departureLocation,
      destination: body.destination,
      cargoType: body.cargoType,
      numberOfLoads: body.numberOfLoads,
      totalWeight: body.totalWeight,
    });

    return NextResponse.json({ ok: true, trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

