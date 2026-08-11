import { NextResponse } from "next/server";
import { checkDeepTutorHealth } from "@innate/deeptutor-adapter";
import { getDeepTutorWsUrl } from "@/lib/deeptutor";

export const dynamic = "force-dynamic";

export async function GET() {
  const wsUrl = getDeepTutorWsUrl();
  const health = await checkDeepTutorHealth(wsUrl);
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
