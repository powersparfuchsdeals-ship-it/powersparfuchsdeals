import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/amazon-feed?q=iphone`
    );

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ ok: false, error: "Feed ungültig" });
    }

    const products = data.map((item) => ({
      name: item.name,
      price: item.price,
      description: item.description,
      image: item.image,
      buy_link: item.buy_link,
      clicks: 0
    }));

    // 🔥 Upsert (verhindert Duplikate)
    const { error } = await supabase
      .from("products")
      .upsert(products, { onConflict: ["buy_link"] });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({
      ok: true,
      imported: products.length
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
