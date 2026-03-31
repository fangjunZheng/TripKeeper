import { NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth/guards";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const user = await requireAuth('admin');
    requireAdmin(user);

    const drivers = await prisma.user.findMany({
      where: { role: Role.DRIVER },
      select: { id: true, name: true, phone: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, drivers });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message =
      error instanceof Error
        ? error.message
        : status === 401
          ? "Unauthorized"
          : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

