import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Segment {
  city: string;
  country?: string;
  arrivalDate: string;
  departureDate: string;
}

interface CreateTripBody {
  title?: string;
  tagIds?: string[];
  segments: Segment[];
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "traveller") {
    return NextResponse.json(
      { error: "Only travellers can create trips" },
      { status: 403 }
    );
  }

  let body: CreateTripBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, tagIds = [], segments } = body;
  const travellerId = BigInt(session.user.id);

  if (!Array.isArray(segments) || segments.length === 0) {
    return NextResponse.json(
      { error: "At least one itinerary segment is required" },
      { status: 400 }
    );
  }

  for (const seg of segments) {
    if (!seg.city?.trim()) {
      return NextResponse.json(
        { error: "Each segment must have a location" },
        { status: 400 }
      );
    }
    if (!seg.arrivalDate || !seg.departureDate) {
      return NextResponse.json(
        { error: "Each segment must have arrival and departure dates" },
        { status: 400 }
      );
    }
    if (new Date(seg.arrivalDate) > new Date(seg.departureDate)) {
      return NextResponse.json(
        { error: "Arrival date must not be after departure date" },
        { status: 400 }
      );
    }
  }

  try {
    const trip = await prisma.$transaction(async (tx) => {
      // Replace traveller interest tags
      await tx.travellerInterestTag.deleteMany({ where: { travellerId } });
      if (tagIds.length > 0) {
        await tx.travellerInterestTag.createMany({
          data: tagIds.map((id) => ({ travellerId, tagId: BigInt(id) })),
        });
      }

      // Create trip with locations
      return tx.trip.create({
        data: {
          travellerId,
          title: title?.trim() || null,
          status: "active",
          tripLocations: {
            create: segments.map((seg, i) => ({
              city: seg.city.trim(),
              country: seg.country?.trim() || null,
              arrivalDate: new Date(seg.arrivalDate),
              departureDate: new Date(seg.departureDate),
              latitude: 0,
              longitude: 0,
              sequenceNo: i + 1,
            })),
          },
        },
      });
    });

    return NextResponse.json({ data: { id: String(trip.id) } }, { status: 201 });
  } catch (error) {
    console.error("[trips] create failed:", error);
    return NextResponse.json(
      { error: "Failed to create trip. Please try again." },
      { status: 500 }
    );
  }
}
