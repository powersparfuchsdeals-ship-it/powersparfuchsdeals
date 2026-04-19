export default async function handler(req, res) {
  try {
    const keyword = req.query.q || "tech";

    // ⚠️ Hier später echte Creators API URL einsetzen
    const apiUrl = `https://api.amazon.com/creators/search?q=${encodeURIComponent(keyword)}`;

    const response = await fetch(apiUrl, {
      headers: {
        "x-api-key": process.env.AMAZON_ACCESS_KEY
      }
    });

    const data = await response.json();

    // 🔥 Mapping auf dein Shop-System
    const items = (data.items || []).map((item) => ({
      name: item.title || "Amazon Produkt",
      price: item.price?.amount || "0",
      description: item.features?.join(", ") || "",
      buy_link: `${item.url}?tag=${process.env.AMAZON_PARTNER_TAG}`,
      image: item.image || null
    }));

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: "Amazon Feed Fehler" });
  }
}
