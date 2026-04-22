import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import TopDealsSection from "../components/TopDealsSection";

const SUNSET_COLORS = [
  "#ffe082", // hellgelb
  "#ffd54f", // goldgelb
  "#ffca28", // sattes gelb
  "#ffb74d", // warmes orange
  "#ff9800", // orange
  "#f57c00", // dunkelorange
  "#e65100", // kupfer
  "#8d6e63", // warmes braun
  "#6d4c41", // braunrot
  "#5e35b1", // abendviolett
  "#3949ab", // tiefes blauviolett
  "#1a237e"  // nachtblau
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "tv", label: "TV" },
  { value: "smartphone", label: "Smartphones" },
  { value: "audio", label: "Audio" },
  { value: "laptop", label: "Laptops" },
  { value: "monitor", label: "Monitore" },
  { value: "pc", label: "PC Zubehör" },
  { value: "gaming", label: "Gaming" },
  { value: "smarthome", label: "Smart Home" },
  { value: "network", label: "Netzwerk" },
  { value: "storage", label: "Storage" },
  { value: "office", label: "Office" },
  { value: "wearable", label: "Wearables" },
  { value: "camera", label: "Kamera" },
  { value: "price-error", label: "Preisfehler" }
];

function getProductScore(product) {
  let score = 0;

  const clicks = Number(product.clicks || 0);
  const price = Number(product.price || 0);
  const tag = String(product.tag || "").toLowerCase();

  score += Math.min(clicks, 100) * 2;

  if (tag === "featured") score += 200;
  if (tag === "preisfehler") score += 300;

  if (price > 20 && price < 300) score += 80;
  if (price > 0 && price < 10) score += 40;

  const created = new Date(product.created_at || Date.now());
  const ageHours = (Date.now() - created.getTime()) / 1000 / 60 / 60;
  if (ageHours < 24) score += 120;
  if (ageHours < 72) score += 60;

  return score;
}

