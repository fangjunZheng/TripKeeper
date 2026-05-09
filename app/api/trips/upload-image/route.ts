import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
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

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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
      return NextResponse.json({ ok: false, error: "type 必须为 DEPARTURE 或 ARRIVAL" }, { status: 400 });
    }
    if (!fileEntry || typeof (fileEntry as File).arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const file = fileEntry as File;

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: `文件过大（最大 ${MAX_BYTES / 1024 / 1024}MB）` },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "只允许上传图片文件" }, { status: 400 });
    }

    // 确认该 trip 属于当前司机
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

    // 上传到 Vercel Blob，路径：trip-images/{tripId}/{type}-{timestamp}.{ext}
    const ext = file.name.split(".").pop() ?? "jpg";
    const blobPath = `trip-images/${tripId}/${type}-${Date.now()}.${ext}`;

    const blob = await put(blobPath, file, {
      access: "public",
      contentType: file.type,
    });

    const image = await TripImageRepository.createImage({
      tripId,
      type,
      imageUrl: blob.url,
    });

    return NextResponse.json({ ok: true, image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as { status?: number })?.status ?? 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
