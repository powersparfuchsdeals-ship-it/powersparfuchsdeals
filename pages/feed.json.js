// pages/feed.json.js
import { supabaseAdmin } from "../lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("name, price, description, buy_link, category, image, source_name")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }

    const items = (data || []).map((product) => ({
      name: product.name || "",
      price: product.price || "0",
      description: product.description || "",
      buy_link: product.buy_link || "",
      category: product.category || "",
      image: product.image || "",
      source_name: product.source_name || ""
    }));

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
