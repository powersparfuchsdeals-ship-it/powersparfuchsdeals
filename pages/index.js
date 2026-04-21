import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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

function ProductCard({ p, trackClick }) {
  return (
    <article style={styles.shopCard}>
      <a style={styles.shopCardImage} href={`/product/${p.id}`}>
        <img
          src={p.image || "https://via.placeholder.com/1200x900?text=Orbital-Noir"}
          alt={p.name}
          style={styles.shopCardImageTag}
        />
      </a>

      <div style={styles.shopCardBody}>
        <div style={styles.shopCardMeta}>
          <span style={styles.shopCardBadge}>
            {(p.clicks || 0) > 10 ? "🔥 Beliebt" : "Orbital Drop"}
          </span>
          <span style={styles.shopCardClicks}>{p.clicks || 0} Klicks</span>
        </div>

        <h3 style={styles.shopCardTitle}>
          <a href={`/product/${p.id}`} style={styles.shopCardTitleLink}>
            {p.name}
          </a>
        </h3>

        <p style={styles.shopCardDescription}>
          {p.description || "Premium Produkt mit eigenständiger Tech-Ästhetik."}
        </p>

        <div style={styles.shopCardFooter}>
          <div style={styles.shopCardPrice}>{p.price} €</div>

          {p.buy_link ? (
            <a
              style={styles.shopBuyBtn}
              href={p.buy_link}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick(p)}
            >
              Zum Deal
            </a>
          ) : (
            <span style={styles.shopBuyBtnDisabled}>Kein Link</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [nextColor, setNextColor] = useState(BACKGROUND_COLORS[1]);
  const [autoMode, setAutoMode] = useState(true);

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  const userEmail = (session?.user?.email || "").toLowerCase();
  const isAdmin = !!userEmail && userEmail === adminEmail;

  useEffect(() => {
    loadProducts();

    const savedColor = localStorage.getItem("orbital-noir-bg");
    if (savedColor && BACKGROUND_COLORS.includes(savedColor)) {
      const index = BACKGROUND_COLORS.indexOf(savedColor);
      const nextIndex = (index + 1) % BACKGROUND_COLORS.length;
      setBackgroundColor(savedColor);
      setNextColor(BACKGROUND_COLORS[nextIndex]);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.style.background = `linear-gradient(135deg, ${backgroundColor} 0%, ${nextColor} 100%)`;
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.transition = "background 4s ease-in-out";
    localStorage.setItem("orbital-noir-bg", backgroundColor);
  }, [backgroundColor, nextColor]);

  useEffect(() => {
    if (!autoMode) return;

    const interval = setInterval(() => {
      setBackgroundColor((prev) => {
        const currentIndex = BACKGROUND_COLORS.indexOf(prev);
        const nextIndex = (currentIndex + 1) % BACKGROUND_COLORS.length;
        const afterNextIndex = (nextIndex + 1) % BACKGROUND_COLORS.length;

        setNextColor(BACKGROUND_COLORS[afterNextIndex]);
        return BACKGROUND_COLORS[nextIndex];
      });
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoMode]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("clicks", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }
  }

  async function trackClick(product) {
    await supabase
      .from("products")
      .update({ clicks: (product.clicks || 0) + 1 })
      .eq("id", product.id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const topProducts = useMemo(() => [...products].slice(0, 4), [products]);
  const otherProducts = useMemo(() => [...products].slice(4), [products]);

  return (
    <div style={styles.page}>
      <div style={styles.bgOrbA} />
      <div style={styles.bgOrbB} />
      <div style={styles.gridNoise} />

      <header style={styles.topbarWrap}>
        <div style={styles.topbar}>
          <a href="/" style={styles.brand}>
            Orbital-Noir
          </a>

          <div style={styles.navLinks}>
            {isAdmin ? (
              <a href="/admin" style={styles.topLink}>
                Admin
              </a>
            ) : null}

            {session ? (
              <>
                <a href="/account" style={styles.topLink}>
                  Konto
                </a>
                <button type="button" onClick={handleLogout} style={styles.topButton}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" style={styles.topLink}>
                  Login
                </a>
                <a href="/register" style={styles.topLink}>
                  Register
                </a>
              </>
            )}
          </div>
        </div>

        <div style={styles.paletteRow}>
          {BACKGROUND_COLORS.map((color, index) => (
            <button
              key={color}
              type="button"
              title={`Farbe ${index + 1}`}
              onClick={() => {
                const nextIndex = (index + 1) % BACKGROUND_COLORS.length;
                setBackgroundColor(color);
                setNextColor(BACKGROUND_COLORS[nextIndex]);
                setAutoMode(false);
              }}
              style={{
                ...styles.paletteButton,
                background: `linear-gradient(135deg, ${color}, ${
                  BACKGROUND_COLORS[(index + 1) % BACKGROUND_COLORS.length]
                })`,
                border:
                  backgroundColor === color
                    ? "2px solid #111827"
                    : "1px solid rgba(17,24,39,0.14)",
                boxShadow:
                  backgroundColor === color
                    ? "0 0 0 3px rgba(17,24,39,0.08)"
                    : "none"
              }}
            />
          ))}
        </div>
      </header>

      <main style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroPanel}>
            <div style={styles.microLabel}>Orbital-Noir / Premium Drop</div>
            <h1 style={styles.heroTitle}>Seltene Technik. Dunkel kuratiert. Sofort kaufbar.</h1>
            <p style={styles.heroText}>
              Ein eigenständiger Premium-Tech-Shop mit Adminbereich, Verkaufslinks,
              Login, Register und einem visuellen System fern vom Standard-Shop-Look.
            </p>

            {!session ? (
              <div style={styles.heroActions}>
                <a href="/register" style={styles.ghostBtn}>
                  Konto erstellen
                </a>
              </div>
            ) : null}
          </div>

          <div style={styles.heroPanel}>
            <div style={styles.frameTop}>
              <span style={styles.statusDot} />
              <span>Orbital Catalog Live</span>
            </div>

            <div style={styles.visualCore}>
              <div style={styles.ringA} />
              <div style={styles.ringB} />
              <div style={styles.ringC} />
              <div style={styles.coreCard}>
                <div style={styles.coreKicker}>Independent premium style</div>
                <div style={styles.coreTitle}>No ordinary store</div>
                <div style={styles.coreText}>
                  Orbital-Noir wirkt wie eine futuristische Produktgalerie statt wie ein normaler Shop.
                </div>
              </div>
            </div>
          </div>
        </section>

        {topProducts.length > 0 && (
          <>
            <section style={styles.sectionHead}>
              <div>
                <div style={styles.microLabel}>Trending</div>
                <h2 style={styles.sectionTitle}>Top Produkte</h2>
              </div>
              <p style={styles.sectionText}>Die aktuell meistgeklickten Angebote.</p>
            </section>

            <section style={styles.shopGrid}>
              {topProducts.map((p) => (
                <ProductCard key={p.id} p={p} trackClick={trackClick} />
              ))}
            </section>
          </>
        )}

        <section style={styles.sectionHead}>
          <div>
            <div style={styles.microLabel}>Collection</div>
            <h2 style={styles.sectionTitle}>Aktuelle Produkte</h2>
          </div>
          <p style={styles.sectionText}>Produkte mit Bild, Beschreibung und direktem Verkaufslink.</p>
        </section>

        <section style={styles.shopGrid}>
          {products.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.microLabel}>Archiv leer</div>
              <h3 style={styles.emptyTitle}>Noch keine Produkte vorhanden</h3>
              <p style={styles.emptyText}>
                Öffne den Adminbereich und füge deine ersten Produkte hinzu.
              </p>
              <a href="/admin" style={styles.primaryBtn}>
                Produkt anlegen
              </a>
            </div>
          ) : (
            (otherProducts.length > 0 ? otherProducts : products).map((p) => (
              <ProductCard key={p.id} p={p} trackClick={trackClick} />
            ))
          )}
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

  topbarWrap: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "20px 16px 0"
  },

  topbar: {
    ...panelBase,
    borderRadius: "18px",
    padding: "18px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap"
  },

  brand: {
    color: "#111827",
    textDecoration: "none",
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.03em"
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "22px",
    marginLeft: "auto",
    flexWrap: "wrap"
  },

  topLink: {
    color: "#111827",
    textDecoration: "none",
    fontSize: "18px",
    fontWeight: 500,
    lineHeight: 1.2
  },

  topButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    color: "#111827",
    fontSize: "18px",
    fontWeight: 500,
    cursor: "pointer",
    lineHeight: 1.2
  },

  paletteRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "16px",
    flexWrap: "wrap"
  },

  paletteButton: {
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    cursor: "pointer"
  },

  shell: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px 16px 48px"
  },

  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "34px"
  },

  heroPanel: {
    ...panelBase,
    borderRadius: "24px",
    padding: "28px"
  },

  microLabel: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
    marginBottom: "12px"
  },

  heroTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "clamp(32px, 4vw, 54px)",
    lineHeight: 1.02,
    letterSpacing: "-0.05em"
  },

  heroText: {
    marginTop: "16px",
    marginBottom: 0,
    color: "#4b5563",
    fontSize: "17px",
    lineHeight: 1.65,
    maxWidth: "56ch"
  },

  heroActions: {
    display: "flex",
    gap: "12px",
    marginTop: "22px",
    flexWrap: "wrap"
  },

  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid rgba(17,24,39,0.12)",
    fontWeight: 600
  },

  frameTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#4b5563",
    fontSize: "14px",
    marginBottom: "20px"
  },

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#111827",
    display: "inline-block"
  },

  visualCore: {
    position: "relative",
    height: "320px",
    borderRadius: "22px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(243,244,246,0.94))",
    overflow: "hidden",
    border: "1px solid rgba(17,24,39,0.06)"
  },

  ringA: {
    position: "absolute",
    inset: "40px",
    borderRadius: "999px",
    border: "1px solid rgba(17,24,39,0.12)"
  },

  ringB: {
    position: "absolute",
    inset: "72px",
    borderRadius: "999px",
    border: "1px solid rgba(17,24,39,0.1)"
  },

  ringC: {
    position: "absolute",
    inset: "104px",
    borderRadius: "999px",
    border: "1px solid rgba(17,24,39,0.08)"
  },

  coreCard: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(84%, 320px)",
    borderRadius: "18px",
    padding: "20px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(17,24,39,0.08)",
    boxShadow: "0 18px 60px rgba(17,24,39,0.08)",
    textAlign: "center"
  },

  coreKicker: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "8px",
    fontWeight: 700
  },

  coreTitle: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    marginBottom: "10px"
  },

  coreText: {
    color: "#4b5563",
    fontSize: "15px",
    lineHeight: 1.6
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px"
  },

  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
    letterSpacing: "-0.04em"
  },

  sectionText: {
    margin: 0,
    color: "#4b5563",
    fontSize: "15px"
  },

  shopGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
    marginBottom: "34px"
  },

  shopCard: {
    ...panelBase,
    borderRadius: "20px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },

  shopCardImage: {
    display: "block",
    aspectRatio: "4 / 3",
    background: "#f3f4f6"
  },

  shopCardImageTag: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  shopCardBody: {
    padding: "18px"
  },

  shopCardMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px"
  },

  shopCardBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#f3f4f6",
    color: "#111827",
    fontSize: "12px",
    fontWeight: 700
  },

  shopCardClicks: {
    color: "#6b7280",
    fontSize: "13px"
  },

  shopCardTitle: {
    margin: 0,
    fontSize: "20px",
    lineHeight: 1.2,
    letterSpacing: "-0.03em"
  },

  shopCardTitleLink: {
    color: "#111827",
    textDecoration: "none"
  },

  shopCardDescription: {
    marginTop: "10px",
    marginBottom: "16px",
    color: "#4b5563",
    fontSize: "15px",
    lineHeight: 1.6
  },

  shopCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },

  shopCardPrice: {
    color: "#111827",
    fontWeight: 700,
    fontSize: "22px",
    letterSpacing: "-0.03em"
  },

  shopBuyBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 14px",
    borderRadius: "12px",
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 600
  },

  shopBuyBtnDisabled: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 14px",
    borderRadius: "12px",
    background: "#e5e7eb",
    color: "#6b7280",
    fontWeight: 600
  },

  emptyState: {
    ...panelBase,
    borderRadius: "22px",
    padding: "28px",
    textAlign: "left"
  },

  emptyTitle: {
    marginTop: 0,
    marginBottom: "8px",
    color: "#111827",
    fontSize: "28px",
    letterSpacing: "-0.04em"
  },

  emptyText: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#4b5563",
    lineHeight: 1.6
  },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 600
  }
};
