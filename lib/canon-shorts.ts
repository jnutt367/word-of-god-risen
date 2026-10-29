/**
 * Canon-only Shorts (Jason's law, Oct 28, 2026): the site's Shorts
 * surfaces carry ONLY videos whose characters are the locked canon
 * cast — the characters Jason and Judah made together in the package.
 * Every ID below is a clip cut from the animated Gospel films and was
 * verified against the canon package before being listed. Anything
 * not on this list does not appear on the site, however recent it is
 * on the channel.
 *
 * Oct 29, 2026 (Jason's word): the shelf widened beyond the Gospel
 * films — MM4Re8olRzY is cut from the "One Chapter Is Enough" film
 * (canon Teddy and Jason throughout; the Taiwan story), and the
 * welcome film's funnel Short joins when it publishes. Open Door and
 * the app promo stay off (non-canon Teddy / unverified footage).
 */
export const CANON_SHORT_IDS: readonly string[] = [
  "MM4Re8olRzY", // One Chapter Is Enough — the Prayer Short (Taiwan) | from the film
  "Jo2qZIZoaxU", // The Whole City at the Door | Mark 1:33
  "l7bk9mzjboc", // "With authority..." | Mark 1:27
  "cCTtwhthMgU", // Jesus Heals a Leper | Mark 1:40-42 (Film Clip)
  "h4o3LHT0YWU", // The Baptism of Jesus | Mark 1:9-11 (Film Clip)
  "1L4wwXMXBm0", // Jesus Calls His First Disciples | Mark 1:16-18 (Film Clip)
];

const CANON_SET = new Set(CANON_SHORT_IDS);

export function isCanonShort(id: string): boolean {
  return CANON_SET.has(id);
}
