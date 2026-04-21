import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const BACKGROUND_COLORS = [
  "#1a1a1f",
  "#1f2430",
  "#23294a",
  "#1c3553",
  "#2a3441",
  "#342345",
  "#174a3a",
  "#4a3a24",
  "#3f3f46",
  "#26354a"
];

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [nextColor, setNextColor] = useState(BACKGROUND_COLORS[1]);

  useEffect(() => {
    const savedColor = localStorage.getItem("orbital-noir-bg");
    if (savedColor && BACKGROUND_COLORS.includes(savedColor)) {
      const index = BACKGROUND_COLORS.indexOf(savedColor);
      const nextIndex = (index + 1) % BACKGROUND_COLORS.length;
      setBackgroundColor(savedColor);
      setNextColor(BACKGROUND_COLORS[nextIndex]);
    }
  }, []);

  useEffect(() => {
    document.body.style.background = `linear-gradient(135deg, ${backgroundColor} 0%, ${nextColor} 100%)`;
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.transition = "background 4s ease-in-out";
  }, [backgroundColor, nextColor]);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  async function loadProduct() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) {
      setProduct(data);
    }
  }

  async function trackClick(productData) {
    await supabase
      .from("products")
      .update({ clicks: (productData.clicks || 0) + 1 })
      .eq("id", productData.id);
  }

  if (!product) {
    return (
      <div style={styles.page}>
        <div style={styles.bgOrbA} />
        <div style={styles.bgOrbB} />
        <div style={styles.gridNoise} />

        <main style={styles.shell}>
          <div style={styles.loadingCard}>
            <div style={styles.microLabel}>Orbital-Noir</div>
            <h1 style={styles.loadingTitle}>Produkt wird geladen...</h1>
            <p style={styles.loadingText}>Bitte einen Moment warten.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgOrbA} />
      <div style={styles.bgOrbB} />
      <div style={styles.gridNoise} />

      <main style={styles.shell}>
        <div style={styles.topRow}>
          <a href="/" style={styles.backLink}>
            ← Zurück zum Shop
          </a>
        </div>

        <section style={styles.productWrap}>
          <div style={styles.imagePanel}>
            <img
              src={product.image || "https://via.placeholder.com/1200x900?text=Produkt"}
              alt={product.name}
              style={styles.productImage}
            />
          </div>

          <div style={styles.infoPanel}>
            <div style={styles.microLabel}>Orbital-Noir / Produkt</div>

            <h1 style={styles.productTitle}>{product.name}</h1>

            <div style={styles.metaRow}>
              <span style={styles.badge}>
                {(product.clicks || 0) > 10 ? "🔥 Beliebt" : "Orbital Drop"}
              </span>
              <span style={styles.clicksText}>{product.clicks || 0} Klicks</span>
            </div>

            <p style={styles.description}>
              {product.description || "Keine Beschreibung vorhanden."}
            </p>

            <div style={styles.buyBox}>
              <div>
                <div style={styles.priceLabel}>Preis</div>
                <div style={styles.price}>{product.price} €</div>
              </div>

              {product.buy_link ? (
                <a
                  href={product.buy_link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackClick(product)}
                  style={styles.buyButton}
                >
                  Jetzt kaufen
                </a>
              ) : (
                <div style={styles.noLinkText}>Kein Verkaufslink hinterlegt.</div>
              )}
            </div>

            {product.buy_link ? (
              <div style={styles.linkBox}>
                <div style={styles.linkLabel}>Verkaufslink</div>
                <div style={styles.linkText}>{product.buy_link}</div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

const panelBase = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)"
};

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },

  bgOrbA: {
    position: "fixed",
    top: "-140px",
    left: "-100px",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.14)",
    filter: "blur(80px)",
    pointerEvents: "none"
  },

  bgOrbB: {
    position: "fixed",
    bottom: "-180px",
    right: "-100px",
    width: "460px",
    height: "460px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    filter: "blur(90px)",
    pointerEvents: "none"
  },

  gridNoise: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.05,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
    backgroundSize: "40px 40px"
  },

  shell: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px 16px 48px"
  },

  topRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "18px"
  },

  backLink: {
    ...panelBase,
    display: "inline-flex",
    alignItems: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#111827",
    fontWeight: 600
  },

  productWrap: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
    gap: "20px",
    alignItems: "start"
  },

  imagePanel: {
    ...panelBase,
    borderRadius: "24px",
    padding: "18px"
  },

  productImage: {
    width: "100%",
    maxHeight: "720px",
    objectFit: "cover",
    borderRadius: "18px",
    display: "block",
    background: "#f3f4f6"
  },

  infoPanel: {
    ...panelBase,
    borderRadius: "24px",
    padding: "28px",
    position: "sticky",
    top: "20px"
  },

  microLabel: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
    marginBottom: "12px"
  },

  productTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "clamp(30px, 4vw, 48px)",
    lineHeight: 1.05,
    letterSpacing: "-0.05em"
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "16px",
    marginBottom: "18px"
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "30px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "#f3f4f6",
    color: "#111827",
    fontSize: "12px",
    fontWeight: 700
  },

  clicksText: {
    color: "#6b7280",
    fontSize: "14px"
  },

  description: {
    marginTop: 0,
    marginBottom: "24px",
    color: "#4b5563",
    fontSize: "17px",
    lineHeight: 1.8
  },

  buyBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "18px",
    borderRadius: "18px",
    background: "#f9fafb",
    border: "1px solid rgba(17,24,39,0.06)",
    marginBottom: "18px"
  },

  priceLabel: {
    color: "#6b7280",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
    marginBottom: "6px"
  },

  price: {
    color: "#111827",
    fontSize: "38px",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 1
  },

  buyButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "48px",
    padding: "0 18px",
    borderRadius: "14px",
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 600,
    whiteSpace: "nowrap"
  },

  noLinkText: {
    color: "#6b7280",
    fontWeight: 600
  },

  linkBox: {
    padding: "16px",
    borderRadius: "16px",
    background: "#f9fafb",
    border: "1px solid rgba(17,24,39,0.06)"
  },

  linkLabel: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
    marginBottom: "8px"
  },

  linkText: {
    color: "#374151",
    fontSize: "14px",
    lineHeight: 1.6,
    wordBreak: "break-all"
  },

  loadingCard: {
    ...panelBase,
    borderRadius: "24px",
    padding: "28px",
    maxWidth: "720px",
    margin: "40px auto 0"
  },

  loadingTitle: {
    marginTop: 0,
    marginBottom: "8px",
    color: "#111827",
    fontSize: "32px",
    letterSpacing: "-0.04em"
  },

  loadingText: {
    margin: 0,
    color: "#4b5563",
    lineHeight: 1.6
  }
};
