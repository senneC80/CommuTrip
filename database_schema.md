# CommuTrip Database Schema

## Ontology-to-Database Mapping

This schema is derived from the CommuTrip OntoUML ontology using ontology-driven MVP transformation rules. The mapping follows these principles:

- **Object/relator classes** (ontology kinds, relators) → database tables
- **Event classes** (ontology events like Register, Create Trip) → NOT tables; they become API routes that create/modify rows in other tables
- **Mode/quality classes** (e.g., Commission Fee, Offered Price) → attributes on parent tables, not separate tables
- **Phase classes** (e.g., Available Time Slot / Booked Time Slot) → single table with status column
- **Generalization hierarchies** → one table for superclass + one table per role subclass

## Tables (Iteration 1)

### User hierarchy
- `users` — shared identity, includes `role` column (`traveller` or `provider`). From ontology: `«roleMixin» User`
- `travellers` — traveller-specific data (FK to users). From ontology: `«roleMixin» Traveller`
- `providers` — provider-specific data (FK to users, FK to communities). From ontology: `«roleMixin» Local Provider` + simplified `«relator» Community Membership`

A user is exactly one role — either a traveller or a provider. The `role` column on `users` enforces this, and the user has a corresponding record in either `travellers` or `providers` (never both). **MVP simplification:** the ontology models Traveller and Local Provider as `«roleMixin»` (allowing a user to play both roles). This was restricted for MVP to simplify registration, UI navigation, and session handling. Can be relaxed in a future iteration if needed.

### Communities
- `communities` — seeded for iteration 1. From ontology: `«kind» Community`

### Activity listings
- `activity_listings` — core marketplace entity. From ontology: `«kind» Activity Listing`. Price fields from `«mode» Offered Price` are flattened into this table.
- `activity_slots` — time slots for activities. From ontology: `«phase» Available Time Slot` and `«phase» Booked Time Slot` collapsed into single table with `status` column.

### Trips
- `trips` — traveller's planned journey. From ontology: `«kind» Trip`
- `trip_locations` — stops within a trip. From ontology: `«kind» Trip Location` with `«componentOf»` relationship to Trip.

### Interest tags
- `interest_tags` — categorization tags. From ontology: `«kind» Interest Tag`
- `traveller_interest_tags` — junction table for traveller ↔ tag (many-to-many)
- `listing_interest_tags` — junction table for listing ↔ tag (many-to-many)

### Bookings
- `bookings` — mediates trip ↔ listing. From ontology: `«relator» Booking`. Commission fields from `«quality» Commission Fee` are flattened here. Price fields are snapshots at booking time (ontology: `«historicalDependence» after booking`).

## Prisma Conventions

- Model names: PascalCase singular (e.g., `User`, `ActivityListing`, `TripLocation`)
- Field names: camelCase (e.g., `pricePerPerson`, `createdAt`)
- Table names: Prisma maps PascalCase models to snake_case tables automatically via `@@map`
- Relations: always define both sides of the relation
- All tables have `id` as primary key (autoincrement BigInt), except role tables (`travellers`, `providers`) which use `userId` as PK referencing `users.id`
- Timestamps: `createdAt` and `updatedAt` on all main tables

## Deferred Tables (Iteration 2+)

These ontology classes exist but are out of scope for iteration 1:
- `payments` — from `External Payment` + `Payment Provider`
- `reviews` — from `«relator» Review` + `Review Creation` event
- `conversations` / `messages` — from `Message` system
- `community_join_requests` — from `Community Join Request` event
- `community_impact_metrics` — from `impactData` on Community
- `provider_verifications` — from trust/vetting system

The `average_score` and `review_count` fields on `activity_listings` are pre-placed (defaulting to 0) so adding reviews in iteration 2 doesn't require schema changes to the listings table.
