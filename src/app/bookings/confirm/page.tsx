import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ConfirmBookingCard from "@/components/ConfirmBookingCard";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime12h(d: Date): string {
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ConfirmBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
  if (session.user.role !== "traveller") redirect("/dashboard");

  const params = await searchParams;
  const listingId = typeof params.listingId === "string" ? params.listingId : "";
  const slotId = typeof params.slotId === "string" ? params.slotId : "";
  const tripId = typeof params.tripId === "string" ? params.tripId : "";
  const guests = Math.max(1, parseInt(typeof params.guests === "string" ? params.guests : "1", 10) || 1);

  if (!listingId || !slotId || !tripId) notFound();

  let listingBigInt: bigint, slotBigInt: bigint, tripBigInt: bigint;
  try {
    listingBigInt = BigInt(listingId);
    slotBigInt = BigInt(slotId);
    tripBigInt = BigInt(tripId);
  } catch {
    notFound();
  }

  const travellerId = BigInt(session.user.id);

  // Fetch all data in parallel
  const [slot, trip] = await Promise.all([
    prisma.activitySlot.findUnique({
      where: { id: slotBigInt },
      include: {
        listing: {
          include: {
            provider: { include: { community: true } },
          },
        },
      },
    }),
    prisma.trip.findUnique({
      where: { id: tripBigInt },
      include: {
        tripLocations: { orderBy: { sequenceNo: "asc" } },
      },
    }),
  ]);

  // Validate
  if (!slot || slot.listingId !== listingBigInt) notFound();
  if (!trip || trip.travellerId !== travellerId) notFound();

  const listing = slot.listing;
  const community = listing.provider.community;
  const providerName =
    community?.name ??
    listing.provider.displayName ??
    "Community Provider";

  // Compute day label (e.g. "Day 2") by finding which day the slot falls on
  const locs = trip.tripLocations;
  const firstArrival = locs[0]?.arrivalDate;
  let dayLabel = getDateKey(slot.slotDate);

  if (firstArrival) {
    const slotKey = getDateKey(slot.slotDate);
    const current = new Date(firstArrival);
    let dayNum = 1;
    while (getDateKey(current) <= slotKey) {
      if (getDateKey(current) === slotKey) {
        dayLabel = `Day ${dayNum}`;
        break;
      }
      current.setUTCDate(current.getUTCDate() + 1);
      dayNum++;
    }
  }

  // Time range
  const timeRange = slot.endTime
    ? `${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`
    : formatTime12h(slot.startTime);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <ConfirmBookingCard
        listingId={listingId}
        slotId={slotId}
        tripId={tripId}
        guests={guests}
        experienceName={listing.title}
        providerName={providerName}
        dayLabel={dayLabel}
        timeRange={timeRange}
        pricePerPerson={Number(listing.pricePerPerson)}
        currency={listing.currency}
        backHref={`/listings/${listingId}`}
      />
    </div>
  );
}
