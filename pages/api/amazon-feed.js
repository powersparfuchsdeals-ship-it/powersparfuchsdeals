export default async function handler(req, res) {
  try {
    const keyword = req.query.q || "tech";

    // ⚠️ TEMPORÄR: Demo-Daten (funktioniert sofort!)
    const demoProducts = [
      {
        title: `Amazon ${keyword} Produkt 1`,
        price: "49.99",
        image: "https://via.placeholder.com/800x600?text=Amazon+1",
        url: "https://www.amazon.de/dp/B000000001"
      },
      {
        title: `Amazon ${keyword} Produkt 2`,
        price: "89.99",
        image: "https://via.placeholder.com/800x600?text=Amazon+2",
        url: "https://www.amazon.de/dp/B000000002"
      },
      {
        title: `Amazon ${keyword} Produkt 3`,
        price: "129.99",
        image: "https://via.placeholder.com/800x600?text=Amazon+3",
        url: "https://www.amazon.de/dp/B000000003"
      }
    ];

    const partnerTag = process.env.AMAZON_PARTNER_TAG || "dein-tag-21";

    // 🔥 Mapping auf dein Shop-System
    const items = demoProducts.map((item) => ({
      name: item.title,
      price: item.price,
      description: `Top Deal für ${keyword}`,
      buy_link: `${item.url}?tag=${partnerTag}`,
      image: item.image
    }));

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: "Amazon Feed Fehler" });
  }
}
