import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = "test1405";

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const { id, title, price, image, url, category, source, asin } = req.body;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Produkt-ID fehlt",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .update({
        name: title || "",
        price: price ? Number(price) : null,
        image: image || null,
        buy_link: url || null,
        category: category || "allgemein",
        source: source || "manual",
        asin: asin || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      ok: true,
      product: data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: "Server Fehler",
    });
  }
}
