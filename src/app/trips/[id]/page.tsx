import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import TravellerSidebar from "@/components/TravellerSidebar";
import {
  getRecommendationsForTrip,
  type RecommendedActivity,
  type RecommendedSlot,
} from "@/lib/recommendations";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime12h(d: Date): string {
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatTimeRange(start: Date, end: Date | null): string {
  if (!end) return formatTime12h(start);
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}

interface DayInfo {
  dayNumber: number;
  date: Date;
  dateKey: string;
  city: string | null;
}

function generateTripDays(
  locations: { arrivalDate: Date; departureDate: Date; city: string | null }[],
): DayInfo[] {
  if (locations.length === 0) return [];

  const firstDate = locations[0].arrivalDate;
  const lastDate = locations[locations.length - 1].departureDate;

  const days: DayInfo[] = [];
  const current = new Date(firstDate);
  let dayNumber = 1;

  while (current <= lastDate) {
    const key = getDateKey(current);
    const location = locations.find(
      (loc) => key >= getDateKey(loc.arrivalDate) && key <= getDateKey(loc.departureDate),
    );
    days.push({
      dayNumber,
      date: new Date(current),
      dateKey: key,
      city: location?.city ?? null,
    });
    current.setUTCDate(current.getUTCDate() + 1);
    dayNumber++;
  }

  return days;
}

// Category icon background colors (small colored circle in suggested cards)
const CATEGORY_ICON_STYLES: Record<string, string> = {
  culinary: "bg-orange-100",
  nature: "bg-green-100",
  crafts: "bg-blue-100",
  heritage: "bg-amber-100",
  wellness: "bg-purple-100",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");

  let tripId: bigint;
  try {
    tripId = BigInt(id);
  } catch {
    notFound();
  }

  // Query 1: Trip with locations, bookings, and traveller interest tags
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripLocations: { orderBy: { sequenceNo: "asc" } },
      bookings: {
        where: { status: "confirmed" },
        include: {
          listing: {
            include: {
              provider: { include: { community: true } },
            },
          },
          slot: true,
        },
      },
      traveller: {
        include: {
          travellerInterestTags: { include: { tag: true } },
        },
      },
    },
  });

  if (!trip || String(trip.travellerId) !== session.user.id) notFound();

  // Query 2: Recommendations
  const recommendations = await getRecommendationsForTrip(
    tripId,
    trip.travellerId,
  );

  // Build day-by-day structure
  const locs = trip.tripLocations;
  const days = generateTripDays(locs);

  const locationChain = locs
    .map((l) => l.city)
    .filter(Boolean)
    .join(" → ");

  const firstArrival = locs[0]?.arrivalDate;
  const lastDeparture = locs[locs.length - 1]?.departureDate;

  const interestTags = trip.traveller.travellerInterestTags.map(
    (tt) => tt.tag,
  );

  // Group bookings by day
  const bookingsByDay = new Map<string, typeof trip.bookings>();
  for (const booking of trip.bookings) {
    if (booking.slot?.slotDate) {
      const key = getDateKey(booking.slot.slotDate);
      const arr = bookingsByDay.get(key) ?? [];
      arr.push(booking);
      bookingsByDay.set(key, arr);
    }
  }

  // Build date → city map from trip days for city-aware filtering
  const dateCityMap = new Map<string, string | null>();
  for (const day of days) {
    dateCityMap.set(day.dateKey, day.city);
  }

  // Group recommendations by day, only showing listings whose city matches the day's city
  const recommendationsByDay = new Map<
    string,
    (RecommendedActivity & { displaySlot: RecommendedSlot })[]
  >();
  for (const rec of recommendations) {
    for (const slot of rec.slots) {
      const dayCity = dateCityMap.get(slot.slotDate);
      if (dayCity && rec.city && rec.city !== dayCity) continue;
      const arr = recommendationsByDay.get(slot.slotDate) ?? [];
      arr.push({ ...rec, displaySlot: slot });
      recommendationsByDay.set(slot.slotDate, arr);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <TravellerSidebar />
      <main className="flex-1 overflow-auto p-8">
        {/* Back link */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          My Trips
        </Link>

        {/* ── Header ── */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl font-bold text-foreground">
            {trip.title || "Untitled Trip"}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
            {/* Location chain */}
            {locationChain && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {locationChain}
              </span>
            )}

            {/* Date range */}
            {firstArrival && lastDeparture && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDate(firstArrival)} – {formatDate(lastDeparture)}
              </span>
            )}
          </div>

          {/* Interest tags */}
          {interestTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {interestTags.map((tag) => (
                <span
                  key={String(tag.id)}
                  className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-coral"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Day-by-day timeline ── */}
        <div className="relative max-w-3xl">
          {days.map((day, idx) => {
            const dayBookings = bookingsByDay.get(day.dateKey) ?? [];
            const dayRecs = recommendationsByDay.get(day.dateKey) ?? [];
            const isLast = idx === days.length - 1;

            return (
              <div key={day.dateKey} className="relative flex gap-5 pb-8">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-coral bg-background" />
                  {!isLast && (
                    <div className="w-px flex-1 bg-gray-200" />
                  )}
                </div>

                {/* Day content */}
                <div className="flex-1 min-w-0">
                  {/* Day header */}
                  <div className="mb-4 flex items-baseline gap-3">
                    <span className="text-sm font-bold text-foreground">
                      Day {day.dayNumber}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDayHeader(day.date)}
                    </span>
                    {day.city && (
                      <span className="text-sm font-medium text-gray-400">
                        — {day.city}
                      </span>
                    )}
                  </div>

                  {/* Booked activities */}
                  {dayBookings.map((booking) => (
                    <div
                      key={String(booking.id)}
                      className="mb-3 flex items-start justify-between rounded-2xl border-2 border-green-200 bg-green-50 p-5"
                    >
                      <div>
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-700">
                          Booked
                        </span>
                        {booking.slot && (
                          <p className="mt-2 text-xs text-gray-500">
                            {formatTimeRange(
                              booking.slot.startTime,
                              booking.slot.endTime,
                            )}
                          </p>
                        )}
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {booking.listing.title}
                        </p>
                        {booking.listing.provider.community && (
                          <p className="mt-0.5 text-sm text-gray-500">
                            {booking.listing.provider.community.name}
                          </p>
                        )}
                      </div>
                      {/* Checkmark */}
                      <svg
                        className="mt-1 h-6 w-6 flex-shrink-0 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ))}

                  {/* Suggested activities */}
                  {dayRecs.map((rec) => (
                    <Link
                      key={`${rec.id}-${rec.displaySlot.id}`}
                      href={`/listings/${rec.id}?slotId=${rec.displaySlot.id}&tripId=${String(tripId)}`}
                      className="mb-3 flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md"
                    >
                      {/* Category icon placeholder */}
                      <div
                        className={`mt-0.5 h-10 w-10 flex-shrink-0 rounded-xl ${CATEGORY_ICON_STYLES[rec.category ?? ""] ?? "bg-gray-100"}`}
                      />

                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                          Suggested
                        </span>
                        <p className="mt-1.5 text-base font-semibold text-foreground">
                          {rec.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                          {rec.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                          {/* Time */}
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {formatTimeRange(
                              rec.displaySlot.startTime,
                              rec.displaySlot.endTime,
                            )}
                          </span>
                          {/* Community */}
                          {rec.communityName && (
                            <span className="flex items-center gap-1">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {rec.communityName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <span className="flex-shrink-0 text-base font-semibold text-coral">
                        ${rec.pricePerPerson}
                      </span>
                    </Link>
                  ))}

                  {/* Add note placeholder */}
                  <button
                    type="button"
                    className="mt-1 text-sm text-gray-400 hover:text-coral"
                    disabled
                  >
                    + Add a note or place
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
