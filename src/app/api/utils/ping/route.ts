import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      const ok = res.ok;
      const contentType = res.headers.get("content-type") || "";
      return NextResponse.json({ ok, contentType, status: res.status });
    } catch (e) {
      clearTimeout(timeout);
      return NextResponse.json({ ok: false, error: "Fetch failed" }, { status: 200 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
}


