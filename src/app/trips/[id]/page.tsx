import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import TravellerSidebar from "@/components/TravellerSidebar";

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

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripLocations: { orderBy: { sequenceNo: "asc" } },
    },
  });

  if (!trip || String(trip.travellerId) !== session.user.id) notFound();

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const locs = trip.tripLocations;
  const firstArrival = locs[0]?.arrivalDate;
  const lastDeparture = locs[locs.length - 1]?.departureDate;

  return (
    <div className="flex min-h-screen bg-background">
      <TravellerSidebar />
      <main className="flex-1 overflow-auto p-8">
      {/* Back */}
      <Link
        href="/trips"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        My Trips
      </Link>

      {/* Header */}
      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {trip.title || "Untitled Trip"}
        </h1>
        {firstArrival && lastDeparture && (
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(firstArrival)} – {formatDate(lastDeparture)}
          </p>
        )}
      </div>

      {/* Itinerary */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Itinerary
        </h2>
        <div className="space-y-3">
          {locs.map((loc) => (
            <div
              key={String(loc.id)}
              className="rounded-2xl border border-gray-100 bg-white p-5"
            >
              <p className="font-medium text-foreground">{loc.city}</p>
              {loc.country && (
                <p className="text-sm text-gray-400">{loc.country}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                {formatDate(loc.arrivalDate)} – {formatDate(loc.departureDate)}
              </p>
            </div>
          ))}
        </div>
      </section>
      </main>
    </div>
  );
}