function hexToRgb(hex) {
  const value = String(hex || "#000000").replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  const int = parseInt(normalized, 16);

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function mixColor(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}

function rgbToCss(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);

  const animationFrameRef = useRef(null);
  const gradientStartRef = useRef(null);
  const manualOffsetRef = useRef(0);

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  const userEmail = (session?.user?.email || "").toLowerCase();
  const isAdmin = !!userEmail && userEmail === adminEmail;

  useEffect(() => {
    loadProducts();

    const savedIndex = Number(localStorage.getItem("orbital-noir-sunset-index") || 0);
    if (
      Number.isFinite(savedIndex) &&
      savedIndex >= 0 &&
      savedIndex < SUNSET_COLORS.length
    ) {
      manualOffsetRef.current = savedIndex * 12000;
      setActivePaletteIndex(savedIndex);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const STEP_DURATION = 12000;

    function animate(timestamp) {
      if (!gradientStartRef.current) {
        gradientStartRef.current = timestamp;
      }

      const elapsed = manualOffsetRef.current + (timestamp - gradientStartRef.current);
      const totalSteps = SUNSET_COLORS.length;

      const rawStep = elapsed / STEP_DURATION;
      const currentStep = Math.floor(rawStep) % totalSteps;
      const progress = rawStep % 1;
      const t = easeInOut(progress);

      const indexA1 = currentStep % totalSteps;
      const indexA2 = (currentStep + 1) % totalSteps;
      const indexB1 = (currentStep + 2) % totalSteps;
      const indexB2 = (currentStep + 3) % totalSteps;

      const colorA1 = hexToRgb(SUNSET_COLORS[indexA1]);
      const colorA2 = hexToRgb(SUNSET_COLORS[indexA2]);
      const colorB1 = hexToRgb(SUNSET_COLORS[indexB1]);
      const colorB2 = hexToRgb(SUNSET_COLORS[indexB2]);

      const mixedA = mixColor(colorA1, colorA2, t);
      const mixedB = mixColor(colorB1, colorB2, t);

      document.body.style.background = `linear-gradient(180deg, ${rgbToCss(
        mixedA
      )} 0%, ${rgbToCss(mixedB)} 100%)`;
      document.body.style.backgroundAttachment = "fixed";

      if (activePaletteIndex !== indexA1) {
        setActivePaletteIndex(indexA1);
        localStorage.setItem("orbital-noir-sunset-index", String(indexA1));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    gradientStartRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activePaletteIndex]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
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

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        [p.name, p.description, p.category, p.import_query, p.tag]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      const matchesCategory =
        category === "all" || String(p.category || "").toLowerCase() === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts]
      .map((p) => ({ ...p, score: getProductScore(p) }))
      .sort((a, b) => b.score - a.score);
  }, [filteredProducts]);

  const topDealProducts = useMemo(() => {
    return [...products]
      .map((p) => ({ ...p, score: getProductScore(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [products]);

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
            <a href="/preisfehler" style={styles.topLink}>
              Preisfehler
            </a>

            {isAdmin ? (
              <a href="/admin" style={styles.topLink}>
                Admin
              </a>
            ) : null}

            {session ? (
              <>
                <button type="button" onClick={logout} style={styles.topButton}>
                  Logout
                </button>
                <a href="/admin" style={styles.topLinkSecondary}>
                  Konto
                </a>
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
          {SUNSET_COLORS.map((color, index) => (
            <button
              key={color}
              type="button"
              title={`Sunset ${index + 1}`}
              onClick={() => {
                manualOffsetRef.current = index * 12000;
                gradientStartRef.current = null;
                setActivePaletteIndex(index);
                localStorage.setItem("orbital-noir-sunset-index", String(index));
              }}
              style={{
                ...styles.paletteButton,
                background: `linear-gradient(180deg, ${color}, ${
                  SUNSET_COLORS[(index + 1) % SUNSET_COLORS.length]
                })`,
                border:
                  activePaletteIndex === index
                    ? "2px solid #111827"
                    : "1px solid rgba(17,24,39,0.14)",
                boxShadow:
                  activePaletteIndex === index
                    ? "0 0 0 3px rgba(17,24,39,0.08)"
                    : "none"
              }}
            />
          ))}
        </div>
      </header>

      <main style={styles.shell}>
        <section style={styles.filterWrap}>
          <div style={styles.filterHead}>
            <div>
              <div style={styles.microLabel}>Filter</div>
              <h2 style={styles.sectionTitle}>Produkte finden</h2>
            </div>
            <p style={styles.sectionText}>Suche nach Kategorie, Produkt oder Schlagwort.</p>
          </div>

          <div style={styles.filterBar}>
            <input
              type="text"
              placeholder="Suche nach Produkt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.categoryPills}>
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                style={category === option.value ? styles.pillActive : styles.pill}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section style={styles.hero}>
          <div style={styles.heroPanel}>
            <div style={styles.microLabel}>Orbital-Noir / Sunset Deals</div>
            <h1 style={styles.heroTitle}>Tech Deals im warmen Sunset-Look.</h1>
            <p style={styles.heroText}>
              Ein langsamer, fließender Hintergrund wie ein Sonnenuntergang:
              von hellem Gelb über Gold und Orange bis tief ins Abendblau.
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
              <span>Sunset Flow aktiv</span>
            </div>

            <div style={styles.visualCore}>
              <div style={styles.ringA} />
              <div style={styles.ringB} />
              <div style={styles.ringC} />
              <div style={styles.coreCard}>
                <div style={styles.coreKicker}>Slow transition</div>
                <div style={styles.coreTitle}>Golden Hour UI</div>
                <div style={styles.coreText}>
                  Sanft gleitende Farbverläufe statt harter Farbwechsel – wie Sonne, die langsam untergeht.
                </div>
              </div>
            </div>
          </div>
        </section>

        <TopDealsSection products={topDealProducts} trackClick={trackClick} />

        <section style={styles.sectionHead}>
          <div>
            <div style={styles.microLabel}>Collection</div>
            <h2 style={styles.sectionTitle}>Aktuelle Produkte</h2>
          </div>
          <p style={styles.sectionText}>{sortedProducts.length} Produkte gefunden.</p>
        </section>

        <section style={styles.shopGrid}>
          {sortedProducts.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.microLabel}>Keine Treffer</div>
              <h3 style={styles.emptyTitle}>Keine Produkte gefunden</h3>
              <p style={styles.emptyText}>
                Versuche eine andere Suche oder wähle eine andere Kategorie.
              </p>
            </div>
          ) : (
            sortedProducts.map((p) => (
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

  bgOrbA: {
    position: "fixed",
    top: "-140px",
    left: "-100px",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.18)",
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
    opacity: 0.04,
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

  topLinkSecondary: {
    color: "#6b7280",
    textDecoration: "none",
    fontSize: "15px",
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

  filterWrap: {
    ...panelBase,
    borderRadius: "22px",
    padding: "22px",
    marginBottom: "26px"
  },

  filterHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px"
  },

  filterBar: {
    display: "grid",
    gridTemplateColumns: "1.3fr 220px",
    gap: "12px",
    marginBottom: "14px"
  },

  searchInput: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827"
  },

  select: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827"
  },

  categoryPills: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  pill: {
    minHeight: "36px",
    padding: "0 12px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 500
  },

  pillActive: {
    minHeight: "36px",
    padding: "0 12px",
    borderRadius: "999px",
    border: "1px solid #111827",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600
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
