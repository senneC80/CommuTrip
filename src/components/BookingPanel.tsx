"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Slot {
  id: string;
  displayDate: string;
}

interface Trip {
  id: string;
  title: string | null;
}

export default function BookingPanel({
  price,
  currency,
  slots,
  listingId,
  isAuthenticated,
  userRole,
  trips,
  defaultSlotId,
  defaultTripId,
}: {
  price: number;
  currency: string;
  slots: Slot[];
  listingId: string;
  isAuthenticated: boolean;
  userRole?: string;
  trips: Trip[];
  defaultSlotId?: string;
  defaultTripId?: string;
}) {
  const router = useRouter();
  const [selectedSlotId, setSelectedSlotId] = useState(
    (defaultSlotId && slots.some((s) => s.id === defaultSlotId) ? defaultSlotId : slots[0]?.id) ?? "",
  );
  const [selectedTripId, setSelectedTripId] = useState(
    (defaultTripId && trips.some((t) => t.id === defaultTripId) ? defaultTripId : trips[0]?.id) ?? "",
  );
  const [guests, setGuests] = useState(1);

  const isTraveller = isAuthenticated && userRole === "traveller";
  const hasNoTrips = isTraveller && trips.length === 0;
  const hasNoSlots = slots.length === 0;

  function handleBook() {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (!isTraveller || hasNoTrips || hasNoSlots) return;

    const params = new URLSearchParams({
      listingId,
      slotId: selectedSlotId,
      tripId: selectedTripId,
      guests: String(guests),
    });
    router.push(`/bookings/confirm?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5 sticky top-6">
      {/* Price */}
      <div>
        <p className="text-xs text-gray-400">From</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-semibold text-foreground">
            {currency} {price.toFixed(0)}
          </span>
          <span className="text-sm text-gray-400">/ person</span>
        </div>
      </div>

      {/* Date selector */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
        {hasNoSlots ? (
          <p className="text-sm text-gray-400">No upcoming slots available</p>
        ) : (
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-warm-gray px-3 py-2.5 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          >
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.displayDate}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Trip selector (multiple trips only) */}
      {isTraveller && trips.length > 1 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Trip</label>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-warm-gray px-3 py-2.5 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          >
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title || "Untitled Trip"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Guests */}
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500">Guests</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-600 hover:bg-gray-50"
          >
            –
          </button>
          <span className="min-w-[80px] text-center text-sm font-medium text-foreground">
            {guests} {guests === 1 ? "Adult" : "Adults"}
          </span>
          <button
            type="button"
            onClick={() => setGuests((g) => g + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* No trips warning */}
      {hasNoTrips && (
        <p className="text-xs text-amber-600">
          <Link href="/trips/create" className="underline">
            Create a trip
          </Link>{" "}
          before booking an experience.
        </p>
      )}

      {/* Book button */}
      <button
        onClick={handleBook}
        disabled={hasNoTrips || hasNoSlots}
        className="w-full rounded-full bg-coral py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:opacity-50"
      >
        {!isAuthenticated ? "Log in to Book" : "Book Experience"}
      </button>

      <p className="text-center text-xs text-gray-400">No charge until you confirm.</p>
    </div>
  );
}
