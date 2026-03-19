"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't render navbar on auth page or provider dashboard (sidebar replaces it)
  if (pathname === "/auth" || pathname.startsWith("/dashboard")) return null;

  return (
    <nav className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
      <Link href="/" className="text-xl font-serif text-foreground">
        CommuTrip
      </Link>

      <div className="flex items-center gap-4">
        {status === "authenticated" && session ? (
          <>
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/auth" })}
              className="text-sm text-coral hover:underline"
            >
              Log Out
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <>
            <Link
              href="/auth"
              className="text-sm text-gray-600 hover:text-foreground"
            >
              Log In
            </Link>
            <Link
              href="/auth"
              className="rounded-full bg-coral px-4 py-2 text-sm text-white hover:bg-coral-hover"
            >
              Sign Up
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
