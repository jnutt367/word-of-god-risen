import { NextResponse } from "next/server";
import snapshot from "@/data/shorts-snapshot.json";
import { isCanonShort } from "@/lib/canon-shorts";

export const revalidate = 3600; // refresh the feed hourly

const FEED_URL =
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1ryMv3ldYCOgshChVrqZNQ";

interface ShortItem {
  id: string;
  title: string;
  published: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fromRss(): Promise<ShortItem[]> {
  const res = await fetch(FEED_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const xml = await res.text();

  const items: ShortItem[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null && items.length < 15) {
    const entry = m[1];
    const idM = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleM = entry.match(/<title>([^<]*)<\/title>/);
    const pubM = entry.match(/<published>([^<]+)<\/published>/);
    if (idM && titleM) {
      items.push({
        id: idM[1],
        title: decodeEntities(titleM[1]),
        published: pubM ? pubM[1] : "",
      });
    }
  }
  if (items.length === 0) throw new Error("empty feed");
  return items;
}

/**
 * Latest TruVINE Shorts. Tries the channel's live RSS feed first; falls
 * back to a checked-in snapshot (YouTube sometimes throttles datacenter IPs).
 */
export async function GET() {
  // Canon-only (Jason's law, Oct 28, 2026): whichever source answers,
  // only canon film Shorts (lib/canon-shorts.ts) may reach the site.
  try {
    const items = (await fromRss()).filter((i) => isCanonShort(i.id));
    return NextResponse.json({ items, live: true });
  } catch {
    const items = (snapshot as { items: { id: string; title: string }[] }).items
      .filter((s) => isCanonShort(s.id))
      .slice(0, 15)
      .map((s) => ({ id: s.id, title: s.title, published: "" }));
    return NextResponse.json({ items, live: false });
  }
}
