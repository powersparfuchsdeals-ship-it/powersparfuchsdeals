import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

const BACKGROUND_COLORS = [
  "#0f0f10",
  "#151922",
  "#1b1f3b",
  "#102a43",
  "#1f2937",
  "#2d1b36",
  "#0f3d2e",
  "#3b2f1f",
  "#3a3a3a",
  "#1e293b"
];

function ProductCard({ p, trackClick }) {
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
            {(p.clicks || 0) > 10 ? "🔥 Beliebt" : "Orbital Drop"}
          </span>
          <span className="shop-card-clicks">{p.clicks || 0} Klicks</span>
        </div>

        <h3 className="shop-card-title">
          <a href={`/product/${p.id}`}>{p.name}</a>
        </h3>

        <p className="shop-card-description">
          {p.description || "Premium Produkt mit eigenständiger Tech-Ästhetik."}
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
              Zum Deal
            </a>
          ) : (
            <span className="shop-buy-btn disabled">Kein Link</span>
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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.style.background = `linear-gradient(135deg, ${backgroundColor}, ${nextColor})`;
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

  const topProducts = [...products].slice(0, 4);
  const otherProducts = [...products].slice(4);

  async function trackClick(product) {
    await supabase
      .from("products")
      .update({ clicks: (product.clicks || 0) + 1 })
      .eq("id", product.id);
  }

  return (
    <div className="page">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="grid-noise" />
      <Navbar session={session} />

      <main className="shell">
        <section className="hero">
          <div className="hero-panel hero-copy">
            <div className="micro-label">Orbital-Noir / Premium Drop</div>
            <h1>Seltene Technik. Dunkel kuratiert. Sofort kaufbar.</h1>
            <p>
              Ein eigenständiger Premium-Tech-Shop mit Adminbereich, Verkaufslinks,
              Login, Register und einem visuellen System fern vom Standard-Shop-Look.
            </p>

            <div className="hero-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a className="ghost-btn" href="/register">
                Konto erstellen
              </a>
            </div>

            <div style={{ marginTop: "22px" }}>
              <div
                style={{
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.82,
                  marginBottom: "10px"
                }}
              >
                Hintergrund
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 40px)",
                  gap: "10px"
                }}
              >
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
                      width: "40px",
                      height: "40px",
                      borderRadius: "999px",
                      background: `linear-gradient(135deg, ${color}, ${BACKGROUND_COLORS[(index + 1) % BACKGROUND_COLORS.length]})`,
                      cursor: "pointer",
                      border:
                        backgroundColor === color
                          ? "2px solid #ffffff"
                          : "1px solid rgba(255,255,255,0.25)",
                      boxShadow:
                        backgroundColor === color
                          ? "0 0 0 3px rgba(255,255,255,0.15)"
                          : "none"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hero-panel hero-frame">
            <div className="frame-top">
              <span className="status-dot" />
              <span>Orbital Catalog Live</span>
            </div>

            <div className="visual-core">
              <div className="ring ring-a" />
              <div className="ring ring-b" />
              <div className="ring ring-c" />
              <div className="core-card">
                <div className="core-kicker">Independent premium style</div>
                <div className="core-title">No ordinary store</div>
                <div className="core-text">
                  Orbital-Noir wirkt wie eine futuristische Produktgalerie statt wie ein normaler Shop.
                </div>
              </div>
            </div>
          </div>
        </section>

        {topProducts.length > 0 && (
          <>
            <section className="section-head">
              <div>
                <div className="micro-label">Trending</div>
                <h2>Top Produkte</h2>
              </div>
              <p>Die aktuell meistgeklickten Angebote.</p>
            </section>

            <section className="shop-grid">
              {topProducts.map((p) => (
                <ProductCard key={p.id} p={p} trackClick={trackClick} />
              ))}
            </section>
          </>
        )}

        <section className="section-head">
          <div>
            <div className="micro-label">Collection</div>
            <h2>Aktuelle Produkte</h2>
          </div>
          <p>Produkte mit Bild, Beschreibung und direktem Verkaufslink.</p>
        </section>

        <section className="shop-grid">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="micro-label">Archiv leer</div>
              <h3>Noch keine Produkte vorhanden</h3>
              <p>Öffne den Adminbereich und füge deine ersten Produkte hinzu.</p>
              <a className="primary-btn" href="/admin">
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
