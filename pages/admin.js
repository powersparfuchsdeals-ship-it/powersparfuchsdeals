import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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
const COMMISSION_RATE = 0.03;

function formatPrice(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

function hoursAgo(dateString) {
  const time = new Date(dateString || Date.now()).getTime();
  return Math.max(0, (Date.now() - time) / 1000 / 60 / 60);
}

function getRevenue(product) {
  return Number(product.price || 0) * Number(product.clicks || 0) * COMMISSION_RATE;
}

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [products, setProducts] = useState([]);
  const [trackingEvents, setTrackingEvents] = useState([]);

  const [gradientA, setGradientA] = useState(SUNSET_GRADIENTS[0]);
  const [gradientB, setGradientB] = useState(SUNSET_GRADIENTS[1]);
  const [showLayerA, setShowLayerA] = useState(true);

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

  useEffect(() => {
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

    document.body.style.background = "#1d3557";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.margin = "0";

    let mounted = true;

    async function boot() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setIsReady(true);
        setIsAllowed(false);
        return;
      }

      const nextSession = data.session ?? null;
      setSession(nextSession);

      if (!nextSession) {
        window.location.href = "/login";
        return;
      }

      const userEmail = (nextSession.user?.email || "").toLowerCase();
      const allowed = !!adminEmail && userEmail === adminEmail;

      setIsAllowed(allowed);
      setIsReady(true);

      if (!allowed) {
        window.location.href = "/";
        return;
      }

      await Promise.all([loadProducts(), loadTracking()]);
    }

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession ?? null);

      if (!nextSession) {
        setIsAllowed(false);
        setIsReady(true);
        window.location.href = "/login";
        return;
      }

      const userEmail = (nextSession.user?.email || "").toLowerCase();
      const allowed = !!adminEmail && userEmail === adminEmail;

      setIsAllowed(allowed);
      setIsReady(true);

      if (!allowed) {
        window.location.href = "/";
        return;
      }

      await Promise.all([loadProducts(), loadTracking()]);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [adminEmail]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLayerA((prevShowLayerA) => {
        const currentIndex = Number(localStorage.getItem("orbital-noir-sunset-index") || 0);
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
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
  }

  async function loadTracking() {
    const { data, error } = await supabase
      .from("tracking_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (!error) setTrackingEvents(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const trackingClickMap = useMemo(() => {
    const map = new Map();

    for (const event of trackingEvents) {
      if (event.type !== "click") continue;
      const key = String(event.product_id || "");
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }

    return map;
  }, [trackingEvents]);

  const todayTrackingClicks = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;

    return trackingEvents.filter(
      (event) =>
        event.type === "click" &&
        new Date(event.created_at || 0).getTime() >= since
    );
  }, [trackingEvents]);

  const dashboardProducts = useMemo(() => {
    return products.map((product) => {
      const trackingClicks = trackingClickMap.get(String(product.id)) || 0;
      const dbClicks = Number(product.clicks || 0);
      const freshness = hoursAgo(product.created_at);

      let score = 0;
      score += dbClicks * 2;
      score += trackingClicks * 3;

      if (String(product.tag || "").toLowerCase() === "featured") score += 220;
      if (String(product.tag || "").toLowerCase() === "preisfehler") score += 320;

      if (freshness < 24) score += 140;
      else if (freshness < 72) score += 80;

      return {
        ...product,
        trackingClicks,
        dbClicks,
        dashboardScore: score,
        estimatedRevenue: getRevenue(product)
      };
    });
  }, [products, trackingClickMap]);

  const topProducts = useMemo(() => {
    return [...dashboardProducts]
      .sort((a, b) => b.dashboardScore - a.dashboardScore)
      .slice(0, 8);
  }, [dashboardProducts]);

  const moneyProducts = useMemo(() => {
    return [...dashboardProducts]
      .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
      .slice(0, 10);
  }, [dashboardProducts]);

  const weakProducts = useMemo(() => {
    return [...dashboardProducts]
      .filter((p) => p.dbClicks === 0 && p.trackingClicks === 0)
      .slice(0, 8);
  }, [dashboardProducts]);

  const trendingToday = useMemo(() => {
    const map = new Map();

    for (const event of todayTrackingClicks) {
      const key = String(event.product_id || "");
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }

    return [...dashboardProducts]
      .map((product) => ({
        ...product,
        todayClicks: map.get(String(product.id)) || 0
      }))
      .filter((product) => product.todayClicks > 0)
      .sort((a, b) => b.todayClicks - a.todayClicks)
      .slice(0, 8);
  }, [dashboardProducts, todayTrackingClicks]);

  const stats = useMemo(() => {
    const totalProducts = products.length;

    const totalDbClicks = products.reduce(
      (sum, product) => sum + Number(product.clicks || 0),
      0
    );

    const totalTrackingClicks = trackingEvents.filter((e) => e.type === "click").length;

    const featuredCount = products.filter(
      (p) => String(p.tag || "").toLowerCase() === "featured"
    ).length;

    const priceErrorCount = products.filter(
      (p) =>
        String(p.tag || "").toLowerCase() === "preisfehler" ||
        String(p.category || "").toLowerCase() === "price-error"
    ).length;

    const estimatedRevenue = products.reduce(
      (sum, product) => sum + getRevenue(product),
      0
    );

    return {
      totalProducts,
      totalDbClicks,
      totalTrackingClicks,
      featuredCount,
      priceErrorCount,
      estimatedRevenue
    };
  }, [products, trackingEvents]);

  if (!isReady) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.gradientLayer, background: gradientA, opacity: showLayerA ? 1 : 0 }} />
        <div style={{ ...styles.gradientLayer, background: gradientB, opacity: showLayerA ? 0 : 1 }} />
        <div style={styles.vignette} />
        <div style={styles.gridNoise} />
        <div style={styles.loadingWrap}>
          <div style={styles.loadingCard}>Admin Dashboard wird geladen…</div>
        </div>
      </div>
    );
  }

  if (!session || !isAllowed) return null;

  return (
    <div style={styles.page}>
      <div style={{ ...styles.gradientLayer, background: gradientA, opacity: showLayerA ? 1 : 0 }} />
      <div style={{ ...styles.gradientLayer, background: gradientB, opacity: showLayerA ? 0 : 1 }} />

      <div style={styles.vignette} />
      <div style={styles.gridNoise} />

      <header style={styles.topbarWrap}>
        <div style={styles.topbar}>
          <a href="/" style={styles.brand}>Orbital-Noir</a>

          <div style={styles.navLinks}>
            <a href="/" style={styles.topLink}>Shop</a>
            <a href="/preisfehler" style={styles.topLink}>Preisfehler</a>
            <button type="button" onClick={logout} style={styles.topButton}>Logout</button>
          </div>
        </div>
      </header>

      <main style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroPanel}>
            <div style={styles.microLabel}>Orbital-Noir / Admin</div>
            <h1 style={styles.heroTitle}>Dashboard im Sunset-Modus.</h1>
            <p style={styles.heroText}>
              Hier siehst du echte Performance-Daten aus Produkten und Tracking-Events:
              Top Performer, Einnahmen-Schätzung, schwache Produkte und aktuelle Trends.
            </p>

            <div style={styles.heroActions}>
              <a href="/" style={styles.ghostBtn}>Zum Shop</a>
              <a href="/preisfehler" style={styles.ghostBtn}>Preisfehler</a>
            </div>
          </div>

          <div style={styles.heroPanel}>
            <div style={styles.frameTop}>
              <span style={styles.statusDot} />
              <span>Live Admin Übersicht</span>
            </div>

            <div style={styles.visualCore}>
              <div style={styles.ringA} />
              <div style={styles.ringB} />
              <div style={styles.ringC} />
              <div style={styles.coreCard}>
                <div style={styles.coreKicker}>Control Center</div>
                <div style={styles.coreTitle}>Products + Tracking</div>
                <div style={styles.coreText}>
                  Ranking, Klicks und geschätzte Affiliate-Einnahmen in einem Dashboard.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Produkte</div>
            <div style={styles.statValue}>{stats.totalProducts}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>DB Klicks</div>
            <div style={styles.statValue}>{stats.totalDbClicks}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Tracking Klicks</div>
            <div style={styles.statValue}>{stats.totalTrackingClicks}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Featured</div>
            <div style={styles.statValue}>{stats.featuredCount}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Preisfehler</div>
            <div style={styles.statValue}>{stats.priceErrorCount}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>geschätzte Einnahmen</div>
            <div style={styles.statValue}>{formatPrice(stats.estimatedRevenue)}</div>
          </div>
        </section>

        <section style={styles.sectionBlock}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.microLabel}>Money</div>
              <h2 style={styles.sectionTitle}>Geschätzte Einnahmen</h2>
            </div>
            <p style={styles.sectionText}>Basierend auf 3% geschätzter Provision.</p>
          </div>

          <div style={styles.list}>
            {moneyProducts.length === 0 ? (
              <div style={styles.emptyMini}>Noch keine Einnahmen-Daten vorhanden.</div>
            ) : (
              moneyProducts.map((product) => (
                <div key={product.id} style={styles.listRow}>
                  <div style={styles.listMain}>
                    <div style={styles.listTitle}>{product.name}</div>
                    <div style={styles.listMeta}>
                      {product.dbClicks} Klicks · {formatPrice(product.price)}
                    </div>
                  </div>

                  <div style={styles.listPrice}>{formatPrice(product.estimatedRevenue)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={styles.sectionBlock}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.microLabel}>Performance</div>
              <h2 style={styles.sectionTitle}>Top Produkte</h2>
            </div>
            <p style={styles.sectionText}>Beste Mischung aus Klicks, Tracking und Frische.</p>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produkt</th>
                  <th style={styles.th}>Preis</th>
                  <th style={styles.th}>DB Klicks</th>
                  <th style={styles.th}>Tracking</th>
                  <th style={styles.th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>{formatPrice(product.price)}</td>
                    <td style={styles.td}>{product.dbClicks}</td>
                    <td style={styles.td}>{product.trackingClicks}</td>
                    <td style={styles.tdStrong}>{product.dashboardScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={styles.gridTwo}>
          <div style={styles.panel}>
            <div style={styles.sectionHeadCompact}>
              <div>
                <div style={styles.microLabel}>Trend</div>
                <h2 style={styles.sectionTitleSmall}>Trending heute</h2>
              </div>
            </div>

            {trendingToday.length === 0 ? (
              <div style={styles.emptyMini}>Noch keine Klicks in den letzten 24 Stunden.</div>
            ) : (
              <div style={styles.list}>
                {trendingToday.map((product) => (
                  <div key={product.id} style={styles.listRow}>
                    <div style={styles.listMain}>
                      <div style={styles.listTitle}>{product.name}</div>
                      <div style={styles.listMeta}>{product.todayClicks} Klicks heute</div>
                    </div>
                    <div style={styles.listPrice}>{formatPrice(product.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.panel}>
            <div style={styles.sectionHeadCompact}>
              <div>
                <div style={styles.microLabel}>Optimierung</div>
                <h2 style={styles.sectionTitleSmall}>Schwache Produkte</h2>
              </div>
            </div>

            {weakProducts.length === 0 ? (
              <div style={styles.emptyMini}>Aktuell keine komplett schwachen Produkte.</div>
            ) : (
              <div style={styles.list}>
                {weakProducts.map((product) => (
                  <div key={product.id} style={styles.listRow}>
                    <div style={styles.listMain}>
                      <div style={styles.listTitle}>{product.name}</div>
                      <div style={styles.listMeta}>Keine Klicks bisher</div>
                    </div>
                    <div style={styles.listPrice}>{formatPrice(product.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
    marginBottom: "26px"
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "26px"
  },
  statCard: {
    ...panelBase,
    borderRadius: "20px",
    padding: "20px"
  },
  statLabel: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "8px",
    fontWeight: 600
  },
  statValue: {
    color: "#111827",
    fontSize: "34px",
    fontWeight: 800,
    letterSpacing: "-0.04em"
  },
  sectionBlock: {
    ...panelBase,
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "24px"
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px"
  },
  sectionHeadCompact: {
    marginBottom: "14px"
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
    letterSpacing: "-0.04em"
  },
  sectionTitleSmall: {
    margin: 0,
    color: "#111827",
    fontSize: "24px",
    letterSpacing: "-0.03em"
  },
  sectionText: {
    margin: 0,
    color: "#4b5563",
    fontSize: "15px"
  },
  tableWrap: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 700
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #f3f4f6",
    color: "#374151",
    fontSize: "14px",
    verticalAlign: "top"
  },
  tdStrong: {
    padding: "14px 10px",
    borderBottom: "1px solid #f3f4f6",
    color: "#111827",
    fontSize: "14px",
    fontWeight: 700,
    verticalAlign: "top"
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "24px"
  },
  panel: {
    ...panelBase,
    borderRadius: "24px",
    padding: "24px"
  },
  emptyMini: {
    color: "#6b7280",
    lineHeight: 1.6
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #f3f4f6"
  },
  listMain: {
    minWidth: 0
  },
  listTitle: {
    color: "#111827",
    fontWeight: 600,
    lineHeight: 1.4
  },
  listMeta: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "4px"
  },
  listPrice: {
    color: "#111827",
    fontWeight: 700,
    whiteSpace: "nowrap"
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
    padding: "24px"
  },
  loadingCard: {
    ...panelBase,
    borderRadius: "20px",
    padding: "20px 24px",
    color: "#111827",
    fontWeight: 600
  }
};
