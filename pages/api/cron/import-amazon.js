import { createClient } from "@supabase/supabase-js";
import { importFeedRows } from "../../../lib/feedImport";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORY_QUERIES = {
  tv: [
    "4K Fernseher",
    "OLED TV",
    "QLED TV",
    "Smart TV",
    "Soundbar",
    "Heimkino System",
    "Streaming Stick"
  ],
  smartphone: [
    "Smartphone",
    "Android Smartphone",
    "Powerbank",
    "Wireless Charger",
    "USB C Ladegerät",
    "Handyhülle",
    "MagSafe Zubehör"
  ],
  audio: [
    "Bluetooth Kopfhörer",
    "Noise Cancelling Kopfhörer",
    "In Ear Kopfhörer",
    "Bluetooth Lautsprecher",
    "USB Mikrofon",
    "Gaming Headset"
  ],
  laptop: [
    "Laptop",
    "Gaming Laptop",
    "Ultrabook",
    "Mini PC",
    "Tablet",
    "2 in 1 Laptop"
  ],
  monitor: [
    "Gaming Monitor",
    "4K Monitor",
    "Ultrawide Monitor",
    "Office Monitor",
    "Monitor Halterung"
  ],
  pc: [
    "Mechanische Tastatur",
    "Gaming Maus",
    "Webcam",
    "USB Hub",
    "Docking Station",
    "Externe SSD",
    "Laptop Ständer"
  ],
  gaming: [
    "Controller",
    "Gaming Tastatur",
    "Gaming Maus",
    "Gaming Headset",
    "Lenkrad Gaming",
    "RGB Beleuchtung"
  ],
  smarthome: [
    "WLAN Steckdose",
    "Smart Lampe",
    "Überwachungskamera WLAN",
    "Video Türklingel",
    "Smart Speaker",
    "Thermostat WLAN"
  ],
  network: [
    "WLAN Router",
    "Mesh WLAN",
    "Repeater WLAN",
    "Access Point",
    "Netzwerk Switch"
  ],
  storage: [
    "SSD",
    "NVMe SSD",
    "Externe Festplatte",
    "NAS Speicher",
    "USB Stick",
    "microSD Karte"
  ],
  office: [
    "Drucker",
    "Laserdrucker",
    "Scanner",
    "Grafiktablett",
    "Ringlicht",
    "Podcast Mikrofon"
  ],
  wearable: [
    "Smartwatch",
    "Fitness Tracker",
    "Bluetooth Tracker"
  ],
  camera: [
    "Action Cam",
    "Dashcam",
    "Überwachungskamera",
    "Kamerastativ",
    "Gimbal Smartphone"
  ]
};

const MAX_PAGES_PER_QUERY = 4;
const LIMIT_PER_PAGE = 24;

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
  const url = `${baseUrl}/api/amazon-feed?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

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

function enrichItems(items, category, query) {
  return items.map((item) => ({
    ...item,
    category,
    source: item.source || "amazon",
    import_query: item.import_query || query
  }));
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

  const stats = [];
  const errors = [];

  try {
    for (const [category, queries] of Object.entries(CATEGORY_QUERIES)) {
      let categoryCreated = 0;
      let categoryUpdated = 0;
      let categorySkipped = 0;
      let requests = 0;

      for (const query of queries) {
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
            break;
          }

          const items = enrichItems(feed.items, category, query);

          try {
            const result = await importFeedRows({
              supabase: supabaseAdmin,
              items,
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
          } catch (err) {
            errors.push({
              category,
              query,
              page,
              error: err?.message || "importFeedRows fehlgeschlagen"
            });
          }
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
