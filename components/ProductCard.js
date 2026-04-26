import Image from "next/image";

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
  const buyLink = product.buy_link || product.link || "#";

  const imageUrl =
    product.image && String(product.image).startsWith("http")
      ? product.image
      : "/placeholder.png";

  const isTopDeal = Number(product.deal_score || 0) > 300 || tag === "featured";
  const isPriceError =
    tag === "preisfehler" ||
    String(product.category || "").toLowerCase() === "price-error";

  const hasOldPrice = oldPrice > price && price > 0;

  async function handleClick() {
    if (trackClick) {
      await trackClick(product);
    }
  }

  return (
    <article style={styles.card}>
      <div style={styles.imageWrap}>
        {isTopDeal ? <div style={styles.ribbon}>🔥 Top Deal</div> : null}

        <Image
          src={imageUrl}
          alt={product.name || "Produkt"}
          fill
          style={{ objectFit: "contain" }}
          sizes="(max-width: 768px) 100vw, 260px"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png";
          }}
        />
      </div>

      <div style={styles.body}>
        <div style={styles.badges}>
          <span style={styles.badgeGreen}>Top Deal</span>

          {isPriceError ? <span style={styles.badgeRed}>Preisfehler</span> : null}
          {clicks > 20 ? <span style={styles.badgeDark}>🔥 Trending</span> : null}
          {merchant ? <span style={styles.badgeDark}>{merchant}</span> : null}
        </div>

        <h3 style={styles.title}>{product.name || "Unbenanntes Produkt"}</h3>

        <p style={styles.description}>
          {product.description || "Aktuelles Technik-Angebot mit direktem Deal-Link."}
        </p>

        <div style={styles.meta}>
          <span>{product.category || "Tech"}</span>
          <span>{clicks} Klicks</span>
        </div>

        <div style={styles.priceBox}>
          {hasOldPrice ? <div style={styles.oldPrice}>{formatPrice(oldPrice)}</div> : null}

          <div style={styles.price}>{formatPrice(price)}</div>

          {hasOldPrice ? (
            <div style={styles.save}>Spare {formatPrice(oldPrice - price)}</div>
          ) : null}
        </div>

        {buyLink && buyLink !== "#" ? (
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
          <span style={styles.disabledBtn}>Kein Link vorhanden</span>
        )}

        <div style={styles.note}>Affiliate-Link möglich · Preis kann sich ändern</div>
      </div>
    </article>
  );
}

const pillBase = {
  padding: "3px 9px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1.4
};

const styles = {
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 14px 44px rgba(0,0,0,0.08)",
    minHeight: "100%"
  },

  imageWrap: {
    position: "relative",
    height: "230px",
    background: "#ffffff",
    borderBottom: "1px solid #f3f4f6"
  },

  ribbon: {
    position: "absolute",
    top: "12px",
    left: "12px",
    zIndex: 2,
    background: "#ff9900",
    color: "#ffffff",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 900,
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
  },

  body: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1
  },

  badges: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap"
  },

  badgeGreen: {
    ...pillBase,
    background: "#e6f4ea",
    color: "#0f5132"
  },

  badgeRed: {
    ...pillBase,
    background: "#fdecea",
    color: "#842029"
  },

  badgeDark: {
    ...pillBase,
    background: "#111827",
    color: "#ffffff"
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "16px",
    lineHeight: 1.35,
    fontWeight: 800
  },

  description: {
    margin: 0,
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: 1.5,
    minHeight: "42px"
  },

  meta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 600
  },

  priceBox: {
    marginTop: "auto"
  },

  oldPrice: {
    color: "#6b7280",
    textDecoration: "line-through",
    fontSize: "14px",
    marginBottom: "2px"
  },

  price: {
    color: "#111827",
    fontSize: "26px",
    fontWeight: 900,
    letterSpacing: "-0.04em"
  },

  save: {
    color: "#15803d",
    fontWeight: 800,
    fontSize: "14px",
    marginTop: "2px"
  },

  buyBtn: {
    marginTop: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    borderRadius: "12px",
    background: "#ffd814",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #facc15",
    boxShadow: "0 8px 18px rgba(0,0,0,0.08)"
  },

  disabledBtn: {
    marginTop: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    borderRadius: "12px",
    background: "#e5e7eb",
    color: "#6b7280",
    fontWeight: 800
  },

  note: {
    color: "#9ca3af",
    fontSize: "12px",
    lineHeight: 1.4
  }
};
