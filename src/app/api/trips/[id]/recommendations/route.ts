import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getRecommendationsForTrip } from "@/lib/recommendations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "traveller") {
    return NextResponse.json(
      { error: "Only travellers can view recommendations" },
      { status: 403 },
    );
  }

  let tripId: bigint;
  try {
    tripId = BigInt(id);
  } catch {
    return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 });
  }

  try {
    const travellerId = BigInt(session.user.id);

    // Verify trip exists and belongs to this traveller
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.travellerId !== travellerId) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const recommendations = await getRecommendationsForTrip(
      tripId,
      travellerId,
    );

    // Serialize Date objects for JSON response
    const serialized = recommendations.map((rec) => ({
      ...rec,
      slots: rec.slots.map((s) => ({
        id: s.id,
        slotDate: s.slotDate,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime?.toISOString() ?? null,
      })),
    }));

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error("[recommendations] fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}
