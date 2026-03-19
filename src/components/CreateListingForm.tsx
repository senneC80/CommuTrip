"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "culinary", label: "Food & Culture" },
  { value: "nature", label: "Nature & Outdoors" },
  { value: "crafts", label: "Crafts & Art" },
  { value: "heritage", label: "Heritage & History" },
  { value: "wellness", label: "Wellness" },
];

// Displayed Mon → Sun; Sun has JS day index 0
const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

const ALL_DAY_VALUES = DAYS.map((d) => d.value);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-warm-gray px-4 py-3 text-sm placeholder-gray-400 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30";

const labelCls = "mb-1.5 block text-sm font-medium text-gray-700";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateListingForm({ tags }: { tags: Tag[] }) {
  const router = useRouter();

  // Listing fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  // Schedule
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  // Form state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDay(value: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  function toggleAll() {
    const allSelected = ALL_DAY_VALUES.every((v) => selectedDays.has(v));
    setSelectedDays(allSelected ? new Set() : new Set(ALL_DAY_VALUES));
  }

  const allSelected = ALL_DAY_VALUES.every((v) => selectedDays.has(v));

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Activity title is required.");
    if (!description.trim()) return setError("Description is required.");
    const price = parseFloat(pricePerPerson);
    if (isNaN(price) || price <= 0) return setError("Price per person must be a positive number.");
    if (!startTime) return setError("Start time is required.");
    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) return setError("Capacity must be a positive number.");
    if (selectedDays.size === 0) return setError("Select at least one day of the week.");

    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          pricePerPerson: price,
          capacity: cap,
          tagIds: Array.from(selectedTagIds),
          days: Array.from(selectedDays),
          startTime,
          endTime: endTime || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create listing.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 pb-16">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">List your experience</h1>
        <p className="mt-1 text-sm text-gray-500">
          Share your community&apos;s story and culture with the world.
        </p>
      </div>

      {/* ── Listing details ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Listing Details
        </h2>

        <div>
          <label className={labelCls}>Activity Title</label>
          <input
            type="text"
            placeholder="e.g. Traditional Weaving Workshop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            rows={4}
            placeholder="Describe the experience and the community impact..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls + " resize-none"}
            required
          />
        </div>

        <div>
          <label className={labelCls}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls + " text-gray-700"}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>City</label>
            <input
              type="text"
              placeholder="e.g. Oaxaca"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input
              type="text"
              placeholder="e.g. Mexico"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Price per person (EUR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="25"
              value={pricePerPerson}
              onChange={(e) => setPricePerPerson(e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Capacity</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="8"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div>
            <label className={labelCls}>Interest Tags</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTagIds.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border px-3 py-1 text-sm capitalize transition-colors ${
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
      </section>

      {/* ── Schedule ──────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            When does this experience run?
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Slots will be automatically created for the next month.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Day of week</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {/* All button */}
            <button
              type="button"
              onClick={toggleAll}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                allSelected
                  ? "border-coral bg-coral text-white"
                  : "border-gray-200 bg-warm-gray text-gray-600 hover:border-coral/50"
              }`}
            >
              All
            </button>
            {DAYS.map((d) => {
              const active = selectedDays.has(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? "border-coral bg-coral text-white"
                      : "border-gray-200 bg-warm-gray text-gray-600 hover:border-coral/50"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-foreground py-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Publishing…" : "Publish Listing"}
      </button>
    </form>
  );
}
