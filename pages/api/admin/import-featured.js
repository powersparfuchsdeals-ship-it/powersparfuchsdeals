import { createClient } from "@supabase/supabase-js";
import { importFeedRows } from "../../../lib/feedImport";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FEATURED_QUERIES = [
  "iphone",
  "samsung",
  "gaming headset",
  "mechanical keyboard",
  "gaming mouse",
  "smartwatch",
  "wireless earbuds",
  "laptop",
  "monitor",
  "tablet",
  "bluetooth speaker",
  "powerbank"
];

function getBaseUrl(req) {
  const protocol =
    req.headers["x-forwarded-proto"] ||
    (process.env.NODE_ENV === "development" ? "http" : "https");

  return `${protocol}://${req.headers.host}`;
}

function isGoodProduct(item) {
  const price = Number(item.price || 0);
  const name = (item.name || "").toLowerCase();

  if (!price || price <= 5) return false;
  if (price > 5000) return false;

  if (
    name.includes("iphone") ||
    name.includes("samsung") ||
    name.includes("gaming") ||
    name.includes("pro") ||
    name.includes("ultra")
  ) {
    return true;
  }

  if (price >= 20 && price <= 500) return true;

  return false;
}

export default async function handler(req, res) {
  const baseUrl = getBaseUrl(req);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const query of FEATURED_QUERIES) {
      const response = await fetch(
        `${baseUrl}/api/amazon-feed?q=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (!Array.isArray(data)) continue;

      const filtered = data
        .filter(isGoodProduct)
        .map((item) => ({
          ...item,
          tag: "featured",
          category: item.category || "featured"
        }));

      const result = await importFeedRows({
        supabase: supabaseAdmin,
        items: filtered,
        userId: null
      });

      created += result.created || 0;
      updated += result.updated || 0;
      skipped += result.skipped || 0;
    }

    return res.status(200).json({
      ok: true,
      type: "featured",
      created,
      updated,
      skipped
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
