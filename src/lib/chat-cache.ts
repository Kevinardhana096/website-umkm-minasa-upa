import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { ChatSource } from "@/lib/chat";

const CACHE_TABLE = "chat_answer_cache";
const CACHE_KEY_VERSION = "web-v1";
const DEFAULT_TTL_SECONDS = 6 * 60 * 60;
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 7 * 24 * 60 * 60;

interface ChatAnswerCacheRow {
  reply: unknown;
  sources: unknown;
  provider: unknown;
  fetched_at: unknown;
  expires_at: unknown;
}

export interface CachedWebReply {
  reply: string;
  sources: ChatSource[];
  provider: string;
  fetchedAt: string;
}

function isCacheEnabled() {
  return process.env.AI_CHAT_WEB_CACHE_ENABLED?.trim().toLowerCase() !== "false";
}

function getCacheClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeCacheText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCacheKey(message: string, storeName?: string) {
  const fingerprint = [
    CACHE_KEY_VERSION,
    "id",
    normalizeCacheText(message),
    normalizeCacheText(storeName ?? ""),
  ].join("|");

  return createHash("sha256").update(fingerprint, "utf8").digest("hex");
}

function getTtlSeconds() {
  const configured = Number(process.env.AI_CHAT_WEB_CACHE_TTL_SECONDS);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_TTL_SECONDS;

  return Math.min(Math.max(Math.floor(configured), MIN_TTL_SECONDS), MAX_TTL_SECONDS);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseSources(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const title = typeof source.title === "string" ? source.title.trim().slice(0, 160) : "";
    const url = typeof source.url === "string" ? source.url.trim() : "";
    if (!title || !isHttpUrl(url)) return [];
    return [{ title, url }];
  }).slice(0, 5);
}

export async function getCachedWebReply(
  message: string,
  storeName?: string,
): Promise<CachedWebReply | null> {
  if (!isCacheEnabled()) return null;

  const client = getCacheClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(CACHE_TABLE)
      .select("reply, sources, provider, fetched_at, expires_at")
      .eq("cache_key", getCacheKey(message, storeName))
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.warn("Cache jawaban web belum tersedia:", error.message);
      return null;
    }

    const row = data as ChatAnswerCacheRow | null;
    if (
      !row
      || typeof row.reply !== "string"
      || typeof row.provider !== "string"
      || typeof row.fetched_at !== "string"
    ) {
      return null;
    }

    return {
      reply: row.reply,
      sources: parseSources(row.sources),
      provider: row.provider,
      fetchedAt: row.fetched_at,
    };
  } catch (error) {
    console.warn("Cache jawaban web tidak dapat dibaca:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function saveWebReplyToCache(
  message: string,
  storeName: string | undefined,
  reply: CachedWebReply,
) {
  if (!isCacheEnabled()) return;

  const client = getCacheClient();
  if (!client) return;

  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + getTtlSeconds() * 1_000);

  try {
    const { error } = await client
      .from(CACHE_TABLE)
      .upsert({
        cache_key: getCacheKey(message, storeName),
        query_text: message.trim(),
        context_name: storeName?.trim() || null,
        reply: reply.reply.trim(),
        sources: reply.sources.slice(0, 5),
        provider: reply.provider,
        fetched_at: fetchedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "cache_key" });

    if (error) console.warn("Jawaban web gagal disimpan ke cache:", error.message);
  } catch (error) {
    console.warn("Cache jawaban web tidak dapat disimpan:", error instanceof Error ? error.message : error);
  }
}
