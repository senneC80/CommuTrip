# CommuTrip

Community-based tourism marketplace connecting travellers with authentic local community experiences. Travellers create trips, get matched with CBT activities, and book them. Providers (belonging to communities) list and manage activities.

## Tech Stack

Next.js 14+ (App Router, TypeScript), PostgreSQL, Prisma ORM, NextAuth.js (credentials provider), Tailwind CSS.

## Project Structure

```
src/
  app/                    # Next.js App Router (pages + API routes)
    (auth)/               # Auth pages — combined /auth page (sign up + log in)
    dashboard/            # Provider dashboard
    trips/                # Trip pages (list, create, detail)
      [id]/               # Trip detail — day-by-day itinerary with booked + suggested activities
    listings/             # Activity listing pages (browse, create, detail)
      [id]/               # Listing detail with BookingPanel
    communities/          # Community pages (detail)
    bookings/
      confirm/            # Booking confirmation page (review details → confirm & pay)
    api/                  # Backend API routes
      auth/               # NextAuth endpoints + POST /api/auth/register
      communities/        # GET /api/communities
      trips/              # POST /api/trips (create)
        [id]/recommendations/  # GET — activity matching for a trip
      listings/           # POST /api/listings (create)
      bookings/           # POST /api/bookings (create booking, decrement slot capacity)
  components/             # Reusable React components
    # Navbar.tsx              — top navbar; hidden on /auth, provider, and traveller pages
    # TravellerSidebar.tsx    — left sidebar for traveller pages (/trips/*)
    # ProviderSidebar.tsx     — left sidebar for provider pages (/dashboard, /listings/create)
    # BookingPanel.tsx        — booking widget on listing detail; navigates to /bookings/confirm
    # ConfirmBookingCard.tsx  — confirmation card with price breakdown + Confirm & Pay
  lib/                    # Shared utilities
    # prisma.ts           — singleton Prisma client
    # auth.ts             — NextAuth config (credentials provider, JWT session)
    # recommendations.ts  — shared recommendation query (city + date + interest tag matching)
prisma/
  schema.prisma           # Database schema (source of truth for data model)
  seed.ts                 # Seed data script
docs/                     # Project documentation
  architecture.md         # Detailed architecture and data flow
  database_schema.md      # ERD rationale and Prisma conventions
  commutrip_erd_v1.dbml   # DBML source file for the ERD diagram
  api_conventions.md      # API route patterns, response formats, and known gotchas
  ui-prototypes/          # Screenshot references for each page
```

## Commands

- `npm run dev` — start development server
- `npx prisma migrate dev` — apply schema changes to database
- `npx prisma studio` — open database GUI
- `npx prisma db seed` — populate with seed data
- `npm run build` — verify production build

## Key Conventions

- Database schema is derived from the CommuTrip OntoUML ontology. Don't restructure tables without checking `docs/database_schema.md`.
- API routes return JSON. Use consistent response format: `{ data }` on success, `{ error: string }` on failure.
- All pages use server components by default. Add `"use client"` only when the component needs interactivity (forms, state, event handlers).
- Use Prisma for all database access. Never write raw SQL.
- Passwords are hashed with bcrypt. Never store or log plaintext passwords.
- UI prototypes in `docs/ui-prototypes/` are the design reference. Match them.

## Architecture Reference

For detailed architecture decisions, see `docs/architecture.md`.
For database design rationale, see `docs/database_schema.md`.
For API route conventions, see `docs/api_conventions.md`.
