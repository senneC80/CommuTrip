"use client";

import { useState, useEffect, FormEvent } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Mode = "signup" | "login";
type Role = "traveller" | "provider";

interface Community {
  id: string;
  name: string;
  city: string;
  country: string;
}

export default function AuthForm() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signup");
  const [role, setRole] = useState<Role>("traveller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setCommunities(json.data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            role,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            communityId: role === "provider" && communityId ? communityId : undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Registration failed");
          setLoading(false);
          return;
        }

        // Auto sign-in after successful registration
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Account created but login failed. Please log in manually.");
          setMode("login");
          setLoading(false);
          return;
        }

        router.push(role === "traveller" ? "/trips" : "/dashboard");
      } else {
        // Login mode
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        const session = await getSession();
        const userRole = session?.user?.role;
        router.push(userRole === "provider" ? "/dashboard" : "/trips");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <h1 className="text-center text-4xl font-serif text-foreground">
          CommuTrip
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Discover authentic community-based travel experiences.
        </p>

        {/* Mode toggle */}
        <div className="mt-8 flex rounded-full border border-gray-200 bg-warm-gray p-1">
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-white text-foreground shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-white text-foreground shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Role toggle (signup only) */}
          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                I am a
              </label>
              <div className="flex rounded-full border border-gray-200 bg-warm-gray p-1">
                <button
                  type="button"
                  onClick={() => setRole("traveller")}
                  className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                    role === "traveller"
                      ? "bg-foreground text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Traveller
                </button>
                <button
                  type="button"
                  onClick={() => setRole("provider")}
                  className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                    role === "provider"
                      ? "bg-foreground text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Provider
                </button>
              </div>
            </div>
          )}

          {/* Name fields (signup only) */}
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-warm-gray px-4 py-3 text-sm placeholder-gray-400 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-warm-gray px-4 py-3 text-sm placeholder-gray-400 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
              />
            </div>
          )}

          {/* Community dropdown (signup + provider only) */}
          {mode === "signup" && role === "provider" && (
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-warm-gray px-4 py-3 text-sm text-gray-700 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
            >
              <option value="">Select a community</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}, {c.country}
                </option>
              ))}
            </select>
          )}

          {/* Email */}
          <input
            type="email"
            placeholder="hello@traveler.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-warm-gray px-4 py-3 text-sm placeholder-gray-400 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-gray-200 bg-warm-gray px-4 py-3 text-sm placeholder-gray-400 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          />

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-coral py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
                ? "Start Planning"
                : "Log In"}
          </button>
        </form>

        {/* Footer */}
        {mode === "signup" && (
          <p className="mt-4 text-center text-xs text-gray-400">
            By signing up, you agree to our Community Guidelines.
          </p>
        )}
      </div>
    </div>
  );
}
