import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRICE_ERROR_QUERIES = [
  "usb c kabel",
  "powerbank",
  "bluetooth kopfhörer",
  "smartwatch",
  "gaming maus",
  "mechanische tastatur",
  "webcam",
  "ssd",
  "usb stick",
  "ringlicht",
  "mikrofon usb",
  "ladegerät usb c",
  "wireless charger",
  "controller",
  "bluetooth lautsprecher"
];

const MAX_PAGES_PER_QUERY = 2;
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

function normalizePrice(value) {
  const raw = String(value ?? "0").replace(",", ".").trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isPriceErrorCandidate(item) {
  const price = normalizePrice(item.price);

  if (!price || price <= 0) return false;

  if (price <= 15) return true;
  if (price <= 25 && /ssd|smartwatch|kopfhörer|controller|mikrofon|lautsprecher/i.test(item.name || "")) {
    return true;
  }

  return false;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const baseUrl = getBaseUrl(req);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];
  const imported = [];

  try {
    for (const query of PRICE_ERROR_QUERIES) {
      for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
        const response = await fetch(
          `${baseUrl}/api/amazon-feed?q=${encodeURIComponent(query)}&page=${page}&limit=${LIMIT_PER_PAGE}`
        );

        const data = await response.json().catch(() => null);

        if (!response.ok || !Array.isArray(data)) {
          errors.push({
            query,
            page,
            error: data?.error || "Feed Fehler"
          });
          continue;
        }

        if (!data.length) break;

        const candidates = data
          .filter(isPriceErrorCandidate)
          .map((item) => ({
            ...item,
            category: "price-error",
            source: "amazon",
            import_query: query,
            tag: "preisfehler"
          }));

        for (const item of candidates) {
          const { data: existing } = await supabaseAdmin
            .from("products")
            .select("id")
            .eq("buy_link", item.buy_link)
            .maybeSingle();

          if (existing?.id) {
            const { error } = await supabaseAdmin
              .from("products")
              .update({
                name: item.name,
                price: item.price,
                description: item.description,
                image: item.image,
                category: item.category,
                source: item.source,
                import_query: item.import_query,
                tag: item.tag
              })
              .eq("id", existing.id);

            if (error) {
              errors.push({ query, page, item: item.name, error: error.message });
            } else {
              updated += 1;
              imported.push(item.name);
            }
          } else {
            const { error } = await supabaseAdmin
              .from("products")
              .insert([
                {
                  name: item.name,
                  price: item.price,
                  description: item.description,
                  image: item.image,
                  buy_link: item.buy_link,
                  clicks: 0,
                  category: item.category,
                  source: item.source,
                  import_query: item.import_query,
                  tag: item.tag
                }
              ]);

            if (error) {
              errors.push({ query, page, item: item.name, error: error.message });
            } else {
              created += 1;
              imported.push(item.name);
            }
          }
        }

        skipped += Math.max(0, data.length - candidates.length);
      }
    }

    return res.status(200).json({
      ok: true,
      created,
      updated,
      skipped,
      imported_count: imported.length,
      imported,
      errors
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Preisfehler-Import fehlgeschlagen",
      created,
      updated,
      skipped,
      errors
    });
  }
}
