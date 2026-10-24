/**
 * The count-keeper's new home — a tiny client for the Upstash Redis
 * REST API, server-side only.
 *
 * Why this exists (Oct 23, 2026): the counters' first home, a private
 * Vercel Blob store, hit the Hobby plan's advanced-operations ceiling
 * (2,000/2,000) eight days after go-live and locked until Nov 22 —
 * the homepage card fell back to its resting snapshot and beats/taps
 * stopped recording. Jason's ruling: "Move the count-keeper to a
 * free home." The new home is an Upstash Redis database on its free
 * tier (500K commands/month, 250 MB, no credit card, no per-op cliff
 * that this workload can reach), spoken to over its REST API so the
 * app's serverless routes need no TCP connection and no new package —
 * just fetch. See HEARTBEAT.md, "v4 — the count-keeper moves house,"
 * and ~/workspace/audio-gen/audit/store-migration-2026-10-23/.
 *
 * Credentials arrive as env vars, set in the Vercel project when the
 * database is connected — either the Upstash names
 * (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) or the Vercel
 * integration names (KV_REST_API_URL / KV_REST_API_TOKEN). The values
 * are read here and nowhere else; they are never logged or stored.
 */

export interface RedisConfig {
  url: string;
  token: string;
}

/** The store's credentials, or null when no store is connected —
 *  the routes' snapshot fallback hangs on exactly this, as it did
 *  in the Blob days. */
export function redisConfig(): RedisConfig | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export type RedisCommand = (string | number)[];

interface RedisReply {
  result?: unknown;
  error?: string;
}

async function post(cfg: RedisConfig, path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${cfg.url}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // A hung store must fail fast into the routes' fallback, never
    // hang a reader's page behind it.
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    throw new Error(`redis REST HTTP ${res.status}`);
  }
  return res.json();
}

function unwrap(reply: RedisReply, command: RedisCommand): unknown {
  if (reply && typeof reply === "object" && "error" in reply && reply.error) {
    throw new Error(`redis ${String(command[0])} failed: ${reply.error}`);
  }
  return (reply as RedisReply)?.result;
}

/** Run one command; returns its Redis result (strings/numbers stay
 *  as the REST API returns them). Throws on any error — callers in
 *  the stores let that propagate to the routes, whose fallbacks and
 *  logs are built for exactly this. */
export async function redisCommand(
  cfg: RedisConfig,
  command: RedisCommand
): Promise<unknown> {
  const replies = (await post(cfg, "/pipeline", [command])) as RedisReply[];
  return unwrap(replies[0], command);
}

/** Run several commands in one HTTP round trip (one pipeline). Each
 *  command still counts once against the store's allowance — the
 *  schema in the stores is designed so a beat costs a handful and a
 *  read a handful, flat, however long the history grows. Throws if
 *  any command errors. */
export async function redisPipeline(
  cfg: RedisConfig,
  commands: RedisCommand[]
): Promise<unknown[]> {
  if (commands.length === 0) return [];
  const replies = (await post(cfg, "/pipeline", commands)) as RedisReply[];
  return commands.map((command, i) => unwrap(replies[i], command));
}

/** HGETALL's flat [field, value, field, value, …] → a record. */
export function hashToRecord(flat: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(flat)) {
    for (let i = 0; i + 1 < flat.length; i += 2) {
      out[String(flat[i])] = String(flat[i + 1]);
    }
  }
  return out;
}

/** A stored counter value → an integer, 0 when absent or garbled. */
export function toInt(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
