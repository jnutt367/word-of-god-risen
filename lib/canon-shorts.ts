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
 *
 * Nov 1, 2026 (Jason's word — the double-barrel funnel): the Global
 * Bible Month daily Shorts join the shelf as they publish, leading
 * it — Day 1's Introduction (canon Teddy, seeded from his own film
 * frame) and its Scripture Short (Mark 1:14–18, built Gate-9-true
 * from the locked package) go first, in that order. The list order
 * IS the shelf order.
 */
export const CANON_SHORT_IDS: readonly string[] = [
  "8HU2j8BNS-Q", // Global Bible Challenge Day 1 — Run Like That | 1 Corinthians 9:24 — the Day 1 Introduction (Nov 1, 2026)
  "rBf6RS0zTkE", // Global Bible Challenge Day 1 — "Follow Me" | Mark 1:14–18 — the Day 1 Scripture Short (Nov 1, 2026)
  "1u9emv-xPqI", // Day 2: Not the Righteous, but Sinners | Mark 2:15–17 · Global Bible Challenge — the Day 2 Scripture Short (Nov 2, 2026)
  "fqsojvm1Axk", // Day 3: My Brother, My Sister, My Mother | Mark 3:33–35 · Global Bible Challenge — the Day 3 Scripture Short (Nov 3, 2026); first Short published with manual English + Filipino caption tracks
  "2v8VP221s8E", // Day 4: It Grows by Itself | Mark 4:26–29 · Global Bible Challenge — the Day 4 Scripture Short (Nov 4, 2026); English + Filipino caption tracks verified in Studio before public
  "sUAY9Z6fvOE", // Day 5: Tell Them What the Lord Has Done | Mark 5:19 · Global Bible Challenge — the Day 5 Scripture Short (Nov 5, 2026); English + Filipino caption tracks verified in Studio before public
  "RqHiCNlbxeE", // Day 6: They All Ate and Were Filled | Mark 6:42 · Global Bible Challenge — the Day 6 Scripture Short (published Nov 8, 2026; made Nov 2 ahead of its Nov 6 day); English + Filipino caption tracks verified in Studio before public
  "98Uw2biCECE", // Day 7: He Has Done All Things Well | Mark 7:37 · Global Bible Challenge — the Day 7 Scripture Short (published Nov 8, 2026; made Nov 2 ahead of its Nov 7 day); English + Filipino caption tracks verified in Studio before public
  "lPpuObQFH1U", // Day 8: You Are the Christ | Mark 8:29 · Global Bible Challenge — the Day 8 Scripture Short (published Nov 8, 2026, on its own day; the v3 cut with all twelve disciples as their crowned selves); English + Filipino caption tracks verified in Studio before public
  "okKk95jr2I8", // Day 9: Listen to Him | Mark 9:7 · Global Bible Challenge — the Day 9 Scripture Short (published Nov 9, 2026, on its own day; the Transfiguration, Mark 9:2–8, V4 cut crowned by Jason); English track published in Studio and the Cebuano track added via the YouTube API and verified serving before public — the first day with Cebuano captions
  "Vsie10QVSsI", // Day 10: Your Faith Has Made You Well | Mark 10:52 · Global Bible Challenge — the Day 10 Scripture Short (published Nov 10, 2026, on its own day; Bartimaeus receives his sight, Mark 10:46–52, V3 cut crowned by Jason — every scene on the narration's own words); English track published in Studio and the Cebuano track added via the YouTube API, the Day 9 route
  "Vsie10QVSsI", // Day 10: Your Faith Has Made You Well | Mark 10:52 · Global Bible Challenge — the Day 10 Scripture Short (published Nov 10, 2026, on its own day; blind Bartimaeus, Mark 10:46–52; the V3 cut — one scene per passage beat, each cut on the very words it pictures — crowned by Jason, who ruled its method the standard for every day from here); English track published in Studio and the Cebuano track added via the YouTube API and verified serving before public
  "ePjfQ3mJilI", // Day 11: Have Faith in God | Mark 11:22 · Global Bible Challenge — the Day 11 Scripture Short (published Nov 11, 2026, on its own day; Mark 11:22–26); English track published in Studio and the Cebuano track added via the YouTube API and verified serving before public. (Its canon entry was missed on its publish night — Day 10's line was duplicated instead — and is restored here Nov 13 alongside Day 12.)
  "2XEMaV6m8AU", // Day 12: Love the Lord Your God | Mark 12:28 · Global Bible Challenge — the Day 12 Scripture Short (published Nov 13, 2026; Mark 12:28–31, the V2 cut crowned by Jason); English track published in Studio and the Cebuano track added via the YouTube API and verified serving before public
  "uaaJAAjNxPo", // Day 13: Watch! | Mark 13:33 · Global Bible Challenge — the Day 13 Scripture Short (published Nov 13, 2026, on its own day; Mark 13:33–37, crowned by Jason); English track published in Studio and the Cebuano track added via the YouTube API and verified serving before public
  "-oRYl9jBWKg", // One Chapter Is Enough | Mark 1 — the welcome film's funnel (Oct 29, 2026)
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

/** Shelf order is the list order above (the list leads with the
 * newest series) — surfaces sort by this rank, not by upload date. */
export function canonShortRank(id: string): number {
  const i = CANON_SHORT_IDS.indexOf(id);
  return i === -1 ? CANON_SHORT_IDS.length : i;
}
