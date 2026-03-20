import prisma from "@/lib/prisma";

export interface RecommendedSlot {
  id: string;
  slotDate: string; // "YYYY-MM-DD"
  startTime: Date;
  endTime: Date | null;
}

export interface RecommendedActivity {
  id: string;
  title: string;
  description: string;
  category: string | null;
  city: string | null;
  pricePerPerson: number;
  currency: string;
  communityName: string | null;
  matchScore: number;
  slots: RecommendedSlot[];
}

export async function getRecommendationsForTrip(
  tripId: bigint,
  travellerId: bigint,
): Promise<RecommendedActivity[]> {
  // 1. Load trip locations + already-booked listing IDs
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripLocations: { orderBy: { sequenceNo: "asc" } },
      bookings: { select: { listingId: true } },
    },
  });

  if (!trip) return [];

  const locations = trip.tripLocations;
  if (locations.length === 0) return [];

  const bookedListingIds = trip.bookings.map((b) => b.listingId);

  // 2. Load traveller's interest tag IDs
  const travellerTags = await prisma.travellerInterestTag.findMany({
    where: { travellerId },
    select: { tagId: true },
  });
  const travellerTagIds = new Set(travellerTags.map((t) => t.tagId));

  // 3. Build per-location filters pairing each city with its date range
  const locationFilters = locations
    .filter((loc) => loc.city)
    .map((loc) => ({
      city: loc.city!,
      activitySlots: {
        some: {
          status: "available" as const,
          remainingCapacity: { gt: 0 },
          slotDate: { gte: loc.arrivalDate, lte: loc.departureDate },
        },
      },
    }));

  if (locationFilters.length === 0) return [];

  // 4. Query matching listings — city paired with its date range
  const listings = await prisma.activityListing.findMany({
    where: {
      status: "active",
      ...(bookedListingIds.length > 0
        ? { id: { notIn: bookedListingIds } }
        : {}),
      OR: locationFilters,
    },
    include: {
      provider: { include: { community: true } },
      activitySlots: {
        where: {
          status: "available",
          remainingCapacity: { gt: 0 },
          OR: locations
            .filter((loc) => loc.city)
            .map((loc) => ({
              slotDate: { gte: loc.arrivalDate, lte: loc.departureDate },
            })),
        },
        orderBy: { slotDate: "asc" },
      },
      listingInterestTags: { select: { tagId: true } },
    },
  });

  // 5. Compute match scores and serialize
  const results: RecommendedActivity[] = listings.map((listing) => {
    const matchScore = listing.listingInterestTags.filter((lt) =>
      travellerTagIds.has(lt.tagId),
    ).length;

    return {
      id: String(listing.id),
      title: listing.title,
      description: listing.description,
      category: listing.category,
      city: listing.city,
      pricePerPerson: Number(listing.pricePerPerson),
      currency: listing.currency,
      communityName: listing.provider.community?.name ?? null,
      matchScore,
      slots: listing.activitySlots.map((s) => ({
        id: String(s.id),
        slotDate: s.slotDate.toISOString().split("T")[0],
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    };
  });

  // 6. Sort by matchScore desc, then pricePerPerson asc
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.pricePerPerson - b.pricePerPerson;
  });

  return results;
}
