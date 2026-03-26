import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getAuthSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardClient
      user={{
        id: session.user.id,
        name: session.user.name ?? "GitHub User",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
      }}
    />
  );
}
