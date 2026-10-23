import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "tabletop-pulse",
    schema: "boardgames",
    timestamp: new Date().toISOString(),
  });
}
