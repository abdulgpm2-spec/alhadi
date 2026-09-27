import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Server-side proxy for Marathi transliteration (English → Devanagari).
// Uses Google Input Tools transliteration (same engine as Gboard) so the
// browser never hits CORS issues. Tiny in-memory cache for repeat names.
const cache = new Map<string, string>();
const MAX_CACHE = 500;

async function transliterate(text: string): Promise<string> {
  const key = text.trim();
  if (!key) return "";
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url =
      "https://inputtools.google.com/request?text=" +
      encodeURIComponent(key) +
      "&itc=mr-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage";
    const res = await fetch(url, { signal: controller.signal });
    const json = await res.json();
    // Shape: ["SUCCESS", [[input, [suggestion, ...], ...]]]
    const suggestions: string[] | undefined = json?.[1]?.[0]?.[1];
    const best =
      Array.isArray(suggestions) && suggestions.length > 0 ? suggestions[0] : key;
    if (cache.size >= MAX_CACHE) {
      const first = cache.keys().next().value;
      if (first !== undefined) cache.delete(first);
    }
    cache.set(key, best);
    return best;
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  const text = new URL(req.url).searchParams.get("text") || "";
  if (!text.trim()) {
    return NextResponse.json({ success: true, data: { text: "" } });
  }

  const out = await transliterate(text);
  return NextResponse.json({ success: true, data: { text: out } });
}
