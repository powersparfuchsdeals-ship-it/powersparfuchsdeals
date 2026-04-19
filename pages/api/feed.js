import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("name, price, description, buy_link, image, created_at")
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
      image: product.image || ""
    }));

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
