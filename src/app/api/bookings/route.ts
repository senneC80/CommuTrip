import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface CreateBookingBody {
  listingId: string;
  slotId: string;
  numberOfPersons: number;
  tripId: string;
}

const COMMISSION_RATE = 0.1; // 10 %

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "traveller") {
    return NextResponse.json(
      { error: "Only travellers can make bookings" },
      { status: 403 }
    );
  }

  let body: CreateBookingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { listingId, slotId, numberOfPersons, tripId } = body;

  if (!listingId || !slotId || !tripId) {
    return NextResponse.json(
      { error: "listingId, slotId, and tripId are required" },
      { status: 400 }
    );
  }
  if (
    typeof numberOfPersons !== "number" ||
    numberOfPersons < 1 ||
    !Number.isInteger(numberOfPersons)
  ) {
    return NextResponse.json(
      { error: "numberOfPersons must be a positive integer" },
      { status: 400 }
    );
  }

  const travellerId = BigInt(session.user.id);

  try {
    // Verify trip belongs to this traveller
    const trip = await prisma.trip.findUnique({ where: { id: BigInt(tripId) } });
    if (!trip || trip.travellerId !== travellerId) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Fetch slot + listing in one query
    const slot = await prisma.activitySlot.findUnique({
      where: { id: BigInt(slotId) },
      include: { listing: true },
    });
    if (!slot || String(slot.listingId) !== listingId) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    if (slot.status !== "available") {
      return NextResponse.json({ error: "This slot is not available" }, { status: 400 });
    }
    if (slot.remainingCapacity < numberOfPersons) {
      return NextResponse.json(
        { error: `Only ${slot.remainingCapacity} spot(s) remaining` },
        { status: 400 }
      );
    }

    const pricePerPerson = Number(slot.listing.pricePerPerson);
    const totalPrice = pricePerPerson * numberOfPersons;
    const commissionAmount = totalPrice * COMMISSION_RATE;

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          tripId: BigInt(tripId),
          travellerId,
          listingId: BigInt(listingId),
          slotId: BigInt(slotId),
          numberOfPersons,
          pricePerPerson,
          commissionRate: COMMISSION_RATE,
          commissionAmount,
          totalPrice,
          currency: slot.listing.currency,
          status: "confirmed",
        },
      });

      const newRemaining = slot.remainingCapacity - numberOfPersons;
      await tx.activitySlot.update({
        where: { id: slot.id },
        data: {
          remainingCapacity: newRemaining,
          status: newRemaining === 0 ? "full" : "available",
        },
      });

      return created;
    });

    return NextResponse.json({ data: { id: String(booking.id) } }, { status: 201 });
  } catch (error) {
    console.error("[bookings] create failed:", error);
    return NextResponse.json(
      { error: "Failed to create booking. Please try again." },
      { status: 500 }
    );
  }
}
