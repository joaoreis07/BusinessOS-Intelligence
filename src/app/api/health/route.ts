import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "businessos-web",
    timestamp: new Date().toISOString(),
  });
}
