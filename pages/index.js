import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    loadProducts();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
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

            <div className="hero-actions">
              <a className="primary-btn" href="/admin">Zum Admin</a>
              <a className="ghost-btn" href="/register">Konto erstellen</a>
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

        <section className="section-head">
          <div>
            <div className="micro-label">Collection</div>
            <h2>Aktuelle Produkte</h2>
          </div>
          <p>Produkte mit Bild, Beschreibung und direktem Verkaufslink.</p>
        </section>

        <section className="module-grid">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="micro-label">Archiv leer</div>
              <h3>Noch keine Produkte vorhanden</h3>
              <p>Öffne den Adminbereich und füge deine ersten Produkte hinzu.</p>
              <a className="primary-btn" href="/admin">Produkt anlegen</a>
            </div>
          ) : (
            products.map((p, index) => (
              <article
                key={p.id}
                className={`module-card ${index % 3 === 0 ? "module-wide" : ""}`}
              >
                <div className="module-media">
                  <a href={`/product/${p.id}`}>
                    <img
                      src={p.image || "https://via.placeholder.com/1200x900?text=Orbital-Noir"}
                      alt={p.name}
                    />
                  </a>
                </div>

                <div className="module-body">
                  <div className="module-meta">
                    <span className="module-chip">Orbital Drop</span>
                    <span className="module-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3>
                    <a href={`/product/${p.id}`}>{p.name}</a>
                  </h3>

                  <p>{p.description || "Premium Produkt mit eigenständiger Tech-Ästhetik."}</p>

                  <div className="module-footer">
                    <div className="module-price">{p.price} €</div>
                    {p.buy_link ? (
                      <a
                        className="ghost-btn small-btn"
                        href={p.buy_link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Kaufen
                      </a>
                    ) : (
                      <span className="ghost-btn small-btn disabled-btn">Kein Link</span>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
