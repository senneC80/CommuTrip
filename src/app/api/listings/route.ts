import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface CreateListingBody {
  title: string;
  description: string;
  category?: string;
  city?: string;
  country?: string;
  pricePerPerson: number;
  capacity: number;
  tagIds?: string[];
  days: number[];       // JS day indices: 0=Sun, 1=Mon … 6=Sat
  startTime: string;    // "HH:MM"
  endTime?: string;     // "HH:MM"
}

function parseTime(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00`);
}

function generateSlotDates(days: number[]): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const until = new Date(today);
  until.setMonth(until.getMonth() + 1);

  const current = new Date(today);
  while (current <= until) {
    if (days.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (session.user.role !== "provider") {
    return NextResponse.json(
      { error: "Only providers can create listings" },
      { status: 403 }
    );
  }

  let body: CreateListingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    description,
    category,
    city,
    country,
    pricePerPerson,
    capacity,
    tagIds = [],
    days,
    startTime,
    endTime,
  } = body;

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Activity title is required" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (typeof pricePerPerson !== "number" || pricePerPerson <= 0) {
    return NextResponse.json(
      { error: "Price per person must be a positive number" },
      { status: 400 }
    );
  }
  if (typeof capacity !== "number" || capacity <= 0 || !Number.isInteger(capacity)) {
    return NextResponse.json(
      { error: "Capacity must be a positive integer" },
      { status: 400 }
    );
  }
  if (!Array.isArray(days) || days.length === 0) {
    return NextResponse.json(
      { error: "At least one day of the week is required" },
      { status: 400 }
    );
  }
  if (!startTime || typeof startTime !== "string") {
    return NextResponse.json({ error: "Start time is required" }, { status: 400 });
  }

  const slotDates = generateSlotDates(days);
  const providerId = BigInt(session.user.id);

  try {
    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.activityListing.create({
        data: {
          providerId,
          title: title.trim(),
          description: description.trim(),
          category: category || null,
          city: city?.trim() || null,
          country: country?.trim() || null,
          pricePerPerson,
          capacity,
          status: "active",
          isRecurring: days.length > 1,
        },
      });

      if (slotDates.length > 0) {
        await tx.activitySlot.createMany({
          data: slotDates.map((date) => ({
            listingId: created.id,
            slotDate: date,
            startTime: parseTime(startTime),
            endTime: endTime ? parseTime(endTime) : null,
            capacity,
            remainingCapacity: capacity,
            status: "available",
          })),
        });
      }

      if (tagIds.length > 0) {
        await tx.listingInterestTag.createMany({
          data: tagIds.map((id) => ({
            listingId: created.id,
            tagId: BigInt(id),
          })),
        });
      }

      return created;
    });

    return NextResponse.json(
      { data: { id: String(listing.id), title: listing.title, status: listing.status } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[listings] create failed:", error);
    return NextResponse.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 }
    );
  }
}
