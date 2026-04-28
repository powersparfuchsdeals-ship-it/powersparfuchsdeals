import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const product = req.body;

    if (!product.name || !product.price || !product.buy_link) {
      return res.status(400).json({
        ok: false,
        error: "Name, Preis und Buy Link sind erforderlich",
      });
    }

    const payload = {
      name: String(product.name).trim(),
      price: Number(product.price || 0),
      category: product.category || "other",
      image: product.image || "/placeholder.png",
      buy_link: product.buy_link,
      description: product.description || "",
      tag: product.tag || "",
      merchant: product.merchant || "",
      old_price: Number(product.old_price || 0),
      commission_rate: Number(product.commission_rate || 0.03),
      clicks: 0,
      source: "manual",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert([payload])
      .select();

    if (error) {
      console.error("Insert error:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, product: data?.[0] || null });
  } catch (error) {
    console.error("API crash:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
