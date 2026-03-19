import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let communityId: bigint;
  try {
    communityId = BigInt(id);
  } catch {
    notFound();
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      providers: {
        include: {
          activityListings: {
            where: { status: "active" },
            include: {
              activitySlots: {
                where: { status: "available", slotDate: { gte: new Date() } },
                orderBy: { slotDate: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!community) notFound();

  const memberCount = community.providers.length;
  const allListings = community.providers.flatMap((p) => p.activityListings);
  const experiencesHosted = allListings.length;
  const totalReviews = allListings.reduce((sum, l) => sum + l.reviewCount, 0);

  const ratedListings = allListings.filter((l) => l.reviewCount > 0);
  const avgRating =
    ratedListings.length > 0
      ? ratedListings.reduce((sum, l) => sum + Number(l.averageScore ?? 0), 0) /
        ratedListings.length
      : null;

  // Initials badge from first two words
  const initials = community.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const impactMetrics = [
    {
      label: "Avg Rating",
      value: avgRating ? `${avgRating.toFixed(1)}★` : "—",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
    },
    {
      label: "Reviews",
      value: totalReviews.toString(),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      label: "Experiences Hosted",
      value: experiencesHosted.toString(),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: "Travellers Served",
      value: "—",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      label: "Funds Raised",
      value: "—",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl font-semibold text-green-700">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {community.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-500">
              {(community.city || community.country) && (
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {[community.city, community.country].filter(Boolean).join(", ")}
                </span>
              )}
              <span>Est. {community.createdAt.getFullYear()}</span>
              <span>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>

        {/* About */}
        {community.description && (
          <section className="mb-10">
            <h2 className="mb-2 text-base font-semibold text-foreground">
              About this community
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {community.description}
            </p>
          </section>
        )}

        {/* Community Impact */}
        <section className="mb-10">
          <h2 className="mb-5 text-base font-semibold text-foreground">
            Community Impact
          </h2>
          <div className="grid grid-cols-5 gap-2 text-center">
            {impactMetrics.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex justify-center text-gray-400">{m.icon}</div>
                <p className="text-lg font-semibold text-foreground">{m.value}</p>
                <p className="text-xs text-gray-400 leading-tight">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Experiences */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Experiences by {community.name}
          </h2>
          {allListings.length === 0 ? (
            <p className="text-sm text-gray-400">No experiences yet.</p>
          ) : (
            <div className="space-y-4">
              {allListings.map((listing) => {
                const firstSlot = listing.activitySlots[0];
                const timeRange = firstSlot
                  ? `${formatTime(firstSlot.startTime)}${firstSlot.endTime ? ` – ${formatTime(firstSlot.endTime)}` : ""}`
                  : null;
                const categoryKey = listing.category ?? "";
                const categoryLabel = CATEGORY_LABELS[categoryKey] ?? categoryKey;
                const categoryStyle =
                  CATEGORY_STYLES[categoryKey] ?? "bg-gray-50 text-gray-600";

                return (
                  <Link
                    key={String(listing.id)}
                    href={`/listings/${String(listing.id)}`}
                    className="block rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      {categoryLabel && (
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-medium uppercase tracking-wide ${categoryStyle}`}
                        >
                          {categoryLabel}
                        </span>
                      )}
                      <span className="shrink-0 text-base font-semibold text-foreground">
                        {listing.currency} {Number(listing.pricePerPerson).toFixed(0)}
                      </span>
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-foreground">
                      {listing.title}
                    </h3>
                    <div className="mb-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      {(listing.city || listing.country) && (
                        <span>
                          {[listing.city, listing.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {timeRange && <span>{timeRange}</span>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {listing.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
