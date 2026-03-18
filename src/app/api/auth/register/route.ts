import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;

interface RegisterBody {
  email: string;
  password: string;
  role: "traveller" | "provider";
  firstName?: string;
  lastName?: string;
  displayName?: string;
  communityId?: string;
}

export async function POST(request: NextRequest) {
  let body: RegisterBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, role, firstName, lastName, displayName, communityId } =
    body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if (role !== "traveller" && role !== "provider") {
    return NextResponse.json(
      { error: "Role must be 'traveller' or 'provider'" },
      { status: 400 }
    );
  }

  // ── Check email uniqueness ────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // ── Hash password ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // ── Create user + role record in a transaction ────────────────────────────
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          role,
        },
      });

      if (role === "traveller") {
        await tx.traveller.create({
          data: { userId: created.id },
        });
      } else {
        await tx.provider.create({
          data: {
            userId: created.id,
            displayName: displayName ?? null,
            communityId: communityId ? BigInt(communityId) : null,
            joinedCommunityAt: communityId ? new Date() : null,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        data: {
          id: String(user.id), // BigInt -> string for JSON serialization
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register] transaction failed:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
