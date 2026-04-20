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
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("clicks", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }
  }

  const topProducts = products.slice(0, 8);

  async function trackClick(product) {
    if (!product?.id) return;

    await supabase
      .from("products")
      .update({ clicks: (product.clicks || 0) + 1 })
      .eq("id", product.id);
  }

  function ProductCard({ product }) {
    return (
      <article className="shop-card">
        <a className="shop-card-image" href={`/product/${product.id}`}>
          <img
            src={product.image || "https://via.placeholder.com/600x600?text=Orbital-Noir"}
            alt={product.name}
          />
        </a>

        <div className="shop-card-body">
          <h3 className="shop-card-title">
            <a href={`/product/${product.id}`}>{product.name}</a>
          </h3>

          <p className="shop-card-description">
            {product.description || "Technik-Angebot mit direktem Kauf-Link."}
          </p>

          <div className="shop-card-meta">
            <span className="shop-card-badge">
              {(product.clicks || 0) > 10 ? "Beliebt" : "Top Deal"}
            </span>
            <span className="shop-card-clicks">{product.clicks || 0} Klicks</span>
          </div>

          <div className="shop-card-footer">
            <div className="shop-card-price">{product.price} €</div>

            {product.buy_link ? (
              <a
                className="shop-card-button"
                href={product.buy_link}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackClick(product)}
              >
                Zum Angebot
              </a>
            ) : (
              <span className="shop-card-button disabled">Kein Link</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="shop-page">
      <Navbar session={session} />

      <main className="shop-shell">
        <section className="shop-hero">
          <div className="shop-hero-content">
            <span className="shop-label">Orbital-Noir</span>
            <h1>Technik-Angebote direkt entdecken</h1>
            <p>
              Finde ausgewählte Produkte aus den Bereichen TV, Audio, Smartphones
              und Zubehör an einem Ort.
            </p>

            <div className="shop-hero-actions">
              <a className="shop-primary-btn" href="#produkte">
                Jetzt stöbern
              </a>
              <a className="shop-secondary-btn" href="/register">
                Konto erstellen
              </a>
            </div>
          </div>
        </section>

        {topProducts.length > 0 && (
          <section className="shop-section">
            <div className="shop-section-head">
              <div>
                <span className="shop-label">Beliebt</span>
                <h2>Top Produkte</h2>
              </div>
              <p>Die aktuell meistgeklickten Angebote im Shop.</p>
            </div>

            <div className="shop-grid">
              {topProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="shop-section" id="produkte">
          <div className="shop-section-head">
            <div>
              <span className="shop-label">Sortiment</span>
              <h2>Alle Produkte</h2>
            </div>
            <p>Einheitlich, übersichtlich und direkt kaufbar.</p>
          </div>

          {products.length === 0 ? (
            <div className="shop-empty">
              <span className="shop-label">Noch leer</span>
              <h3>Aktuell sind noch keine Produkte vorhanden</h3>
              <p>Importiere Produkte im Adminbereich oder starte den Feed-Sync.</p>
              <a className="shop-primary-btn" href="/admin">
                Zum Adminbereich
              </a>
            </div>
          ) : (
            <div className="shop-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
