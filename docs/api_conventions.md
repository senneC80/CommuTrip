# CommuTrip API Conventions

## Route Structure

API routes live in `src/app/api/` and follow RESTful patterns:

```
GET    /api/communities       → list all communities (public)

GET    /api/listings          → list/search activity listings
POST   /api/listings          → create a new listing (provider)
GET    /api/listings/[id]     → get listing detail
PUT    /api/listings/[id]     → update a listing (provider)

GET    /api/trips             → list current user's trips
POST   /api/trips             → create a new trip (traveller)
GET    /api/trips/[id]        → get trip detail with locations
PUT    /api/trips/[id]        → update a trip

POST   /api/bookings          → create a booking (traveller)
GET    /api/bookings          → list user's bookings

GET    /api/trips/[id]/recommendations  → get matching activities for a trip
```

## Route File Pattern

Every API route file (`route.ts`) follows this structure:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate request body
  const body = await request.json();

  // 3. Business logic + database operation
  const result = await prisma.someModel.create({ data: { ... } });

  // 4. Return response
  return NextResponse.json({ data: result }, { status: 201 });
}
```

## Response Format

Success responses:
```json
{ "data": { ... } }
{ "data": [ ... ] }
```

Error responses:
```json
{ "error": "Human-readable error message" }
```

Always use appropriate HTTP status codes: 200 (OK), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error).

## Authentication

- Use `getServerSession(authOptions)` to check the current user
- The session contains `session.user.id` (string), `session.user.email`, `session.user.name`, `session.user.role` (`"traveller"` or `"provider"`)
- Check `session.user.role` to gate provider-only or traveller-only routes (return 403 if wrong role)
- All mutation routes (POST, PUT, DELETE) require authentication
- GET routes for public data (listing browse, community detail) don't require auth
- GET routes for private data (my trips, my bookings) require auth

## Query Parameters

For list/search endpoints, use URL search params:

```
GET /api/listings?city=Cusco&fromDate=2026-06-01&toDate=2026-06-15&tags=culinary,nature
```

Parse with `request.nextUrl.searchParams`.

## Validation

Validate request bodies before database operations. Check for:
- Required fields present
- Correct types (numbers are numbers, dates are valid)
- Business rules (e.g., number_of_persons > 0, booking date has available slot)

Return 400 with a descriptive error message if validation fails.

## Known Gotchas

**BigInt serialisation:** All DB primary keys are `BigInt`. `JSON.stringify` cannot serialise BigInt natively — always convert to string before returning: `String(record.id)`. When receiving an ID from a client request body, convert back with `BigInt(id)` before passing to Prisma.

**Decimal fields:** Prisma returns `pricePerPerson`, `totalPrice`, etc. as a Prisma `Decimal` type, not a plain JS number. Use `Number(value)` for arithmetic or display formatting.

**`@db.Time()` fields:** `ActivitySlot.startTime` / `endTime` are PostgreSQL `TIME` columns. Create them with `new Date(\`1970-01-01T${hhmm}:00\`)`. When reading back, Prisma returns a `Date` object — extract hours/minutes with `.getHours()` / `.getMinutes()` (local timezone). Be consistent: if writing in local time, read in local time.

**`FormEvent` deprecated in React 19:** Next.js 16 ships React 19, which deprecates the named `FormEvent` export from `"react"`. Use `{ preventDefault(): void }` as the parameter type for form submit handlers instead.
