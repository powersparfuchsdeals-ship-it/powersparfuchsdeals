import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export default async function handler(req, res) {
  try {
    const partnerTag = process.env.AMAZON_PARTNER_TAG || "";

    const response = await fetch(
      "https://dummyjson.com/products/search?q=iphone"
    );

    const data = await response.json();

    const products = data.products.slice(0, 8).map((item) => ({
      name: item.title,
      price: String(item.price),
      description: item.description,
      image: item.thumbnail,
      buy_link: `https://www.amazon.de/s?k=${encodeURIComponent(
        item.title
      )}&tag=${partnerTag}`,
      clicks: 0
    }));

    const { error } = await supabaseAdmin
      .from("products")
      .upsert(products, { onConflict: "buy_link" });

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
