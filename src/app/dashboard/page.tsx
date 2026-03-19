import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProviderSidebar from "@/components/ProviderSidebar";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-500",
};

const CATEGORY_STYLES: Record<string, string> = {
  culinary: "bg-orange-50 text-orange-700",
  nature: "bg-green-50 text-green-700",
  crafts: "bg-blue-50 text-blue-700",
  heritage: "bg-amber-50 text-amber-700",
  wellness: "bg-purple-50 text-purple-700",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth");
  if (session.user.role !== "provider") redirect("/trips");

  const providerId = BigInt(session.user.id);

  const listings = await prisma.activityListing.findMany({
    where: { providerId },
    include: {
      activitySlots: {
        orderBy: { slotDate: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const listingIds = listings.map((l) => l.id);

  const bookings =
    listingIds.length > 0
      ? await prisma.booking.findMany({
          where: { listingId: { in: listingIds } },
          include: {
            listing: { select: { title: true } },
            traveller: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
          orderBy: { bookedAt: "desc" },
          take: 20,
        })
      : [];

  return (
    <div className="flex min-h-screen bg-background">
      <ProviderSidebar />

      <main className="flex-1 overflow-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            My Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your community experiences
          </p>
        </div>

        {/* My Listings */}
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            My Listings
          </h2>

          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-sm text-gray-400">
                No listings yet.{" "}
                <Link href="/listings/create" className="text-coral hover:underline">
                  Create your first listing
                </Link>{" "}
                to start welcoming travellers.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const slot = listing.activitySlots[0];
                const categoryKey = (listing.category ?? "").toLowerCase();
                const categoryStyle =
                  CATEGORY_STYLES[categoryKey] ?? "bg-gray-50 text-gray-600";
                const statusStyle =
                  STATUS_STYLES[listing.status] ?? "bg-gray-100 text-gray-500";

                return (
                  <div
                    key={String(listing.id)}
                    className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    {/* Badges */}
                    <div className="mb-3 flex items-center justify-between">
                      {listing.category && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${categoryStyle}`}
                        >
                          {listing.category}
                        </span>
                      )}
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusStyle}`}
                      >
                        {listing.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-sm font-semibold text-foreground leading-snug">
                      {listing.title}
                    </h3>

                    {/* Details */}
                    <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                      {/* Location */}
                      {(listing.city || listing.country) && (
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {[listing.city, listing.country].filter(Boolean).join(", ")}
                        </span>
                      )}

                      {/* Time range */}
                      {slot && (
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(slot.startTime)}
                          {slot.endTime ? ` – ${formatTime(slot.endTime)}` : ""}
                        </span>
                      )}

                      {/* Price */}
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {listing.currency} {Number(listing.pricePerPerson).toFixed(2)} / person
                      </span>

                      {/* Capacity */}
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.capacity} max
                      </span>
                    </div>

                    {/* View details link */}
                    <Link
                      href={`/listings/${String(listing.id)}`}
                      className="mt-4 text-xs font-medium text-coral hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Incoming Bookings */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Incoming Bookings
          </h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-14">
              <svg
                className="mb-3 h-10 w-10 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400">
                No bookings yet. Share your listings to attract travellers!
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Traveller</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Listing</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Persons</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const name = [
                      booking.traveller.user.firstName,
                      booking.traveller.user.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || booking.traveller.user.email;

                    const bookingStatusStyle =
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "cancelled"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500";

                    return (
                      <tr
                        key={String(booking.id)}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground">{name}</td>
                        <td className="px-4 py-3 text-gray-600">{booking.listing.title}</td>
                        <td className="px-4 py-3 text-gray-600">{booking.numberOfPersons}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {booking.currency} {Number(booking.totalPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${bookingStatusStyle}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(booking.bookedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
