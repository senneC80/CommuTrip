import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import TravellerSidebar from "@/components/TravellerSidebar";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TripsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
  if (session.user.role !== "traveller") redirect("/dashboard");

  const travellerId = BigInt(session.user.id);

  const trips = await prisma.trip.findMany({
    where: { travellerId },
    include: {
      tripLocations: { orderBy: { sequenceNo: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <TravellerSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">My Trips</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your planned community-based travel experiences.
          </p>
        </div>

        {trips.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-gray-500">
              Create a trip to start!{" "}
              <Link
                href="/trips/create"
                className="font-medium text-coral hover:underline"
              >
                Plan your first trip →
              </Link>
            </p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-4">
            {trips.map((trip) => {
              const locs = trip.tripLocations;
              const firstArrival = locs[0]?.arrivalDate;
              const lastDeparture = locs[locs.length - 1]?.departureDate;
              const locSummary = locs
                .map((l) => l.city)
                .filter(Boolean)
                .join(" · ");

              return (
                <Link
                  key={String(trip.id)}
                  href={`/trips/${String(trip.id)}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-foreground">
                        {trip.title || "Untitled Trip"}
                      </h2>
                      {firstArrival && lastDeparture && (
                        <p className="text-sm text-gray-500">
                          {formatDate(firstArrival)} – {formatDate(lastDeparture)}
                        </p>
                      )}
                      {locSummary && (
                        <p className="text-sm text-gray-400">{locSummary}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm text-coral">View →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
