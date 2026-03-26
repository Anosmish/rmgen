import { NextResponse } from "next/server";
import { z } from "zod";

import { createSharedReadme } from "@/lib/share-store";
import { getAuthSession } from "@/lib/session";

const createShareSchema = z.object({
  readme: z.string().min(30).max(250000),
  repoFullName: z.string().min(3).max(200),
  template: z.enum(["default", "startup", "ai", "library"]),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createShareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const record = createSharedReadme({
      readme: parsed.data.readme,
      repoFullName: parsed.data.repoFullName,
      template: parsed.data.template,
      createdBy: session.user.email ?? session.user.name ?? "anonymous",
    });

    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXTAUTH_URL ?? requestUrl.origin;

    return NextResponse.json(
      {
        id: record.id,
        shareUrl: `${baseUrl}/share/${record.id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create share link.",
      },
      { status: 500 },
    );
  }
}
