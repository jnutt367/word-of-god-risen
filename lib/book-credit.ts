/**
 * The book-credit guard, decided purely so it can be checked on its
 * own: given what a device stored for a book and the current
 * heartbeat day, should the "book" beat fire, and what should the
 * device store afterwards?
 *
 * The rule (Jason, Nov 4, 2026): once per day per book — a reader
 * who reads a book through again on a later day earns the credit
 * again. See beatBookComplete in lib/heartbeat.ts for the full
 * ruling and the migration note for the legacy flag.
 */
export function bookCreditDecision(
  stored: string | null,
  today: string
): { fire: boolean; store: string } {
  // Legacy flag from the old once-ever rule (the literal "1"): treat
  // it as credited TODAY and convert it to today's date without
  // firing — some of those completions are today's own and must not
  // be paid twice.
  if (stored === "1") return { fire: false, store: today };
  // Already credited on this heartbeat day.
  if (stored === today) return { fire: false, store: today };
  // A past day, or nothing stored yet: this completion earns it.
  return { fire: true, store: today };
}
