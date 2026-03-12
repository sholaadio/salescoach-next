import { NextRequest, NextResponse } from "next/server";
const SERVER = process.env.NEXT_PUBLIC_API_URL ?? "https://salescoach-server.onrender.com";
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const r = await fetch(`${SERVER}/transcribe`, { method: "POST", body: formData });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch { return NextResponse.json({ error: "Transcription unavailable" }, { status: 502 }); }
}
