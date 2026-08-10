import { NextResponse } from "next/server";
import { ensureCatalogSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureCatalogSchema();
    return NextResponse.json({ ok: true, service: "innate-catalog" });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
