# Podcast Submission Kit — Word of God Risen

Everything needed to put the podcast into the directories, ready to paste.
**Cost: $0 everywhere.** Every directory below lists podcasts for free.
The feed is already built and live; the only steps left are the ones that
need Jason's own accounts (marked ★ JASON).

Built Nov 2, 2026: **1,098 episodes** — every chapter Grandpa Teddy has read
aloud (Genesis → Revelation, the extra books the app carries, and the 16
parable readings).

---

## Ready-to-paste fields (same for every directory)

| Field | Value |
|---|---|
| **Feed URL** | `https://word-of-god-risen.vercel.app/podcast.xml` |
| **Title** | Word of God Risen — The Bible Read Aloud |
| **Author / Artist** | Grandpa Teddy · TruVINE |
| **Description** | The whole Bible, read out loud by Grandpa Teddy — every chapter, word for word, free. No account, no password: just God's Word, read the way a grandfather reads to the family. From Genesis to Revelation, plus the parables of Jesus. Read along in the app: https://word-of-god-risen.vercel.app/ |
| **Category** | Religion & Spirituality → Christianity |
| **Language** | English |
| **Explicit** | No |
| **Website** | https://word-of-god-risen.vercel.app/ |
| **Artwork** | https://word-of-god-risen.vercel.app/images/podcast-cover.jpg (3000×3000 JPG; also in this repo at `public/images/podcast-cover.jpg`) |
| **Contact email** | jnutt367@gmail.com |
| **Copyright** | Scripture read from the World English Bible (public domain). Recordings free to hear and share. |
| **Update frequency** | Episodic (new chapters as they are restored) |

---

## 1. Apple Podcasts — podcastsconnect.apple.com

1. ★ JASON: Open https://podcastsconnect.apple.com and sign in with your Apple ID.
   (If Apple asks you to agree to the latest terms or complete your account
   details, do that first — it's free; do **not** enroll in the paid Apple
   Developer Program, podcasts don't need it.)
2. Click **+** → **Add a Show** → choose **RSS Feed**.
3. Paste the feed URL → **Add** → Apple validates the feed (passes: artwork
   3000×3000, 1,098 episodes, all enclosures sized).
4. On the show page: set **Availability** (all countries), **Content Rights**
   (you own the recordings; Scripture is the public-domain World English
   Bible), and the release schedule.
5. **Submit for Review.** Review usually takes 1–5 days. Apple emails the
   result to your Apple ID email.
6. After approval, Apple gives you a public show URL — save it for the app
   and the Key Ring page.

## 2. Spotify — podcasters.spotify.com

1. ★ JASON: Open https://podcasters.spotify.com → **Get Started** → sign in
   with your Spotify account (or create one, free).
2. Choose **Add or claim your podcast** → paste the feed URL → **Next**.
   (If it asks where the podcast is hosted, our feed is self-hosted — the
   RSS URL is all it needs.)
3. ★ JASON: Spotify sends an 8-digit verification code to the email in the
   feed (jnutt367@gmail.com) — open that email and enter the code. This
   proves the feed is yours.
4. Fill in the details from the table above (category: Religion &
   Spirituality; country: United States; language: English).
5. **Submit.** Spotify usually lists within a few hours.
   Note: leave "monetization" and Spotify's hosting offers alone — our
   audio stays on our own hosting, free.

## 3. Amazon Music — podcasters.amazon.com

1. ★ JASON: Open https://podcasters.amazon.com → sign in with your Amazon
   account (free).
2. **Add Your Podcast** → paste the feed URL → **Next**.
3. ★ JASON: Verify ownership — Amazon emails a confirmation to
   jnutt367@gmail.com; click the link in it.
4. Confirm the details from the table → **Submit for review.**
5. Listed podcasts also surface on Audible. Approval usually within a day.

## 4. TuneIn — tunein.com

1. Open https://tunein.com/broadcasters/podcasts/ and find the podcast
   submission form (TuneIn's "Add your podcast" / content submission).
2. Paste the feed URL and the table fields. No account is strictly
   required for the form, but ★ JASON: use jnutt367@gmail.com as the
   contact so their reply reaches you.
3. Submit. TuneIn reviews manually and can take several weeks; they email
   if accepted.

## 5. iHeart — podcasters.iheart.com

1. ★ JASON: Open https://podcasters.iheart.com → create a free account /
   sign in.
2. **Add your podcast** → paste the feed URL → fill in the table fields.
3. Submit. iHeart curates its catalog, so listing is their call; the
   submission itself is free.

---

## After the approvals come back

- Save each directory's public show URL — Judah will add them to the app
  and the Key Ring (https://jnutt367.github.io/truvine/links/).
- New chapters: when more audio is restored, Judah re-runs
  `node scripts/build-podcast-feed.mjs` and the same feed grows — the
  directories pick up new episodes on their own; **never resubmit.**
- Cover refresh, if ever wanted: `python3 scripts/build-podcast-cover.py`
  (uses the real TruVINE emblem master).

## Known quirk (honest note)

Most episodes are served from our R2 audio bucket, whose public endpoint
labels MP3 files with a generic content type instead of `audio/mpeg`.
Every podcast app reads the feed's declared `audio/mpeg` type and plays
the files fine (the app itself has played them this way all along), and
the files are valid MP3s with full byte-range support. If a directory
reviewer ever flags the server MIME type, the fix is pointing the bucket
at a custom domain with proper MP3 headers — a small future step for
Jason's call, not needed to submit.
