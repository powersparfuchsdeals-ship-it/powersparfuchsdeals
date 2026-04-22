export default function ProductCard({ p, trackClick }) {
  return (
    <article className="shop-card">
      <a className="shop-card-image" href={`/product/${p.id}`}>
        <img
          src={p.image || "https://via.placeholder.com/1200x900?text=Orbital-Noir"}
          alt={p.name}
        />
      </a>

      <div className="shop-card-body">
        <div className="shop-card-meta">
          <span className="shop-card-badge">
            {(p.clicks || 0) > 20 ? "🔥 Bestseller" : "⚡ Top Deal"}
          </span>
          <span className="shop-card-clicks">{p.clicks || 0} Klicks</span>
        </div>

        <h3 className="shop-card-title">
          <a href={`/product/${p.id}`}>{p.name}</a>
        </h3>

        <p className="shop-card-description">
          {p.description || "Beliebtes Tech-Produkt mit starkem Preis-Leistungs-Verhältnis."}
        </p>

        <p
          style={{
            fontSize: "13px",
            opacity: 0.75,
            marginTop: "-4px",
            marginBottom: "16px",
            color: "#4b5563",
            lineHeight: 1.5
          }}
        >
          ✔ Schneller Versand<br />
          ✔ Beliebtes Produkt
        </p>

        <div className="shop-card-footer">
          <div className="shop-card-price">{p.price} €</div>

          {p.buy_link ? (
            <a
              className="shop-buy-btn"
              href={p.buy_link}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick(p)}
            >
              🔥 Zum Deal
            </a>
          ) : (
            <span className="shop-buy-btn disabled">Kein Link</span>
          )}
        </div>
      </div>
    </article>
  );
}
