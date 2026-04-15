import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

export default function Home({ session, authReady }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    setProducts(data || []);
  }

  return (
    <div className="page">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="grid-noise" />
      <Navbar session={session} authReady={authReady} />

      <main className="shell">
        <section className="hero">
          <div className="hero-panel hero-copy">
            <div className="micro-label">Independent Visual System / Orbital Noir</div>
            <h1>Technik wie aus einem verborgenen Zukunftsarchiv.</h1>
            <p>
              Kein gewöhnlicher Shop. Orbital Noir inszeniert Produkte wie seltene Module,
              Prototypen und Präzisionsobjekte. Dunkel, elegant, technisch und eigenständig.
            </p>

            <div className="hero-actions">
              {!session ? (
                <a className="primary-btn" href="/register">Archiv betreten</a>
              ) : (
                <a className="primary-btn" href="/admin">Zum Control Deck</a>
              )}
              <a className="ghost-btn" href="/login">Terminal öffnen</a>
            </div>

            <div className="signal-row">
              <div className="signal-card">
                <div className="signal-label">Module online</div>
                <div className="signal-value">{products.length}</div>
              </div>
              <div className="signal-card">
                <div className="signal-label">Signatur</div>
                <div className="signal-value">Orbital</div>
              </div>
              <div className="signal-card">
                <div className="signal-label">Session</div>
                <div className="signal-value">{authReady ? (session ? 'Aktiv' : 'Gast') : 'Lädt'}</div>
              </div>
            </div>
          </div>

          <div className="hero-panel hero-frame">
            <div className="frame-top">
              <span className="status-dot" />
              <span>Visual Chamber</span>
            </div>

            <div className="visual-core">
              <div className="ring ring-a" />
              <div className="ring ring-b" />
              <div className="ring ring-c" />
              <div className="core-card">
                <div className="core-kicker">Curated Tech Surface</div>
                <div className="core-title">Obsidian Interface</div>
                <div className="core-text">
                  Produkte werden wie Exponate präsentiert, nicht wie Standard-Warenkörbe.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-head">
          <div>
            <div className="micro-label">Collection</div>
            <h2>Aktuelle Module</h2>
          </div>
          <p>Asymmetrische Karten, dunkle Materialien und leuchtende Signale.</p>
        </section>

        <section className="module-grid">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="micro-label">Archiv leer</div>
              <h3>Noch keine Produkte gespeichert</h3>
              <p>Öffne das Control Deck und füge dein erstes Modul hinzu.</p>
              <a className="primary-btn" href="/admin">Erstes Modul anlegen</a>
            </div>
          ) : (
            products.map((p, index) => (
              <article
                key={p.id}
                className={`module-card ${index % 3 === 0 ? 'module-wide' : ''}`}
              >
                <div className="module-media">
                  <img
                    src={p.image || 'https://via.placeholder.com/1200x900?text=Orbital+Noir'}
                    alt={p.name}
                  />
                </div>

                <div className="module-body">
                  <div className="module-meta">
                    <span className="module-chip">Orbital Series</span>
                    <span className="module-index">0{index + 1}</span>
                  </div>

                  <h3>{p.name}</h3>
                  <p>
                    {p.description || 'Präzisionsobjekt mit futuristischer Oberfläche und kuratierter Präsenz.'}
                  </p>

                  <div className="module-footer">
                    <div className="module-price">{p.price} €</div>
                    {p.buy_link ? (
                      <a className="ghost-btn small-btn" href={p.buy_link} target="_blank" rel="noreferrer">
                        Kaufen
                      </a>
                    ) : (
                      <a className="ghost-btn small-btn" href={session ? '/admin' : '/login'}>
                        {session ? 'Verwalten' : 'Öffnen'}
                      </a>
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
