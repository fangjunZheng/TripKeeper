import { NextResponse } from 'next/server';
import { TripRepository } from '@/lib/db/repositories/trip-repository';
import { devEnvGuard } from '@/lib/utils/dev-guard';

export async function POST(request: Request) {
  const guard = devEnvGuard();
  if (guard) return guard;

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

    const driverId = body.driverId;
    const driverName = body.driverName;
    const licensePlate = body.licensePlate;
    const departureLocation = body.departureLocation;
    const destination = body.destination;
    const cargoType = body.cargoType;
    const numberOfLoads = body.numberOfLoads;
    const totalWeight = body.totalWeight;

    if (!driverId || !driverName || !licensePlate || !departureLocation || !destination || !cargoType) {
      return NextResponse.json({ ok: false, error: 'Missing required string fields' }, { status: 400 });
    }
    if (numberOfLoads === undefined || totalWeight === undefined) {
      return NextResponse.json({ ok: false, error: 'Missing: numberOfLoads/totalWeight' }, { status: 400 });
    }

    const dateStr = body.date;
    if (!dateStr) {
      return NextResponse.json({ ok: false, error: 'Missing: date' }, { status: 400 });
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid date' }, { status: 400 });
    }

    const trip = await TripRepository.createTrip({
      driverId,
      driverName,
      licensePlate,
      date,
      departureLocation,
      destination,
      cargoType,
      numberOfLoads,
      totalWeight,
    });

    return NextResponse.json({ ok: true, trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

