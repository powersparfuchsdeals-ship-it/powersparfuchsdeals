export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const keyword = String(req.query.q || "technik").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 24)));
    const skip = (page - 1) * limit;

    const partnerTag = process.env.AMAZON_PARTNER_TAG || "";

    if (!partnerTag) {
      return res.status(500).json({
        ok: false,
        error: "AMAZON_PARTNER_TAG fehlt"
      });
    }

    const response = await fetch(
      `https://dummyjson.com/products/search?q=${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        error: `Produktquelle Fehler: ${response.status}`
      });
    }

    const data = await response.json();

    const items = (data.products || []).map((p) => ({
      name: p.title || "Amazon Produkt",
      price: String(p.price ?? "0"),
      description: p.description || "",
      buy_link: `https://www.amazon.de/s?k=${encodeURIComponent(
        p.title || keyword
      )}&tag=${partnerTag}`,
      image: p.thumbnail || null,
      source: "amazon",
      import_query: keyword
    }));

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Amazon Feed Fehler"
    });
  }
}
