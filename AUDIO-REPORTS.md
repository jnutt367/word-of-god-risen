# Audio Reports — the listener's tripwire

*Born Oct 21, 2026 — the night Jason caught the Mark 12 narration meltdown
with his own ears (a TTS take that invented people and looped a phrase for
three minutes inside the Great Commandment passage), and asked for "something
where they could tap if there is something wrong with any of the words."*

## What it is

Under the listen controls on every chapter sits a quiet button:
**"Something sounds wrong."** One tap files an anonymous report naming
only the book and chapter. The reports are counted per chapter per day
(`app/api/audio-report`, stored in `lib/audio-report-store.ts`, one private
Blob document at `reports/audio-reports.json`) and surface in the evening
reading report, so a damaged chapter finds us before the next listener
finds it.

## Privacy — the same law as the Heartbeat

- A report carries the book, the chapter, and nothing else. No identity,
  no geography, no IP is read or stored.
- Deduped once per chapter per browser session (sessionStorage), so the
  counts stay honest without tracking anyone.
- No accounts, no custody — the standing rule of this app holds here too.

## The fix playbook (when a chapter is flagged)

1. Transcribe the chapter's master and diff it against the canonical
   text — never trust a flag, never dismiss one, until the transcript
   says which it is.
2. Repair by the seam law: a fresh standalone take of the affected
   passage (letter-exact canonical text, the Audio Bible pipeline's
   voice and settings), used whole, spliced at verse boundaries,
   loudness-matched to the library. Never spot-patching.
3. Verify the repaired chapter the same way — transcript vs. canonical,
   word for word — before anything ships.
4. Ship by repointing: host the corrected stream encode and change the
   chapter's entry in `public/audio-manifest.json` to the new URL (a
   *new* URL, so no listener's cached copy of the broken file can
   linger). The manifest fetch is `no-store` (Oct 21, 2026) so a fresh
   page load always sees the current list; a page already open keeps
   its list for that session, which is true of every app.

## The other two safeguards

- **The library audit**: every master's length is screened against its
  chapter's word count (a meltdown runs long — the broken Mark 12 ran
  44% long); outliers get the full transcript treatment above.
- **The ship gate**: no new or regenerated audio joins the manifest
  without passing the transcript check first. The machine listens
  before the listeners do.
