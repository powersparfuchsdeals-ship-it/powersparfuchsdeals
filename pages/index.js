import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

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

            <div className="hero-actions">
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
              <a className="primary-btn" href="/admin">Produkt anlegen</a>
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
