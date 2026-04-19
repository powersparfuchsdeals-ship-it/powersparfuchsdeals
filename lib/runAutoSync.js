import { supabaseAdmin } from "./supabaseAdmin";
import { buildContentHash, importFeedRows, parseCsv } from "./feedImport";

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

export async function runAutoSync() {
  if (process.env.AUTO_SYNC_ENABLED !== "true") {
    return {
      ok: true,
      skipped: true,
      reason: "AUTO_SYNC_ENABLED ist nicht true"
    };
  }

  const feedUrl = process.env.AUTO_SYNC_FEED_URL;
  const feedType = (process.env.AUTO_SYNC_FEED_TYPE || "json").toLowerCase();
  const sourceName = process.env.AUTO_SYNC_SOURCE_NAME || "default";
  const userId = process.env.AUTO_SYNC_USER_ID;

  if (!feedUrl) throw new Error("AUTO_SYNC_FEED_URL fehlt");
  if (!userId) throw new Error("AUTO_SYNC_USER_ID fehlt");

  const items = await loadFeedFromUrl(feedUrl, feedType);
  const contentHash = buildContentHash(items);
  const day = new Date().toISOString().slice(0, 10);
  const runKey = `${sourceName}:${day}:${contentHash}`;

  const alreadyDone = await hasAlreadyProcessedRun(runKey);
  if (alreadyDone) {
    return {
      ok: true,
      duplicate: true,
      runKey,
      imported: 0
    };
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

  return {
    ok: true,
    runKey,
    sourceName,
    feedType,
    fetched: items.length,
    ...result
  };
}
