export default function ProductCard({ p, trackClick }) {
  const clicks = Number(p.clicks || 0);
  const numericPrice = Number(p.price || 0);
  const fakeOldPrice =
    numericPrice > 0 ? (numericPrice * 1.18).toFixed(2) : null;
  const isHot = clicks > 20;
  const badge = isHot ? "🔥 Bestseller" : "⚡ Top Deal";
  const stockText = clicks > 30 ? "Heute stark gefragt" : "Beliebtes Produkt";
  const urgencyText =
    clicks > 25 ? "Nur noch wenige verfügbar" : "Schneller Versand";

  return (
    <article style={styles.card}>
      <a style={styles.imageWrap} href={`/product/${p.id}`}>
        <img
          src={p.image || "https://via.placeholder.com/1200x900?text=Orbital-Noir"}
          alt={p.name}
          style={styles.image}
        />

        <div style={styles.imageBadges}>
          <span style={styles.badgePrimary}>{badge}</span>
          <span style={styles.badgeDiscount}>-18%</span>
        </div>
      </a>

      <div style={styles.body}>
        <div style={styles.metaRow}>
          <span style={styles.metaClicks}>{clicks} Klicks</span>
          <span style={styles.metaTrust}>{stockText}</span>
        </div>

        <h3 style={styles.title}>
          <a href={`/product/${p.id}`} style={styles.titleLink}>
            {p.name}
          </a>
        </h3>

        <p style={styles.description}>
          {p.description || "Beliebtes Tech-Produkt mit starkem Preis-Leistungs-Verhältnis."}
        </p>

        <div style={styles.trustBox}>
          <div style={styles.trustLine}>✔ {urgencyText}</div>
          <div style={styles.trustLine}>✔ Direkt zum Angebot</div>
        </div>

        <div style={styles.footer}>
          <div>
            {fakeOldPrice ? <div style={styles.oldPrice}>{fakeOldPrice} €</div> : null}
            <div style={styles.price}>{p.price} €</div>
          </div>

          {p.buy_link ? (
            <a
              style={styles.buyBtn}
              href={p.buy_link}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick(p)}
            >
              🔥 Zum Deal
            </a>
          ) : (
            <span style={styles.buyBtnDisabled}>Kein Link</span>
          )}
        </div>
      </div>
    </article>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "20px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },

  imageWrap: {
    display: "block",
    position: "relative",
    aspectRatio: "4 / 3",
    background: "#f3f4f6",
    textDecoration: "none"
  },

  image: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  imageBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap"
  },

  badgePrimary: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#111827",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700
  },

  badgeDiscount: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#dc2626",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700
  },

  body: {
    padding: 18
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12
  },

  metaClicks: {
    color: "#6b7280",
    fontSize: 13
  },

  metaTrust: {
    color: "#111827",
    fontSize: 12,
    fontWeight: 600
  },

  title: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.2,
    letterSpacing: "-0.03em"
  },

  titleLink: {
    color: "#111827",
    textDecoration: "none"
  },

  description: {
    marginTop: 10,
    marginBottom: 14,
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 1.6
  },

  trustBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    background: "#f9fafb",
    border: "1px solid rgba(17,24,39,0.06)"
  },

  trustLine: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 1.6
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 12,
    flexWrap: "wrap"
  },

  oldPrice: {
    color: "#9ca3af",
    fontSize: 13,
    textDecoration: "line-through",
    marginBottom: 4
  },

  price: {
    color: "#111827",
    fontWeight: 700,
    fontSize: 24,
    letterSpacing: "-0.03em"
  },

  buyBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 12,
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
    whiteSpace: "nowrap"
  },

  buyBtnDisabled: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 12,
    background: "#e5e7eb",
    color: "#6b7280",
    fontWeight: 600
  }
};
