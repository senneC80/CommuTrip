# CommuTrip Architecture

## Overview

CommuTrip is a monorepo Next.js application. The frontend (React) and backend (API routes) live in the same project. PostgreSQL is the database, accessed exclusively through Prisma ORM.

## Data Flow

```
Browser (React) → API Route (Next.js) → Prisma → PostgreSQL
```

1. User interacts with a React page or form
2. Frontend calls an API route (`/api/trips`, `/api/bookings`, etc.)
3. API route validates the request, checks authentication via NextAuth session
4. API route uses Prisma client to read/write the database
5. Response flows back as JSON

For server components (pages that just display data), steps 2-3 are skipped — the component fetches data directly via Prisma on the server.

## Authentication Flow

NextAuth.js with credentials provider (email + password):

- Registration: `POST /api/auth/register` → hash password with bcrypt → create user in DB → also create traveller or provider record based on registration type
- Login: NextAuth credentials provider verifies email + password → creates session cookie
- Session: `getServerSession()` in API routes and server components to identify the current user
- A user can be either a traveller or a provider (separate role tables)

## User Roles

The ontology models Traveller and Local Provider as roles (not rigid subtypes). In the database:

- `users` table: shared identity (email, password, name)
- `travellers` table: exists if user has traveller role
- `providers` table: exists if user has provider role


## Key Feature: Activity Matching

When a traveller views their trip, the app recommends activities by querying:

1. Activity listings where city/country matches any trip location
2. Activity slots where date falls within the trip location's arrival/departure window
3. (Optional) Interest tags that overlap between traveller and listing

This is implemented as a Prisma query with filters, not a separate recommendations table. The ontology models this as a `«relator» Recommendation` but the MVP implements it as a derived query.

## Key Feature: Communities

For iteration 1, communities are seeded (not created by users). Each provider has a `community_id` FK. When a traveller views an activity listing, the provider's community info is displayed alongside it. No join-request flow in iteration 1.

## Folder Conventions

- **Pages** (`src/app/[route]/page.tsx`): server components by default, fetch data via Prisma directly (no API call needed for read-only display pages)
- **Client components** (`"use client"` directive): forms, interactive elements, anything with useState/useEffect/useSession
- **API routes** (`src/app/api/[route]/route.ts`): handle POST/PUT/DELETE, return JSON
- **Components** (`src/components/`): reusable UI components, named descriptively (e.g., `ActivityCard.tsx`, `TripForm.tsx`)
- **Lib** (`src/lib/`): shared utilities — `prisma.ts` (singleton client), `auth.ts` (NextAuth config), helper functions
