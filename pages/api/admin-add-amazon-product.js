import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const { amazonUrl } = req.body;

    if (!amazonUrl) {
      return res.status(400).json({
        ok: false,
        error: "Amazon URL fehlt",
      });
    }

    const product = {
      name: "Amazon Test Produkt",
      price: 0,
      image: "",
      description: amazonUrl,
      buy_link: amazonUrl,
      source: "amazon",
      category: "tech",
    };

    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      ok: true,
      product: data?.[0] || null,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}
