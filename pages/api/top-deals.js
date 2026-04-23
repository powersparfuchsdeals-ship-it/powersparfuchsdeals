import { supabase } from "../../lib/supabase";

function scoreProduct(product, trackingCount = 0) {
  let score = 0;

  const dbClicks = Number(product.clicks || 0);
  const price = Number(product.price || 0);
  const tag = String(product.tag || "").toLowerCase();
  const category = String(product.category || "").toLowerCase();

  score += Math.min(dbClicks, 100) * 2;
  score += Math.min(trackingCount, 200) * 3;

  if (tag === "featured") score += 220;
  if (tag === "preisfehler") score += 320;

  if (category === "price-error") score += 220;

  if (price > 20 && price < 300) score += 90;
  if (price > 0 && price < 10) score += 50;
  if (price >= 300 && price <= 900) score += 40;

  const created = new Date(product.created_at || Date.now());
  const ageHours = (Date.now() - created.getTime()) / 1000 / 60 / 60;

  if (ageHours < 24) score += 140;
  else if (ageHours < 72) score += 90;
  else if (ageHours < 168) score += 40;

  if (product.image) score += 20;
  if (product.description) score += 20;
  if (product.buy_link) score += 30;

  return score;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const limit = Math.min(Number(req.query.limit || 12), 50);

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*");

    if (productError) {
      return res.status(500).json({
        ok: false,
        error: productError.message
      });
    }

    const { data: trackingEvents, error: trackingError } = await supabase
      .from("tracking_events")
      .select("product_id, type, created_at")
      .eq("type", "click");

    if (trackingError) {
      return res.status(500).json({
        ok: false,
        error: trackingError.message
      });
    }

    const trackingMap = new Map();

    for (const event of trackingEvents || []) {
      const key = String(event.product_id || "");
      if (!key) continue;
      trackingMap.set(key, (trackingMap.get(key) || 0) + 1);
    }

    const ranked = (products || [])
      .map((product) => {
        const trackingCount = trackingMap.get(String(product.id)) || 0;
        const score = scoreProduct(product, trackingCount);

        return {
          ...product,
          tracking_clicks: trackingCount,
          deal_score: score
        };
      })
      .sort((a, b) => b.deal_score - a.deal_score)
      .slice(0, limit);

    return res.status(200).json({
      ok: true,
      count: ranked.length,
      items: ranked
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
