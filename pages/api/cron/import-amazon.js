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

    if (!partnerTag) {
      return res.status(500).json({
        ok: false,
        error: "AMAZON_PARTNER_TAG fehlt"
      });
    }

    const queries = ["iphone", "smart tv"];
    const allProducts = [];

    for (const q of queries) {
      const response = await fetch(
        `https://dummyjson.com/products/search?q=${encodeURIComponent(q)}`
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const sourceProducts = Array.isArray(data.products) ? data.products : [];

      const mappedProducts = sourceProducts.slice(0, 8).map((item) => ({
        name: item.title || "Amazon Produkt",
        price: String(item.price ?? "0"),
        description: item.description || "",
        image: item.thumbnail || null,
        buy_link: `https://www.amazon.de/s?k=${encodeURIComponent(
          item.title || q
        )}&tag=${partnerTag}`,
        clicks: 0
      }));

      allProducts.push(...mappedProducts);
    }

    const { error } = await supabaseAdmin
      .from("products")
      .upsert(allProducts, { onConflict: "buy_link" });

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true,
      imported: allProducts.length
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Import Fehler"
    });
  }
}
