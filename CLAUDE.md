# CommuTrip

Community-based tourism marketplace connecting travellers with authentic local community experiences. Travellers create trips, get matched with CBT activities, and book them. Providers (belonging to communities) list and manage activities.

## Tech Stack

Next.js 14+ (App Router, TypeScript), PostgreSQL, Prisma ORM, NextAuth.js (credentials provider), Tailwind CSS.

## Project Structure

```
src/
  app/                    # Next.js App Router (pages + API routes)
    (auth)/               # Auth pages (login, register)
    trips/                # Trip pages (list, create, detail)
    listings/             # Activity listing pages (browse, create, detail)
    communities/          # Community pages (detail)
    bookings/             # Booking pages
    api/                  # Backend API routes
      auth/               # NextAuth endpoints
      trips/              # Trip CRUD
      listings/           # Listing CRUD + search
      bookings/           # Booking creation
  components/             # Reusable React components
  lib/                    # Shared utilities (prisma client, auth config, helpers)
prisma/
  schema.prisma           # Database schema (source of truth for data model)
  seed.ts                 # Seed data script
docs/                     # Project documentation
  architecture.md         # Detailed architecture and data flow
  database_schema.md      # ERD rationale and Prisma conventions
  api_conventions.md      # API route patterns and response formats
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
