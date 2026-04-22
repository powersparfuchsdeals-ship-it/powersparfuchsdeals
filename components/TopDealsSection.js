import ProductCard from "./ProductCard";

export default function TopDealsSection({ products, trackClick }) {
  if (!products || products.length === 0) return null;

  const topDeals = products.slice(0, 6);

  return (
    <section id="deals" style={{ marginBottom: "40px" }}>
      <div className="section-head">
        <div>
          <div className="micro-label">🔥 Deals</div>
          <h2>Top Angebote</h2>
        </div>
        <p>Die aktuell beliebtesten Produkte</p>
      </div>

      <div className="shop-grid">
        {topDeals.map((p) => (
          <ProductCard key={p.id} p={p} trackClick={trackClick} />
        ))}
      </div>
    </section>
  );
}
