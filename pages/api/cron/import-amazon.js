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
    const queries = ["iphone", "smart tv", "laptop", "headphones"];
    const allProducts = [];

    for (const q of queries) {
      const response = await fetch(
        `https://dummyjson.com/products/search?q=${encodeURIComponent(q)}`
      );

      if (!response.ok) continue;

      const data = await response.json();
      const items = Array.isArray(data.products) ? data.products : [];

      const mapped = items.slice(0, 12).map((item) => ({
        name: item.title,
        price: String(item.price),
        description: item.description,
        image: item.thumbnail,
        buy_link: `https://www.amazon.de/s?k=${encodeURIComponent(
          item.title || q
        )}&tag=${partnerTag}`,
        clicks: 0
      }));

      allProducts.push(...mapped);
    }

    const uniqueProducts = Array.from(
      new Map(allProducts.map((item) => [item.buy_link, item])).values()
    );

    const { error } = await supabaseAdmin
      .from("products")
      .upsert(uniqueProducts, { onConflict: "buy_link" });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({
      ok: true,
      imported: uniqueProducts.length
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Import Fehler"
    });
  }
}
