import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      select: { id: true, name: true, city: true, country: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      data: communities.map((c) => ({
        id: String(c.id),
        name: c.name,
        city: c.city,
        country: c.country,
      })),
    });
  } catch (error) {
    console.error("[communities] fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}
