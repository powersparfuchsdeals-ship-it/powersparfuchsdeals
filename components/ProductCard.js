function formatPrice(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

export default function ProductCard({ p, trackClick }) {
  const product = p || {};

  const price = Number(product.price || 0);
  const oldPrice = Number(product.old_price || 0);
  const clicks = Number(product.clicks || 0);
  const tag = String(product.tag || "").toLowerCase();
  const merchant = product.merchant || product.source || "";
  const buyLink = product.buy_link || "#";

  // 🔥 IMAGE FIX (robust)
  let imageUrl = "/placeholder.png";

  if (
    product.image &&
    typeof product.image === "string" &&
    product.image.startsWith("http") &&
    !product.image.includes("amazon")
  ) {
    imageUrl = product.image;
  }

  const isTopDeal = tag === "featured";
  const isPriceError = tag === "preisfehler";
  const hasOldPrice = oldPrice > price && price > 0;

  async function handleClick() {
    if (trackClick) {
      await trackClick(product);
    }
  }

  return (
    <div style={styles.card}>
      {/* IMAGE */}
      <div style={styles.imageWrap}>
        {isTopDeal && <div style={styles.ribbon}>🔥 Top Deal</div>}

        <img
          src={imageUrl}
          alt={product.name || "Produkt"}
          style={styles.productImage}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png";
          }}
        />
      </div>

      {/* CONTENT */}
      <div style={styles.body}>
        <div style={styles.badges}>
          {isTopDeal && <span style={styles.badgeGreen}>Top Deal</span>}
          {isPriceError && <span style={styles.badgeRed}>Preisfehler</span>}
          {clicks > 20 && <span style={styles.badgeDark}>🔥 Trending</span>}
          {merchant && <span style={styles.badgeDark}>{merchant}</span>}
        </div>

        <h3 style={styles.title}>
          {product.name || "Unbenanntes Produkt"}
        </h3>

        <p style={styles.description}>
          {product.description || "Aktuelles Angebot"}
        </p>

        <div style={styles.meta}>
          <span>{product.category || "Tech"}</span>
          <span>{clicks} Klicks</span>
        </div>

        <div style={styles.priceBox}>
          {hasOldPrice && (
            <div style={styles.oldPrice}>{formatPrice(oldPrice)}</div>
          )}

          <div style={styles.price}>{formatPrice(price)}</div>

          {hasOldPrice && (
            <div style={styles.save}>
              Spare {formatPrice(oldPrice - price)}
            </div>
          )}
        </div>

        {buyLink !== "#" ? (
          <a
            href={buyLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            style={styles.buyBtn}
          >
            🔥 Deal ansehen
          </a>
        ) : (
          <div style={styles.disabledBtn}>Kein Link</div>
        )}

        <div style={styles.note}>
          Affiliate-Link möglich · Preis kann sich ändern
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #eee",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
  },

  imageWrap: {
    position: "relative",
    height: "220px",
    background: "#fff"
  },

  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain"
  },

  ribbon: {
    position: "absolute",
    top: 10,
    left: 10,
    background: "#ff9900",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "999px",
    fontWeight: "bold",
    fontSize: 12
  },

  body: {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  badges: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap"
  },

  badgeGreen: {
    background: "#e6f4ea",
    color: "#0f5132",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold"
  },

  badgeRed: {
    background: "#fdecea",
    color: "#842029",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold"
  },

  badgeDark: {
    background: "#111",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold"
  },

  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111"
  },

  description: {
    fontSize: 13,
    color: "#555"
  },

  meta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#777"
  },

  priceBox: {},

  oldPrice: {
    textDecoration: "line-through",
    fontSize: 13,
    color: "#888"
  },

  price: {
    fontSize: 24,
    fontWeight: "bold"
  },

  save: {
    color: "green",
    fontWeight: "bold",
    fontSize: 13
  },

  buyBtn: {
    marginTop: 8,
    background: "#ffd814",
    textAlign: "center",
    padding: 10,
    borderRadius: 10,
    fontWeight: "bold",
    textDecoration: "none",
    color: "#111"
  },

  disabledBtn: {
    marginTop: 8,
    background: "#eee",
    textAlign: "center",
    padding: 10,
    borderRadius: 10,
    color: "#777"
  },

  note: {
    fontSize: 11,
    color: "#aaa"
  }
};
