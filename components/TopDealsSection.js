import ProductCard from "./ProductCard";

function scoreProduct(product) {
  const clicks = Number(product.clicks || 0);
  const price = Number(product.price || 0);
  const isFeatured = String(product.tag || "").toLowerCase() === "featured";
  const isPriceError =
    String(product.tag || "").toLowerCase() === "preisfehler" ||
    String(product.category || "").toLowerCase() === "price-error";

  let score = 0;

  if (isFeatured) score += 100;
  if (isPriceError) score += 30;

  score += clicks * 3;

  if (price > 0 && price <= 150) score += 20;
  else if (price > 150 && price <= 400) score += 10;

  return score;
}

export default function TopDealsSection({ products, trackClick }) {
  if (!products || products.length === 0) return null;

  const topDeals = [...products]
    .sort((a, b) => scoreProduct(b) - scoreProduct(a))
    .slice(0, 6);

  if (!topDeals.length) return null;

  return (
    <section style={styles.wrap} id="deals">
      <div style={styles.head}>
        <div>
          <div style={styles.kicker}>🔥 Top Deals</div>
          <h2 style={styles.title}>Automatisch ausgewählte Highlights</h2>
        </div>
        <p style={styles.text}>
          Bevorzugt Featured-Produkte, beliebte Artikel und starke Angebote.
        </p>
      </div>

      <div style={styles.grid}>
        {topDeals.map((p) => (
          <ProductCard key={p.id} p={p} trackClick={trackClick} />
        ))}
      </div>
    </section>
  );
}

const styles = {
  wrap: {
    marginBottom: 34
  },

  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16
  },

  kicker: {
    color: "#6b7280",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
    marginBottom: 8
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: 32,
    letterSpacing: "-0.04em"
  },

  text: {
    margin: 0,
    color: "#4b5563",
    fontSize: 15
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18
  }
};
