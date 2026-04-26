export function calculateScore(product, trackingClicks = 0) {
  const price = Number(product.price || 0);
  const clicks = Number(product.clicks || 0);
  const tag = String(product.tag || "").toLowerCase();
  const createdAt = new Date(product.created_at || Date.now());

  const ageHours = (Date.now() - createdAt.getTime()) / 1000 / 60 / 60;

  let score = 0;

  // 🔥 Klicks
  score += clicks * 2;
  score += trackingClicks * 3;

  // 🆕 Frische
  if (ageHours < 24) score += 120;
  else if (ageHours < 72) score += 60;

  // 🏷 Tags
  if (tag === "featured") score += 200;
  if (tag === "preisfehler") score += 300;

  // 💸 Preis attraktiv
  if (price > 0 && price < 20) score += 80;
  if (price > 0 && price < 10) score += 120;

  return score;
}
