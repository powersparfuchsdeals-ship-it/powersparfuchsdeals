import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

const SUNSET_GRADIENTS = [
  "linear-gradient(180deg, #fff7c2 0%, #ffe08a 100%)",
  "linear-gradient(180deg, #ffe9a8 0%, #ffd166 100%)",
  "linear-gradient(180deg, #ffd97a 0%, #ffbf69 100%)",
  "linear-gradient(180deg, #ffc46b 0%, #ff9f1c 100%)",
  "linear-gradient(180deg, #ffad5a 0%, #f77f00 100%)",
  "linear-gradient(180deg, #f77f00 0%, #e76f51 100%)",
  "linear-gradient(180deg, #e76f51 0%, #b56576 100%)",
  "linear-gradient(180deg, #b56576 0%, #6d597a 100%)",
  "linear-gradient(180deg, #6d597a 0%, #355070 100%)",
  "linear-gradient(180deg, #355070 0%, #1d3557 100%)",
  "linear-gradient(180deg, #6d597a 0%, #5e548e 100%)",
  "linear-gradient(180deg, #b56576 0%, #ffb4a2 100%)",
  "linear-gradient(180deg, #ffd166 0%, #fff7c2 100%)"
];

const STEP_DURATION_MS = 5 * 60 * 1000;

export default function PreisfehlerPage() {
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null);
  const [gradientA, setGradientA] = useState(SUNSET_GRADIENTS[0]);
  const [gradientB, setGradientB] = useState(SUNSET_GRADIENTS[1]);
  const [showLayerA, setShowLayerA] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [message, setMessage] = useState("");

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  const userEmail = (session?.user?.email || "").toLowerCase();
  const isAdmin = !!userEmail && userEmail === adminEmail;

  useEffect(() => {
    loadProducts();

    const savedIndex = Number(localStorage.getItem("orbital-noir-sunset-index") || 0);
    if (
      Number.isFinite(savedIndex) &&
      savedIndex >= 0 &&
      savedIndex < SUNSET_GRADIENTS.length
    ) {
      const nextIndex = (savedIndex + 1) % SUNSET_GRADIENTS.length;
      setGradientA(SUNSET_GRADIENTS[savedIndex]);
      setGradientB(SUNSET_GRADIENTS[nextIndex]);
      setShowLayerA(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
  }, []);

  useEffect(() => {
    document.body.style.background = "#1d3557";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.margin = "0";
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLayerA((prevShowLayerA) => {
        const currentIndex = Number(
          localStorage.getItem("orbital-noir-sunset-index") || 0
        );
        const nextIndex = (currentIndex + 1) % SUNSET_GRADIENTS.length;
        const afterNextIndex = (nextIndex + 1) % SUNSET_GRADIENTS.length;

        if (prevShowLayerA) {
          setGradientB(SUNSET_GRADIENTS[afterNextIndex]);
        } else {
          setGradientA(SUNSET_GRADIENTS[afterNextIndex]);
        }

        localStorage.setItem("orbital-noir-sunset-index", String(nextIndex));
        return !prevShowLayerA;
      });
    }, STEP_DURATION_MS);

    return () => clearInterval(interval);
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or("category.eq.price-error,tag.eq.preisfehler")
      .order("price", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }
  }

  async function trackClick(product) {
    await supabase
      .from("products")
      .update({ clicks: Number(product.clicks || 0) + 1 })
      .eq("id", product.id);
  }

  async function runImport() {
    setImportLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/import-preisfehler", {
        method: "POST"
      });

      const data = await res.json();

      if (data?.ok) {
        setMessage(
          `Import fertig: ${data.created || 0} neu, ${data.updated || 0} aktualisiert, ${data.skipped || 0} übersprungen.`
        );
        await loadProducts();
      } else {
        setMessage(data?.error || "Import fehlgeschlagen.");
      }
    } catch {
      setMessage("Import fehlgeschlagen.");
    } finally {
      setImportLoading(false);
    }
  }

  const countText = useMemo(() => `${products.length} Treffer`, [products]);

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.gradientLayer,
          background: gradientA,
          opacity: showLayerA ? 1 : 0
        }}
      />
      <div
        style={{
          ...styles.gradientLayer,
          background: gradientB,
          opacity: showLayerA ? 0 : 1
        }}
      />

      <div style={styles.vignette} />
      <div style={styles.gridNoise} />

      <header style={styles.topbarWrap}>
        <div style={styles.topbar}>
          <a href="/" style={styles.brand}>
            Orbital-Noir
          </a>

          <div style={styles.navLinks}>
            <a href="/" style={styles.topLink}>
              Shop
            </a>
            {isAdmin ? (
              <a href="/admin" style={styles.topLink}>
                Admin
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroPanel}>
            <div style={styles.microLabel}>Orbital-Noir / Preisfehler</div>
            <h1 style={styles.heroTitle}>Preisfehler & starke Schnäppchen.</h1>
            <p style={styles.heroText}>
              Hier erscheinen nur auffällige Deals und besonders günstige Kandidaten.
            </p>

            <div style={styles.heroActions}>
              <a href="/" style={styles.ghostBtn}>
                Zum Shop
              </a>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={runImport}
                  disabled={importLoading}
                  style={styles.primaryBtn}
                >
                  {importLoading ? "Import läuft..." : "Preisfehler importieren"}
                </button>
              ) : null}
            </div>

            {message ? <div style={styles.messageBox}>{message}</div> : null}
          </div>

          <div style={styles.heroPanel}>
            <div style={styles.frameTop}>
              <span style={styles.statusDot} />
              <span>Live Preisfehler-Liste</span>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.coreKicker}>Aktuell</div>
              <div style={styles.coreTitle}>{countText}</div>
              <div style={styles.coreText}>
                Sortiert nach Preis und Aktualität.
              </div>
            </div>
          </div>
        </section>

        <section style={styles.sectionHead}>
          <div>
            <div style={styles.microLabel}>Collection</div>
            <h2 style={styles.sectionTitle}>Preisfehler-Kandidaten</h2>
          </div>
          <p style={styles.sectionText}>{countText}</p>
        </section>

        <section style={styles.shopGrid}>
          {products.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.microLabel}>Noch leer</div>
              <h3 style={styles.emptyTitle}>Keine Preisfehler gefunden</h3>
              <p style={styles.emptyText}>
                Starte den Import im Admin oder über den Button oben.
              </p>
            </div>
          ) : (
            products.map((p) => (
              <ProductCard key={p.id} p={p} trackClick={trackClick} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

const panelBase = {
  background: "rgba(255,255,255,0.88)",
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

  gradientLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    transition: `opacity ${STEP_DURATION_MS}ms linear`,
    willChange: "opacity",
    pointerEvents: "none"
  },

  vignette: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 1,
    background:
      "radial-gradient(circle at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.45) 100%)",
    mixBlendMode: "multiply"
  },

  gridNoise: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.03,
    zIndex: 1,
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
    border: "none",
    fontWeight: 600,
    cursor: "pointer"
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

  messageBox: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    color: "#111827"
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

  infoCard: {
    borderRadius: "22px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,244,246,0.96))",
    overflow: "hidden",
    border: "1px solid rgba(17,24,39,0.06)",
    padding: "28px"
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
    fontSize: "32px",
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
  }
};
