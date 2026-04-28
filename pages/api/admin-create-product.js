import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Nur POST erlaubt" });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    return res.status(500).json({ ok: false, error: "NEXT_PUBLIC_SUPABASE_URL fehlt" });
  }

  if (!serviceKey) {
    return res.status(500).json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY fehlt" });
  }

  const supabaseAdmin = createClient(url, serviceKey);

  try {
    const body = req.body || {};

    const payload = {
      name: String(body.name || "").trim(),
      price: Number(body.price || 0),
      category: String(body.category || "other").trim(),
      image: String(body.image || "/placeholder.png").trim(),
      buy_link: String(body.buy_link || "").trim(),
      description: String(body.description || "").trim(),
      tag: String(body.tag || "").trim(),
      merchant: String(body.merchant || "").trim(),
      old_price: Number(body.old_price || 0),
      commission_rate: Number(body.commission_rate || 0.03),
      clicks: 0,
      source: "manual",
      created_at: new Date().toISOString(),
    };

    if (!payload.name || !payload.price || !payload.buy_link) {
      return res.status(400).json({
        ok: false,
        error: "Name, Preis oder Buy Link fehlt",
        payload,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert([payload])
      .select();

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });
    }

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || "API Crash",
      stack: err.stack,
    });
  }
}
