import ProductCard from "./ProductCard";

export default function TopDealsSection({ products, trackClick }) {
  if (!products || products.length === 0) return null;

  const topDeals = [...products]
    .sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0))
    .slice(0, 6);

  return (
    <section style={styles.wrap} id="deals">
      <div style={styles.head}>
        <div>
          <div style={styles.kicker}>🔥 Deals</div>
          <h2 style={styles.title}>Top Angebote</h2>
        </div>
        <p style={styles.text}>Die aktuell beliebtesten Produkte mit hoher Klickrate.</p>
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
