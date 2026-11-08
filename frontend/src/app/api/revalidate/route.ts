import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

// Called by the backend after the admin edits FAQs or works.
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("x-revalidate-secret") ?? "";
  const ok =
    !!expected &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // expire: 0 → the next visitor gets fresh content instead of a stale copy.
  revalidateTag("content", { expire: 0 });
  return Response.json({ revalidated: true });
}
