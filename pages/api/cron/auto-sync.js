// pages/api/cron/auto-sync.js
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { buildContentHash, importFeedRows, parseCsv } from "../../../lib/feedImport";

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

async function loadFeedFromUrl(feedUrl, feedType) {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "orbital-noir-auto-sync/1.0",
      Accept:
        feedType === "json"
          ? "application/json,text/plain,*/*"
          : "text/csv,text/plain,*/*"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Feed request failed with ${response.status}`);
  }

  if (feedType === "json") {
    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed : parsed.items || [];
  }

  if (feedType === "csv") {
    const text = await response.text();
    return parseCsv(text);
  }

  throw new Error("AUTO_SYNC_FEED_TYPE muss json oder csv sein");
}

async function hasAlreadyProcessedRun(runKey) {
  const { data, error } = await supabaseAdmin
    .from("sync_runs")
    .select("id")
    .eq("run_key", runKey)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function markRunProcessed(runKey, meta = {}) {
  const { error } = await supabaseAdmin
    .from("sync_runs")
    .insert([
      {
        run_key: runKey,
        source_name: meta.sourceName || null,
        content_hash: meta.contentHash || null,
        item_count: meta.itemCount || 0
      }
    ]);

  if (error) throw new Error(error.message);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const expectedSecret = process.env.CRON_SECRET;
const token = getBearerToken(req);

// erkennt echten Vercel Cron Call
const isCron = req.headers["x-vercel-cron"] === "1";

if (!isCron && (!expectedSecret || token !== expectedSecret)) {
  return res.status(401).json({ ok: false, error: "Unauthorized" });
}
// 🔥 DEBUG BLOCK (temporär)
return res.status(200).json({
  autoSyncEnabled: process.env.AUTO_SYNC_ENABLED ?? null,
  feedUrl: process.env.AUTO_SYNC_FEED_URL ?? null,
  feedType: process.env.AUTO_SYNC_FEED_TYPE ?? null,
  sourceName: process.env.AUTO_SYNC_SOURCE_NAME ?? null,
  userId: process.env.AUTO_SYNC_USER_ID ?? null
});
  if (process.env.AUTO_SYNC_ENABLED !== "true") {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: "AUTO_SYNC_ENABLED ist nicht true"
    });
  }

  const feedUrl = process.env.AUTO_SYNC_FEED_URL;
  const feedType = (process.env.AUTO_SYNC_FEED_TYPE || "json").toLowerCase();
  const sourceName = process.env.AUTO_SYNC_SOURCE_NAME || "default";
  const userId = process.env.AUTO_SYNC_USER_ID;

  if (!feedUrl) {
    return res.status(500).json({
      ok: false,
      error: "AUTO_SYNC_FEED_URL fehlt"
    });
  }

  if (!userId) {
    return res.status(500).json({
      ok: false,
      error: "AUTO_SYNC_USER_ID fehlt"
    });
  }

  try {
    const items = await loadFeedFromUrl(feedUrl, feedType);
    const contentHash = buildContentHash(items);
    const day = new Date().toISOString().slice(0, 10);
    const runKey = `${sourceName}:${day}:${contentHash}`;

    const alreadyDone = await hasAlreadyProcessedRun(runKey);
    if (alreadyDone) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        runKey,
        imported: 0
      });
    }

    const result = await importFeedRows({
      supabase: supabaseAdmin,
      items,
      userId
    });

    await markRunProcessed(runKey, {
      sourceName,
      contentHash,
      itemCount: items.length
    });

    return res.status(200).json({
      ok: true,
      runKey,
      sourceName,
      feedType,
      fetched: items.length,
      ...result
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
