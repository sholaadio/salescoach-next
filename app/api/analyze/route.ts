import { NextRequest, NextResponse } from "next/server";
const SERVER = process.env.NEXT_PUBLIC_API_URL ?? "https://salescoach-server.onrender.com";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await fetch(`${SERVER}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch { return NextResponse.json({ error: "Analysis unavailable" }, { status: 502 }); }
}
