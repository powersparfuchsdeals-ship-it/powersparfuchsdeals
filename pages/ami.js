import { createClient } from "@supabase/supabase-js";
import { importFeedRows } from "../../../lib/feedImport";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Diese Query-Liste ist absichtlich kleiner und fokussierter.
 * Mit DummyJSON bringen viele "echte" Tech-Begriffe kaum Treffer.
 * Deshalb konzentrieren wir uns auf Begriffe, die eher Resultate liefern.
 */
const CATEGORY_QUERIES = {
  smartphone: [
    "smartphone",
    "phone",
    "mobile",
    "android"
  ],
  laptop: [
    "laptop",
    "notebook"
  ],
  wearable: [
    "watch",
    "smartwatch"
  ],
  pc: [
    "keyboard",
    "mouse"
  ],
  audio: [
    "headphones",
    "earbuds"
  ],
  storage: [
    "tablet"
  ]
};

const LIMIT_PER_PAGE = 24;
const MAX_PAGES_PER_QUERY = 3;

/**
 * Wenn eine Query auf einer Seite nichts Neues bringt,
 * brechen wir diese Query früh ab.
 */
const STOP_QUERY_AFTER_EMPTY_PAGE = true;

/**
 * Wenn zu viele Requests hintereinander keine neuen Produkte bringen,
 * brechen wir den ganzen Job nicht ab, aber reduzieren Leerlauf.
 */
const MAX_CONSECUTIVE_NO_NEW = 8;

function getBaseUrl(req) {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  const protocol =
    req.headers["x-forwarded-proto"] ||
    (process.env.NODE_ENV === "development" ? "http" : "https");

  return `${protocol}://${req.headers.host}`;
}

async function fetchAmazonFeed(baseUrl, query, page, limit) {
  const url =
    `${baseUrl}/api/amazon-feed?q=${encodeURIComponent(query)}` +
    `&page=${page}&limit=${limit}`;

  const res = await fetch(url, { method: "GET" });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `amazon-feed Fehler für "${query}" Seite ${page}`,
      items: []
    };
  }

  if (!Array.isArray(data)) {
    return {
      ok: false,
      error: `Ungültige Feed-Antwort für "${query}" Seite ${page}`,
      items: []
    };
  }

  return {
    ok: true,
    items: data
  };
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function makeRuntimeKey(item) {
  const name = normalizeText(item.name);
  const link = normalizeText(item.buy_link);
  return `${name}__${link}`;
}

function enrichItems(items, category, query) {
  return items.map((item) => ({
    ...item,
    category,
    source: item.source || "amazon",
    import_query: item.import_query || query
  }));
}

function dedupeItems(items) {
  const map = new Map();

  for (const item of items) {
    const key = makeRuntimeKey(item);
    if (!key || key === "__") continue;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return [...map.values()];
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (cronSecret && bearer !== cronSecret) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      ok: false,
      error: "Supabase ENV fehlt"
    });
  }

  const baseUrl = getBaseUrl(req);

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let consecutiveNoNew = 0;

  const stats = [];
  const errors = [];
  const seenThisRun = new Set();

  try {
    for (const [category, queries] of Object.entries(CATEGORY_QUERIES)) {
      let categoryCreated = 0;
      let categoryUpdated = 0;
      let categorySkipped = 0;
      let requests = 0;

      for (const query of queries) {
        let queryHadNewItems = false;

        for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
          requests += 1;

          const feed = await fetchAmazonFeed(baseUrl, query, page, LIMIT_PER_PAGE);

          if (!feed.ok) {
            errors.push({
              category,
              query,
              page,
              error: feed.error
            });
            continue;
          }

          if (!feed.items.length) {
            if (STOP_QUERY_AFTER_EMPTY_PAGE) break;
            continue;
          }

          let items = enrichItems(feed.items, category, query);
          items = dedupeItems(items);

          const freshItems = items.filter((item) => {
            const key = makeRuntimeKey(item);
            if (!key || key === "__") return false;
            if (seenThisRun.has(key)) return false;
            seenThisRun.add(key);
            return true;
          });

          if (!freshItems.length) {
            categorySkipped += items.length;
            totalSkipped += items.length;
            consecutiveNoNew += 1;

            if (STOP_QUERY_AFTER_EMPTY_PAGE) {
              break;
            }

            continue;
          }

          try {
            const result = await importFeedRows({
              supabase: supabaseAdmin,
              items: freshItems,
              userId: null
            });

            const created = result.created || 0;
            const updated = result.updated || 0;
            const skipped = result.skipped || 0;

            totalCreated += created;
            totalUpdated += updated;
            totalSkipped += skipped;

            categoryCreated += created;
            categoryUpdated += updated;
            categorySkipped += skipped;

            if (created > 0) {
              queryHadNewItems = true;
              consecutiveNoNew = 0;
            } else {
              consecutiveNoNew += 1;
            }
          } catch (err) {
            errors.push({
              category,
              query,
              page,
              error: err?.message || "importFeedRows fehlgeschlagen"
            });
          }

          if (consecutiveNoNew >= MAX_CONSECUTIVE_NO_NEW) {
            errors.push({
              category,
              query,
              page,
              error: "Zu viele aufeinanderfolgende Requests ohne neue Produkte, Query-Lauf gekürzt"
            });
            break;
          }
        }

        if (!queryHadNewItems) {
          // kein neuer Treffer für diese Query
        }
      }

      stats.push({
        category,
        queries: queries.length,
        requests,
        created: categoryCreated,
        updated: categoryUpdated,
        skipped: categorySkipped
      });
    }

    return res.status(200).json({
      ok: true,
      source: "amazon",
      strategy: "focused-queries",
      limit_per_page: LIMIT_PER_PAGE,
      max_pages_per_query: MAX_PAGES_PER_QUERY,
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      stats,
      error_count: errors.length,
      errors
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Cron Import fehlgeschlagen",
      source: "amazon",
      strategy: "focused-queries",
      limit_per_page: LIMIT_PER_PAGE,
      max_pages_per_query: MAX_PAGES_PER_QUERY,
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      stats,
      errors
    });
  }
}
