"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
}

interface Segment {
  location: string; // "City, Country" — split on submit
  arrivalDate: string;
  departureDate: string;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-warm-gray px-4 py-3 text-sm placeholder-gray-400 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30";

const labelCls = "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateTripForm({
  tags,
  existingTagIds,
}: {
  tags: Tag[];
  existingTagIds: string[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(existingTagIds)
  );
  const [segments, setSegments] = useState<Segment[]>([
    { location: "", arrivalDate: "", departureDate: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addSegment() {
    setSegments((prev) => [
      ...prev,
      { location: "", arrivalDate: "", departureDate: "" },
    ]);
  }

  function updateSegment(index: number, field: keyof Segment, value: string) {
    setSegments((prev) =>
      prev.map((seg, i) => (i === index ? { ...seg, [field]: value } : seg))
    );
  }

  function removeSegment(index: number) {
    if (segments.length === 1) return;
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");

    for (const seg of segments) {
      if (!seg.location.trim()) {
        setError("Each destination must have a location.");
        return;
      }
      if (!seg.arrivalDate || !seg.departureDate) {
        setError("Each destination must have arrival and departure dates.");
        return;
      }
      if (new Date(seg.arrivalDate) > new Date(seg.departureDate)) {
        setError("Arrival date must not be after departure date.");
        return;
      }
    }

    setLoading(true);

    // Parse "City, Country" location strings
    const parsedSegments = segments.map((seg) => {
      const commaIdx = seg.location.lastIndexOf(",");
      if (commaIdx === -1) {
        return {
          city: seg.location.trim(),
          arrivalDate: seg.arrivalDate,
          departureDate: seg.departureDate,
        };
      }
      return {
        city: seg.location.substring(0, commaIdx).trim(),
        country: seg.location.substring(commaIdx + 1).trim(),
        arrivalDate: seg.arrivalDate,
        departureDate: seg.departureDate,
      };
    });

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          tagIds: Array.from(selectedTagIds),
          segments: parsedSegments,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create trip.");
        setLoading(false);
        return;
      }

      router.push(`/trips/${json.data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-8">
        {/* Heading */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Where are we going?
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tell us about your trip to discover community experiences.
          </p>
        </div>

        {/* Trip Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Trip Title
          </label>
          <input
            type="text"
            placeholder="e.g. Mexican Culinary Adventure"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Interest Tags */}
        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              What interests you?
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTagIds.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
                      active
                        ? "border-coral bg-coral text-white"
                        : "border-gray-200 bg-warm-gray text-gray-600 hover:border-coral/50"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Itinerary Segments */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">
            Itinerary Segments
          </p>
          <div className="space-y-3">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3"
              >
                {/* Location */}
                <div>
                  <label className={labelCls}>Location</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Oaxaca, Mexico"
                      value={seg.location}
                      onChange={(e) =>
                        updateSegment(i, "location", e.target.value)
                      }
                      className={inputCls + " pl-9"}
                    />
                  </div>
                </div>

                {/* Arrival + Departure */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Arrival</label>
                    <input
                      type="date"
                      value={seg.arrivalDate}
                      onChange={(e) =>
                        updateSegment(i, "arrivalDate", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Departure</label>
                    <input
                      type="date"
                      value={seg.departureDate}
                      onChange={(e) =>
                        updateSegment(i, "departureDate", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Remove button */}
                {segments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSegment(i)}
                    className="text-xs text-gray-400 hover:text-red-400"
                  >
                    Remove destination
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSegment}
            className="mt-3 text-sm font-medium text-coral hover:underline"
          >
            + Add another destination
          </button>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-coral py-4 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:opacity-50"
        >
          {loading ? "Planning…" : "Start Planning"}
        </button>
      </form>
  );
}
