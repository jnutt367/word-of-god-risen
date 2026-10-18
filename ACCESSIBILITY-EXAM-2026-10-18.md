# Accessibility Examination — Menu & Layout (2026-10-18)

Scope: the site header menu (incl. the new "Visit the Farm" section),
homepage chrome, book/chapter card lists, and the chapter-reader chrome
(translation pills, word-size controls, Lamp toggle, Previous/Next,
back link). The reading text itself was not examined or changed — it is
the crowned calm surface. Standard: WCAG 2.2 AA, graded criterion by
criterion. Method: source-code measurement (padding/type scale → target
sizes) and contrast ratios computed from the app's own palette tokens.
Limits: this bench cannot screenshot the live site; phone-width
rendering is confirmed by the owner's own glance, per house law.

## Part 1 — The menu, graded against WCAG 2.2 AA

**1.4.3 Contrast (Minimum) — PASS, mostly at AAA levels.**
Menu text sits on vineyard-950 (#0c1f16): cream-100 labels 14.60:1 ·
sage-300 10.27:1 · gold-300 11.23:1 · gold-400 button label 9.31:1 ·
sage-300 hint lines 10.27:1 · gold-400 group headings 9.31:1 (6.37:1 at
the mobile panel's 80% opacity). Hover ground vineyard-800: cream-100
11.42:1, gold-300 8.79:1. AA floor is 4.5:1; every menu pair clears it,
most clear the AAA 7:1 line too.

**2.5.8 Target Size (Minimum) — PASS, exceeded.** AA floor is 24×24px.
Every farm-menu link (desktop panel and phone panel) is ≥52px tall
(12px padding + 18px label line). Phone-panel internal links carry an
explicit min-height of 48px. Desktop bar links measure ~44px after this
pass (see Part 2). House standard is ≥48px — beyond AA, at/above AAA
2.5.5's 44px.

**2.4.7 Focus Visible / 2.4.11 Focus Not Obscured — PASS.** The global
gold :focus-visible ring (2px, offset) applies to every menu control;
on the lamp reader theme it deepens to #865c10 for AA contrast there.
The farm panel opens below the sticky header, so a focused link inside
it is never hidden under the header bar.

**4.1.2 Name, Role, Value + 1.3.1 Info and Relationships — PASS.**
Farm button: aria-expanded + aria-haspopup + aria-controls. Each farm
group is a role="group" with aria-labelledby pointing at its visible
heading ("Watch", "The Porch", "More from the Farm"); the panel and the
phone panel carry their own nav aria-labels. External doors announce
"(opens in a new tab)" in their aria-labels, and the two YouTube doors
also show a visible "(opens YouTube)" hint (3.2.5 Change on Request —
no surprise windows).

**2.1.2 No Keyboard Trap / Escape — PASS.** Escape closes both panels
(pre-existing behaviour, extended to the farm panel); the farm panel
also closes on outside tap and on choosing a door.

**2.3.3 / reduced motion — PASS.** The panels use colour transitions
only — no slide, zoom, or entrance animation — so nothing moves for a
reader who prefers reduced motion.

**1.4.12 Text Spacing / 1.4.4 Resize — PASS.** Menu labels are 18px
(text-lg) with snug-but-standard leading, in a panel that wraps and
grows; nothing is clipped at 200% text zoom (columns reflow, links wrap).

## Part 2 — Layout accessibility examination

### Fixed in this pass (small and safe: spacing, sizes, labels, focus)

1. **Reader back link** ("← Mark") measured ~20px tall — the one
   target found **below** the 2.5.8 AA 24px minimum. Now ~36px
   (padding added, negative margin keeps the layout line).
2. **Reader translation pills & A−/A+ buttons**: 12px labels → 14px,
   targets ~26px → ~32px. Lamp toggle ~34px → ~38px. (Still under the
   48px house ideal — see decision item A.)
3. **Reader Previous/Next links** (top and bottom pairs): ~42px →
   ~46px targets.
4. **Phone menu items**: ~44px → explicit 48px minimum height, labels
   16px → 18px. Section headings 12px → 14px.
5. **Hamburger button**: 40px → 48×48px.
6. **Desktop bar links**: ~36px → ~44px (the AAA 2.5.5 size; the 64px
   header bar is the ceiling — the full menu lives in the panels,
   where 48px+ holds).
7. **Footer links**: ~20px → ~36px targets (padding; wrap gap
   tightened to match).
8. **Homepage hero buttons** (Start reading / Search the Word /
   Listen): labels 14px → 16px, targets ~42px → ~48px.
9. **Book card "N chapters" line**: 12px → 14px (contrast already
   passed: sage-400 on vineyard-900 = 7.32:1).
10. **Reduced motion (2.3.3 spirit)**: smooth scrolling now applies
    only under `prefers-reduced-motion: no-preference` (it was
    unconditional); book/chapter card hover lift and image zoom are
    disabled under reduced motion (they were not).

Contrast spot-checks beyond the menu — all PASS 1.4.3: night reader
muted 8.03:1, faint 5.96:1; footer fine print (sage-500 on
vineyard-900) 5.43:1; gold button text (vineyard-950 on gold-500)
7.63:1. Whole-card link targets on book and chapter lists are hundreds
of pixels — the friendliest targets on the site.

### Found — for Jason's decision (structural or face-changing)

A. **Reader top-bar controls at ~32–38px.** AA-compliant (≥24px) but
   under the 48px house standard. Reaching 48px on a phone-width bar
   means a second controls row — a layout change. Recommendation: on
   phones, wrap translation / Lamp / word-size into their own
   full-width row of 48px targets.
B. **Lamp-theme margins are the slimmest in the app.** Faint text
   4.71:1, verse-number gold 4.93:1, muted 4.99:1 — all pass 1.4.3's
   4.5:1 floor, with little headroom. Recorded as a watch item: any
   future parchment change must re-check these pairs first.
C. **Verse action circles (share / cross-references) ≈ 24px.** They
   meet 2.5.8 exactly but are tight for a shaky hand; enlarging them
   changes the verse column — the crowned reading surface — so it
   waits for Jason's word.
D. **Homepage heartbeat first paint** can briefly show the stale zero
   snapshot ("0 chapters read…") before the live count lands. A truth
   defect, not a WCAG failure; already on Jason's list from the
   Oct 18 audit, flagged again here. Not touched.
E. **Search by passage address** ("Psalm 23", "John 3:16") returns no
   chapters — a comprehension aid for elders; a feature, not a fix.
   Already on Jason's list. Not touched.
F. **Menu group headings** are 14px uppercase with wide tracking
   (house style, contrast 6.37–9.31:1 — passes). All-caps tracked text
   is harder for some low-vision and dyslexic readers; changing the
   case style is a face decision.

### Where this house already exceeds AA

48px targets as the standing standard (AAA 2.5.5 asks 44) · 18px menu
labels · a word-size control with three reader-chosen steps (1.4.4
headroom built in) · no audio ever auto-plays (1.4.2 / 2.2.2) · the
post-chapter music bed keeps playing by the owner's explicit ruling ·
every count says "chapters read", never persons.
