import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { TripImageRepository } from "@/lib/db/repositories/trip-image-repository";
import { TripImageType } from "@prisma/client";
import { prisma } from "@/lib/db/client";

function assertString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toTripImageType(value: string | null): TripImageType | null {
  if (!value) return null;
  if (value !== "DEPARTURE" && value !== "ARRIVAL") return null;
  return value;
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth("driver");

    const formData = await request.formData();
    const tripId = assertString(formData.get("tripId"));
    const type = toTripImageType(assertString(formData.get("type")));
    const fileEntry = formData.get("file");

    if (!tripId) {
      return NextResponse.json({ ok: false, error: "tripId is required" }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ ok: false, error: "type is required" }, { status: 400 });
    }
    if (!fileEntry || typeof (fileEntry as any).arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const file = fileEntry as File;

    // MVP 限制大小，避免一次性塞太多数据到 DB
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      return NextResponse.json(
        { ok: false, error: `文件过大（最大 ${Math.floor(maxBytes / 1024 / 1024)}MB）` },
        { status: 400 },
      );
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { driverId: true },
    });
    if (!trip) {
      return NextResponse.json({ ok: false, error: "trip not found" }, { status: 404 });
    }
    if (trip.driverId !== currentUser.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const imageUrl = `data:${mimeType};base64,${base64}`;

    const image = await TripImageRepository.createImage({
      tripId,
      type,
      imageUrl,
    });

    return NextResponse.json({ ok: true, image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

