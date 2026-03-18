import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function weeksFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n * 7);
  return d;
}

// Slot times as Date objects on a fixed reference day (only time portion used by @db.Time)
function timeOfDay(hour: number, minute = 0): Date {
  const d = new Date(2000, 0, 1, hour, minute, 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. Cleanup (FK-safe order) ──────────────────────────────────────────────
  await prisma.booking.deleteMany();
  await prisma.activitySlot.deleteMany();
  await prisma.listingInterestTag.deleteMany();
  await prisma.activityListing.deleteMany();
  await prisma.travellerInterestTag.deleteMany();
  await prisma.interestTag.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.traveller.deleteMany();
  await prisma.user.deleteMany();
  await prisma.community.deleteMany();
  console.log("  ✓ Cleaned existing data");

  // ── 2. Password ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  // ── 3. Communities ──────────────────────────────────────────────────────────
  const cusco = await prisma.community.create({
    data: {
      name: "Cusco Artisan Collective",
      description:
        "A vibrant community of Andean artisans, cooks, and guides preserving Inca traditions and welcoming curious travellers into their daily lives.",
      culturalContext: "Quechua and mestizo traditions of the Andean highlands",
      city: "Cusco",
      country: "Peru",
      latitude: -13.5319,
      longitude: -71.9675,
    },
  });

  const chiangMai = await prisma.community.create({
    data: {
      name: "Chiang Mai Cultural Circle",
      description:
        "A network of Northern Thai families, monks, and chefs sharing the rich cultural mosaic of Lanna heritage through authentic hands-on experiences.",
      culturalContext: "Lanna Thai Buddhist and hill-tribe traditions",
      city: "Chiang Mai",
      country: "Thailand",
      latitude: 18.7883,
      longitude: 98.9853,
    },
  });
  console.log("  ✓ Communities created");

  // ── 4. Provider users ───────────────────────────────────────────────────────
  const [mariaUser, carlosUser, somsakUser] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: "maria.quispe@example.com",
          passwordHash,
          firstName: "María",
          lastName: "Quispe",
          role: "provider",
        },
      });
      await tx.provider.create({
        data: {
          userId: user.id,
          displayName: "María's Kitchen",
          communityId: cusco.id,
          joinedCommunityAt: new Date("2023-06-01"),
        },
      });
      return user;
    }),

    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: "carlos.mamani@example.com",
          passwordHash,
          firstName: "Carlos",
          lastName: "Mamani",
          role: "provider",
        },
      });
      await tx.provider.create({
        data: {
          userId: user.id,
          displayName: "Mamani Crafts",
          communityId: cusco.id,
          joinedCommunityAt: new Date("2022-11-15"),
        },
      });
      return user;
    }),

    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: "somsak.pattana@example.com",
          passwordHash,
          firstName: "Somsak",
          lastName: "Pattana",
          role: "provider",
        },
      });
      await tx.provider.create({
        data: {
          userId: user.id,
          displayName: "Somsak Experiences",
          communityId: chiangMai.id,
          joinedCommunityAt: new Date("2023-01-20"),
        },
      });
      return user;
    }),
  ]);
  console.log("  ✓ Provider users created");

  // ── 5. Traveller users ──────────────────────────────────────────────────────
  const [emmaUser, lucasUser] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: "emma.thompson@example.com",
          passwordHash,
          firstName: "Emma",
          lastName: "Thompson",
          role: "traveller",
        },
      });
      await tx.traveller.create({
        data: {
          userId: user.id,
          bio: "Passionate food lover and nature enthusiast from the UK. Always seeking authentic local experiences.",
        },
      });
      return user;
    }),

    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: "lucas.bauer@example.com",
          passwordHash,
          firstName: "Lucas",
          lastName: "Bauer",
          role: "traveller",
        },
      });
      await tx.traveller.create({
        data: {
          userId: user.id,
          bio: "German craftsman and heritage enthusiast who loves learning traditional techniques on his travels.",
        },
      });
      return user;
    }),
  ]);
  console.log("  ✓ Traveller users created");

  // ── 6. Activity listings ────────────────────────────────────────────────────
  const listings = await Promise.all([
    // María — Cusco
    prisma.activityListing.create({
      data: {
        providerId: mariaUser.id,
        title: "Traditional Andean Cooking Class",
        description:
          "Join María in her family kitchen nestled in the San Blas neighbourhood of Cusco. You'll grind spices on a traditional batán, prepare a classic caldo de gallina, and finish with a homemade chicha morada. Leave with recipes and memories that last a lifetime.",
        category: "culinary",
        city: "Cusco",
        country: "Peru",
        latitude: -13.5167,
        longitude: -71.9783,
        pricePerPerson: 35.0,
        currency: "EUR",
        capacity: 8,
        status: "active",
      },
    }),

    prisma.activityListing.create({
      data: {
        providerId: mariaUser.id,
        title: "Sacred Valley Guided Walk",
        description:
          "Explore the breathtaking Sacred Valley with María as your guide. Trek through terraced Inca agricultural sites, visit a traditional market, and hear ancient Quechua legends passed down through generations. Moderate fitness required.",
        category: "nature",
        city: "Cusco",
        country: "Peru",
        latitude: -13.3167,
        longitude: -72.1,
        pricePerPerson: 25.0,
        currency: "EUR",
        capacity: 12,
        status: "active",
      },
    }),

    // Carlos — Cusco
    prisma.activityListing.create({
      data: {
        providerId: carlosUser.id,
        title: "Inca Textile Weaving Workshop",
        description:
          "Learn the art of Andean backstrap loom weaving with master weaver Carlos Mamani. Discover the symbolic language of traditional patterns, work with naturally dyed alpaca wool, and take home a small weaving of your own creation.",
        category: "crafts",
        city: "Cusco",
        country: "Peru",
        latitude: -13.5319,
        longitude: -71.9675,
        pricePerPerson: 40.0,
        currency: "EUR",
        capacity: 6,
        status: "active",
      },
    }),

    prisma.activityListing.create({
      data: {
        providerId: carlosUser.id,
        title: "Andean Pottery Masterclass",
        description:
          "Shape clay the way the Incas did — by hand, without a wheel. Carlos guides you through coil-building techniques, decorative stamping using pre-Columbian motifs, and sun-drying methods. A meditative and deeply cultural experience.",
        category: "crafts",
        city: "Cusco",
        country: "Peru",
        latitude: -13.5319,
        longitude: -71.9675,
        pricePerPerson: 45.0,
        currency: "EUR",
        capacity: 6,
        status: "active",
      },
    }),

    // Somsak — Chiang Mai
    prisma.activityListing.create({
      data: {
        providerId: somsakUser.id,
        title: "Northern Thai Cooking Experience",
        description:
          "Start at a local market to select fresh ingredients with Somsak, then head to his family home to prepare three classic Northern Thai dishes: khao soi, larb, and sticky rice with mango. Vegetarian-friendly options available.",
        category: "culinary",
        city: "Chiang Mai",
        country: "Thailand",
        latitude: 18.7883,
        longitude: 98.9853,
        pricePerPerson: 30.0,
        currency: "EUR",
        capacity: 10,
        status: "active",
      },
    }),

    prisma.activityListing.create({
      data: {
        providerId: somsakUser.id,
        title: "Buddhist Temple & Heritage Tour",
        description:
          "Walk through three of Chiang Mai's most revered temples with Somsak, a practising Buddhist. Learn about Lanna architecture, observe morning alms-giving, and participate in a guided meditation session. Respectful dress required.",
        category: "heritage",
        city: "Chiang Mai",
        country: "Thailand",
        latitude: 18.7953,
        longitude: 98.9912,
        pricePerPerson: 20.0,
        currency: "EUR",
        capacity: 15,
        status: "active",
      },
    }),
  ]);
  console.log("  ✓ Activity listings created");

  // ── 7. Activity slots (8 per listing, weekly) ───────────────────────────────
  for (const listing of listings) {
    await prisma.activitySlot.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({
        listingId: listing.id,
        slotDate: weeksFromNow(i + 1),
        startTime: timeOfDay(9, 0),
        endTime: timeOfDay(12, 0),
        capacity: listing.capacity,
        remainingCapacity: listing.capacity,
        status: "available",
      })),
    });
  }
  console.log("  ✓ Activity slots created (8 per listing)");

  // ── 8. Interest tags ────────────────────────────────────────────────────────
  const tagNames = ["culinary", "nature", "crafts", "heritage", "wellness"];
  await prisma.interestTag.createMany({ data: tagNames.map((name) => ({ name })) });

  const tags = await prisma.interestTag.findMany();
  const tagByName = Object.fromEntries(tags.map((t) => [t.name, t]));

  // ── 9. Listing → tag junctions ──────────────────────────────────────────────
  const [cookingClass, valleyWalk, weaving, pottery, thaiCooking, templeTour] = listings;

  await prisma.listingInterestTag.createMany({
    data: [
      { listingId: cookingClass.id, tagId: tagByName["culinary"].id },
      { listingId: valleyWalk.id, tagId: tagByName["nature"].id },
      { listingId: valleyWalk.id, tagId: tagByName["heritage"].id },
      { listingId: weaving.id, tagId: tagByName["crafts"].id },
      { listingId: weaving.id, tagId: tagByName["heritage"].id },
      { listingId: pottery.id, tagId: tagByName["crafts"].id },
      { listingId: thaiCooking.id, tagId: tagByName["culinary"].id },
      { listingId: templeTour.id, tagId: tagByName["heritage"].id },
      { listingId: templeTour.id, tagId: tagByName["wellness"].id },
    ],
  });

  // ── 10. Traveller → tag junctions ───────────────────────────────────────────
  await prisma.travellerInterestTag.createMany({
    data: [
      { travellerId: emmaUser.id, tagId: tagByName["culinary"].id },
      { travellerId: emmaUser.id, tagId: tagByName["nature"].id },
      { travellerId: lucasUser.id, tagId: tagByName["crafts"].id },
      { travellerId: lucasUser.id, tagId: tagByName["heritage"].id },
    ],
  });
  console.log("  ✓ Interest tags and junctions created");

  console.log("\n✅ Seed complete!");
  console.log(`   Communities: 2`);
  console.log(`   Users: 5 (3 providers + 2 travellers)`);
  console.log(`   Listings: ${listings.length}`);
  console.log(`   Slots: ${listings.length * 8}`);
  console.log(`   Tags: ${tagNames.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
