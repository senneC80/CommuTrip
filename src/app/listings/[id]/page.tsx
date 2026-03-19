import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import BookingPanel from "@/components/BookingPanel";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatSlotDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  culinary: "Food & Culture",
  nature: "Nature & Outdoors",
  crafts: "Crafts & Art",
  heritage: "Heritage & History",
  wellness: "Wellness",
};

const CATEGORY_STYLES: Record<string, string> = {
  culinary: "bg-orange-50 text-orange-700",
  nature: "bg-green-50 text-green-700",
  crafts: "bg-blue-50 text-blue-700",
  heritage: "bg-amber-50 text-amber-700",
  wellness: "bg-purple-50 text-purple-700",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let listingId: bigint;
  try {
    listingId = BigInt(id);
  } catch {
    notFound();
  }

  const session = await getServerSession(authOptions);

  const listing = await prisma.activityListing.findUnique({
    where: { id: listingId },
    include: {
      provider: {
        include: {
          community: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      activitySlots: {
        where: { status: "available", slotDate: { gte: new Date() } },
        orderBy: { slotDate: "asc" },
        take: 20,
      },
      listingInterestTags: { include: { tag: true } },
    },
  });

  if (!listing) notFound();

  // Fetch traveller's trips if they're logged in as a traveller
  let trips: { id: string; title: string | null }[] = [];
  if (session?.user.role === "traveller") {
    const rawTrips = await prisma.trip.findMany({
      where: { travellerId: BigInt(session.user.id) },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    });
    trips = rawTrips.map((t) => ({ id: String(t.id), title: t.title }));
  }

  const { provider } = listing;
  const community = provider.community;
  const providerName =
    provider.displayName ||
    [provider.user.firstName, provider.user.lastName].filter(Boolean).join(" ");

  const categoryKey = listing.category ?? "";
  const categoryLabel = CATEGORY_LABELS[categoryKey] ?? categoryKey;
  const categoryStyle = CATEGORY_STYLES[categoryKey] ?? "bg-gray-50 text-gray-600";

  const rating = listing.averageScore ? Number(listing.averageScore) : null;
  const firstSlot = listing.activitySlots[0];
  const timeRange = firstSlot
    ? `${formatTime(firstSlot.startTime)}${firstSlot.endTime ? ` – ${formatTime(firstSlot.endTime)}` : ""}`
    : null;

  const serializedSlots = listing.activitySlots.map((s) => ({
    id: String(s.id),
    displayDate: formatSlotDate(s.slotDate),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Image placeholder */}
        <div className="mb-8 flex h-56 items-center justify-center rounded-2xl bg-gray-100">
          <svg
            className="h-10 w-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-3 gap-10">
          {/* ── Left: Content ── */}
          <div className="col-span-2 space-y-6">
            {/* Category + Rating */}
            <div className="flex items-center gap-3 flex-wrap">
              {categoryLabel && (
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-medium uppercase tracking-wide ${categoryStyle}`}
                >
                  {categoryLabel}
                </span>
              )}
              {rating !== null ? (
                <span className="flex items-center gap-1 text-sm">
                  <span className="text-amber-400">★</span>
                  <span className="font-medium text-foreground">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-gray-400">
                    ({listing.reviewCount} reviews)
                  </span>
                </span>
              ) : null}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-foreground leading-snug">
              {listing.title}
            </h1>

            {/* Meta: location · time · provider */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
              {(listing.city || listing.country) && (
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
                  {[listing.city, listing.country].filter(Boolean).join(", ")}
                </span>
              )}
              {timeRange && (
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {timeRange}
                </span>
              )}
              {community ? (
                <Link
                  href={`/communities/${String(community.id)}`}
                  className="flex items-center gap-1.5 text-coral hover:underline"
                >
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {providerName} ›
                </Link>
              ) : (
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {providerName}
                </span>
              )}
            </div>

            {/* About */}
            <section>
              <h2 className="mb-2 text-base font-semibold text-foreground">
                About this experience
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {listing.description}
              </p>
            </section>

            {/* Interests */}
            {listing.listingInterestTags.length > 0 && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-foreground">
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.listingInterestTags.map(({ tag }) => (
                    <span
                      key={String(tag.id)}
                      className="rounded-full border border-gray-200 bg-warm-gray px-3 py-1 text-sm capitalize text-gray-600"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Community Impact */}
            {community && (
              <div className="rounded-2xl bg-green-50 p-5 flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Community Impact
                  </p>
                  <p className="mt-0.5 text-sm text-green-700">
                    {community.description
                      ? community.description
                      : `Supports ${community.name}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Booking Panel ── */}
          <div className="col-span-1">
            <BookingPanel
              price={Number(listing.pricePerPerson)}
              currency={listing.currency}
              slots={serializedSlots}
              listingId={String(listing.id)}
              isAuthenticated={!!session}
              userRole={session?.user.role}
              trips={trips}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
