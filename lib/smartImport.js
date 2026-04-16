export function normalizeUrl(value) {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export function detectVendor(url) {
  const u = (url || "").toLowerCase();
  if (u.includes("amazon.")) return "Amazon";
  if (u.includes("otto.")) return "OTTO";
  if (u.includes("mediamarkt.")) return "MediaMarkt";
  if (u.includes("saturn.")) return "Saturn";
  if (u.includes("alternate.")) return "Alternate";
  if (u.includes("notebooksbilliger.")) return "Notebooksbilliger";
  return "Externer Anbieter";
}

export function inferCategory(text) {
  const t = (text || "").toLowerCase();

  if (/(headset|kopfh|earbuds|audio|sound|speaker)/.test(t)) return "Audio";
  if (/(keyboard|tastatur|mouse|maus|setup|desk)/.test(t)) return "Setup";
  if (/(laptop|notebook|macbook|thinkpad)/.test(t)) return "Laptop";
  if (/(monitor|display|screen)/.test(t)) return "Monitor";
  if (/(phone|smartphone|iphone|galaxy|pixel)/.test(t)) return "Smartphone";
  if (/(ssd|storage|drive|festplatte)/.test(t)) return "Storage";
  if (/(gpu|grafik|rtx|radeon)/.test(t)) return "Hardware";
  if (/(camera|kamera|webcam)/.test(t)) return "Kamera";
  if (/(watch|smartwatch)/.test(t)) return "Wearable";

  return "Tech";
}

export function buildPlaceholderImage(vendor, category) {
  const text = encodeURIComponent(`${vendor} ${category}`);
  return `https://via.placeholder.com/1200x900/0b1020/cfe8ff?text=${text}`;
}

export function buildSmartProduct({ link, title, price, category, description }) {
  const buyLink = normalizeUrl(link);
  const vendor = detectVendor(buyLink);
  const safeTitle = (title || "").trim() || `${vendor} Deal`;
  const safeCategory = (category || "").trim() || inferCategory(`${safeTitle} ${buyLink}`);
  const safeDescription =
    (description || "").trim() ||
    `${vendor}-Angebot automatisch importiert. Kategorie: ${safeCategory}. Verkaufslink direkt hinterlegt.`;
  const safePrice = String(price || "").trim() || "0";

  return {
    name: safeTitle,
    price: safePrice,
    description: safeDescription,
    buy_link: buyLink,
    image: buildPlaceholderImage(vendor, safeCategory),
    category: safeCategory,
    source_name: vendor
  };
}
