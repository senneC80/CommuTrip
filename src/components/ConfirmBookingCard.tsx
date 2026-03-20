"use client";

import { useState } from "react";
import Link from "next/link";

interface ConfirmBookingCardProps {
  listingId: string;
  slotId: string;
  tripId: string;
  guests: number;
  experienceName: string;
  providerName: string;
  dayLabel: string;
  timeRange: string;
  pricePerPerson: number;
  currency: string;
  backHref: string;
}

const COMMISSION_RATE = 0.1;

export default function ConfirmBookingCard({
  listingId,
  slotId,
  tripId,
  guests,
  experienceName,
  providerName,
  dayLabel,
  timeRange,
  pricePerPerson,
  currency,
  backHref,
}: ConfirmBookingCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = pricePerPerson * guests;
  const fee = Math.round(subtotal * COMMISSION_RATE * 100) / 100;
  const total = subtotal + fee;

  async function handleConfirm() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          slotId,
          numberOfPersons: guests,
          tripId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to confirm booking.");
        return;
      }

      window.location.href = `/trips/${tripId}`;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      {/* Heading */}
      <h1 className="text-center text-xl font-bold text-foreground">
        Confirm Booking
      </h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        Review your community experience details.
      </p>

      {/* Details */}
      <div className="mt-8 space-y-4">
        <DetailRow label="Experience" value={experienceName} />
        <DetailRow label="Provider" value={providerName} />
        <DetailRow label="Date" value={dayLabel} />
        <DetailRow label="Time" value={timeRange} />
        <DetailRow
          label="Guests"
          value={`${guests} ${guests === 1 ? "Person" : "Persons"}`}
        />
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-gray-100" />

      {/* Price breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>
            {currency}&nbsp;{pricePerPerson.toFixed(0)} × {guests}
          </span>
          <span>{currency}&nbsp;{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Community Support Fee</span>
          <span>{currency}&nbsp;{fee.toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="mt-4 flex justify-between text-base font-bold text-foreground">
        <span>Total</span>
        <span>
          {currency}&nbsp;{total.toFixed(2)}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-center text-xs text-red-500">{error}</p>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="mt-6 w-full rounded-full bg-coral py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:opacity-50"
      >
        {loading ? "Confirming…" : "Confirm & Pay"}
      </button>

      {/* Back link */}
      <Link
        href={backHref}
        className="mt-3 block text-center text-sm text-gray-500 hover:text-foreground"
      >
        Back
      </Link>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-3">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
