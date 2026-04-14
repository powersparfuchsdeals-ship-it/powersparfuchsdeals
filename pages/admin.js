import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin({ session, authReady }) {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (authReady && !session) {
      location.href = '/login';
      return;
    }
    if (authReady && session) {
      loadProducts();
    }
  }, [authReady, session]);

  async function loadProducts() {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setProducts(data || []);
    }
    setLoadingProducts(false);
  }

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function saveProduct() {
    if (!session?.user) return setMessage('Bitte erst einloggen.');
    if (!name || !price) return setMessage('Bitte Name und Preis ausfüllen.');

    setSaving(true);
    setMessage('');

    let imageUrl = null;

    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      const upload = await supabase.storage.from('images').upload(fileName, file);

      if (upload.error) {
        setMessage(upload.error.message);
        setSaving(false);
        return;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    if (editingId) {
      const updatePayload = { name, price, description };
      if (imageUrl) updatePayload.image = imageUrl;

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', editingId);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage('Produkt erfolgreich aktualisiert.');
    } else {
      const { error } = await supabase
        .from('products')
        .insert([{
          name,
          price,
          description,
          image: imageUrl,
          user_id: session.user.id
        }]);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage('Produkt erfolgreich erstellt.');
    }

    resetForm();
    await loadProducts();
    setSaving(false);
  }

  async function deleteProduct(id) {
    const ok = window.confirm('Dieses Produkt wirklich löschen?');
    if (!ok) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setMessage(error.message);
      return;
    }

    if (editingId === id) resetForm();
    setMessage('Produkt gelöscht.');
    await loadProducts();
  }

  function editProduct(product) {
    setEditingId(product.id);
    setName(product.name || '');
    setPrice(product.price || '');
    setDescription(product.description || '');
    setPreview(product.image || null);
    setFile(null);
    setMessage('Bearbeitungsmodus aktiv.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setFile(null);
    setPreview(null);
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.description, String(p.price)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const withImages = products.filter((p) => !!p.image).length;
    const totalValue = products.reduce((sum, p) => sum + Number(p.price || 0), 0);
    return { total, withImages, totalValue };
  }, [products]);

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-panel wide-panel">
          <div className="micro-label">Control Deck</div>
          <h1>Zugriff wird geprüft</h1>
          <p>Bitte einen Moment warten …</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="admin-pro-page">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="grid-noise" />

      <div className="shell admin-shell">
        <div className="admin-header panel-pro">
          <div>
            <div className="micro-label">Orbital Noir / Control Deck</div>
            <h1 className="admin-title">Admin Pro Dashboard</h1>
            <p className="admin-subtitle">
              Produkte verwalten, Bilder prüfen und dein Archiv professionell steuern.
            </p>
          </div>

          <div className="admin-top-actions">
            <a className="ghost-btn" href="/">Zum Shop</a>
            <button className="primary-btn" onClick={resetForm}>Neues Produkt</button>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card panel-pro">
            <span className="admin-stat-label">Produkte</span>
            <strong className="admin-stat-value">{stats.total}</strong>
          </div>
          <div className="admin-stat-card panel-pro">
            <span className="admin-stat-label">Mit Bild</span>
            <strong className="admin-stat-value">{stats.withImages}</strong>
          </div>
          <div className="admin-stat-card panel-pro">
            <span className="admin-stat-label">Gesamtwert</span>
            <strong className="admin-stat-value">{stats.totalValue.toFixed(2)} €</strong>
          </div>
        </div>

        <div className="admin-layout">
          <section className="panel-pro admin-form-panel">
            <div className="admin-panel-head">
              <div>
                <div className="micro-label">{editingId ? 'Bearbeiten' : 'Neues Produkt'}</div>
                <h2>{editingId ? 'Produkt aktualisieren' : 'Produkt anlegen'}</h2>
              </div>
              {editingId ? (
                <button className="ghost-btn" onClick={resetForm}>Abbrechen</button>
              ) : null}
            </div>

            <div className="admin-form-grid">
              <input className="field" placeholder="Produktname" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="field" placeholder="Preis in Euro" value={price} onChange={(e) => setPrice(e.target.value)} />
              <textarea className="field field-area" placeholder="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} />
              <input className="field field-file" type="file" onChange={handleFile} />

              {preview ? (
                <div className="admin-preview-card">
                  <div className="admin-preview-label">Vorschau</div>
                  <img src={preview} alt="Vorschau" className="admin-preview-image" />
                </div>
              ) : (
                <div className="admin-preview-empty">Noch kein Bild ausgewählt</div>
              )}

              <button className="primary-btn admin-save-btn" onClick={saveProduct} disabled={saving}>
                {saving ? 'Speichert …' : editingId ? 'Änderungen speichern' : 'Produkt erstellen'}
              </button>

              {message ? <p className="auth-info">{message}</p> : null}
            </div>
          </section>

          <section className="panel-pro admin-list-panel">
            <div className="admin-panel-head">
              <div>
                <div className="micro-label">Archivübersicht</div>
                <h2>Produkte</h2>
              </div>
              <input className="field admin-search" placeholder="Suchen …" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="admin-list-wrap">
              {loadingProducts ? (
                <div className="admin-empty">Produkte werden geladen …</div>
              ) : filteredProducts.length === 0 ? (
                <div className="admin-empty">Keine Produkte gefunden.</div>
              ) : (
                filteredProducts.map((product) => (
                  <article key={product.id} className="admin-product-card">
                    <div className="admin-product-media">
                      <img src={product.image || 'https://via.placeholder.com/800x600?text=Produkt'} alt={product.name} />
                    </div>

                    <div className="admin-product-body">
                      <div className="admin-product-top">
                        <div>
                          <h3>{product.name}</h3>
                          <p>{product.description || 'Keine Beschreibung hinterlegt.'}</p>
                        </div>
                        <strong className="admin-product-price">{product.price} €</strong>
                      </div>

                      <div className="admin-product-actions">
                        <button className="ghost-btn" onClick={() => editProduct(product)}>Bearbeiten</button>
                        <button className="danger-btn" onClick={() => deleteProduct(product.id)}>Löschen</button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
