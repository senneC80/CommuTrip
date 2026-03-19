import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TravellerSidebar from "@/components/TravellerSidebar";
import CreateTripForm from "@/components/CreateTripForm";

export default async function CreateTripPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
  if (session.user.role !== "traveller") redirect("/dashboard");

  const travellerId = BigInt(session.user.id);

  const [allTags, traveller] = await Promise.all([
    prisma.interestTag.findMany({ orderBy: { name: "asc" } }),
    prisma.traveller.findUnique({
      where: { userId: travellerId },
      include: { travellerInterestTags: true },
    }),
  ]);

  const existingTagIds =
    traveller?.travellerInterestTags.map((t) => String(t.tagId)) ?? [];
  const serializedTags = allTags.map((t) => ({ id: String(t.id), name: t.name }));

  return (
    <div className="flex min-h-screen bg-background">
      <TravellerSidebar />
      <main className="flex-1 overflow-auto p-8">
        <CreateTripForm tags={serializedTags} existingTagIds={existingTagIds} />
      </main>
    </div>
  );
}
