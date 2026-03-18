-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "phoneNumber" VARCHAR(50),
    "profilePictureUrl" VARCHAR(500),
    "role" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travellers" (
    "userId" BIGINT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travellers_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "providers" (
    "userId" BIGINT NOT NULL,
    "displayName" VARCHAR(255),
    "communityId" BIGINT,
    "joinedCommunityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "culturalContext" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "imageUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_listings" (
    "id" BIGSERIAL NOT NULL,
    "providerId" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "pictureUrl" VARCHAR(500),
    "category" VARCHAR(100),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'EUR',
    "capacity" INTEGER NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "averageScore" DECIMAL(3,2) DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_slots" (
    "id" BIGSERIAL NOT NULL,
    "listingId" BIGINT NOT NULL,
    "slotDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME,
    "capacity" INTEGER NOT NULL,
    "remainingCapacity" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'available',

    CONSTRAINT "activity_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" BIGSERIAL NOT NULL,
    "travellerId" BIGINT NOT NULL,
    "title" VARCHAR(255),
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_locations" (
    "id" BIGSERIAL NOT NULL,
    "tripId" BIGINT NOT NULL,
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "arrivalDate" DATE NOT NULL,
    "departureDate" DATE NOT NULL,
    "sequenceNo" INTEGER NOT NULL,

    CONSTRAINT "trip_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_tags" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "interest_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveller_interest_tags" (
    "travellerId" BIGINT NOT NULL,
    "tagId" BIGINT NOT NULL,

    CONSTRAINT "traveller_interest_tags_pkey" PRIMARY KEY ("travellerId","tagId")
);

-- CreateTable
CREATE TABLE "listing_interest_tags" (
    "listingId" BIGINT NOT NULL,
    "tagId" BIGINT NOT NULL,

    CONSTRAINT "listing_interest_tags_pkey" PRIMARY KEY ("listingId","tagId")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" BIGSERIAL NOT NULL,
    "tripId" BIGINT NOT NULL,
    "travellerId" BIGINT NOT NULL,
    "listingId" BIGINT NOT NULL,
    "slotId" BIGINT,
    "numberOfPersons" INTEGER NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'EUR',
    "status" VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "interest_tags_name_key" ON "interest_tags"("name");

-- AddForeignKey
ALTER TABLE "travellers" ADD CONSTRAINT "travellers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_listings" ADD CONSTRAINT "activity_listings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_slots" ADD CONSTRAINT "activity_slots_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "activity_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "travellers"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveller_interest_tags" ADD CONSTRAINT "traveller_interest_tags_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "travellers"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveller_interest_tags" ADD CONSTRAINT "traveller_interest_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "interest_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_interest_tags" ADD CONSTRAINT "listing_interest_tags_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "activity_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_interest_tags" ADD CONSTRAINT "listing_interest_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "interest_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "travellers"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "activity_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "activity_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
