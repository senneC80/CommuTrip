import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProviderSidebar from "@/components/ProviderSidebar";
import CreateListingForm from "@/components/CreateListingForm";

export const metadata: Metadata = {
  title: "CommuTrip — New Listing",
};

export default async function CreateListingPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth");
  if (session.user.role !== "provider") redirect("/trips");

  const tags = await prisma.interestTag.findMany({
    orderBy: { name: "asc" },
  });

  const serializedTags = tags.map((t) => ({
    id: String(t.id),
    name: t.name,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <ProviderSidebar />
      <main className="flex-1 overflow-auto p-8">
        <CreateListingForm tags={serializedTags} />
      </main>
    </div>
  );
}
