import { useEffect, useMemo, useState } from "react";
import AmazonAutoTransport from "../components/AmazonAutoTransport";

function formatPrice(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

function getRevenue(product) {
  const price = Number(product.price || 0);
  const clicks = Number(product.clicks || 0);
  const commissionRate = Number(product.commission_rate || 0.03);
  return price * clicks * commissionRate;
}

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [sortBy, setSortBy] = useState("clicks");

  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    image: "",
    url: "",
    category: "",
    source: "manual",
  });

  async function loadProducts() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin-products");
      const data = await res.json();

      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
  if (!newProduct.title.trim()) {
    alert("Titel fehlt");
    return;
  }

  if (!newProduct.url.trim()) {
    alert("Produktlink fehlt");
    return;
  }

  try {
    const res = await fetch("/api/admin-add-products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newProduct.title,
        price: newProduct.price,
        image: newProduct.image,
        url: newProduct.url,
        category: newProduct.category || "allgemein",
        source: newProduct.source || "manual",
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.error || "Fehler beim Erstellen");
      return;
    }

    alert("Produkt erfolgreich erstellt ✅");

    // Reset Formular
    setNewProduct({
      title: "",
      price: "",
      image: "",
      url: "",
      category: "",
      source: "manual",
    });

    // Produkte neu laden
    loadProducts();
  } catch (err) {
    console.error(err);
    alert("Server Fehler");
  }
}

  async function deleteProduct(id) {
    if (!confirm("Wirklich löschen?")) return;

    try {
      const res = await fetch("/api/admin-delete-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.error || "Fehler beim Löschen");
        return;
      }

      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Löschen");
    }
  }

  function editProduct(product) {
    setEditingProduct({
      id: product.id,
      title: product.title || product.name || "",
      price: product.price || "",
      image: product.image || "",
      url: product.url || "",
      category: product.category || "",
      source: product.source || "manual",
      asin: product.asin || "",
    });
  }

  async function saveEdit() {
    if (!editingProduct?.id) return;

    setSaving(true);

    try {
      const res = await fetch("/api/admin-update-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingProduct),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.error || "Fehler beim Speichern");
        return;
      }

      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const stats = useMemo(() => {
    return {
      totalProducts: products.length,
      totalClicks: products.reduce((sum, p) => sum + Number(p.clicks || 0), 0),
      estimatedRevenue: products.reduce((sum, p) => sum + getRevenue(p), 0),
    };
  }, [products]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.category || "allgemein"))
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const title = (p.title || p.name || "").toLowerCase();
      const category = p.category || "allgemein";
      const source = p.source || "";

      const text = `${title} ${category} ${source}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "alle" || category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    if (sortBy === "clicks") {
      list.sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0));
    }

    if (sortBy === "revenue") {
      list.sort((a, b) => getRevenue(b) - getRevenue(a));
    }

    if (sortBy === "price") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (sortBy === "title") {
      list.sort((a, b) =>
        String(a.title || a.name || "").localeCompare(
          String(b.title || b.name || "")
        )
      );
    }

    return list;
  }, [filteredProducts, sortBy]);

  if (loading) {
    return <div style={{ padding: 20 }}>Lädt...</div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2>Produkt manuell hinzufügen</h2>

          <input
            placeholder="Titel"
            value={newProduct.title}
            onChange={(e) =>
              setNewProduct({ ...newProduct, title: e.target.value })
            }
            style={styles.input}
          />

          <input
            placeholder="Preis, z.B. 29.99"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            style={styles.input}
          />

          <input
            placeholder="Bild URL"
            value={newProduct.image}
            onChange={(e) =>
              setNewProduct({ ...newProduct, image: e.target.value })
            }
            style={styles.input}
          />

          <input
            placeholder="Produktlink / Affiliate-Link"
            value={newProduct.url}
            onChange={(e) =>
              setNewProduct({ ...newProduct, url: e.target.value })
            }
            style={styles.input}
          />

          <input
            placeholder="Kategorie, z.B. Gaming, Technik, Haushalt"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
            style={styles.input}
          />

          <select
            value={newProduct.source}
            onChange={(e) =>
              setNewProduct({ ...newProduct, source: e.target.value })
            }
            style={styles.input}
          >
            <option value="manual">Manuell</option>
            <option value="amazon">Amazon</option>
            <option value="mediamarkt">MediaMarkt</option>
            <option value="saturn">Saturn</option>
            <option value="otto">OTTO</option>
            <option value="ebay">eBay</option>
            <option value="other">Andere</option>
          </select>

            <button onClick={createProduct} disabled={saving} style={styles.save}>
            {saving ? "Speichert..." : "Produkt hinzufügen"}
          </button>
        </div>

        <div style={styles.card}>
          <AmazonAutoTransport onProductAdded={loadProducts} />
        </div>
      </div>

      <div style={styles.card}>
        <h2>Übersicht</h2>
        <div>Produkte: {stats.totalProducts}</div>
        <div>Klicks: {stats.totalClicks}</div>
        <div>Geschätzter Umsatz: {formatPrice(stats.estimatedRevenue)}</div>
      </div>

      <div style={styles.card}>
        <h2>Produkte verwalten</h2>

        <div style={styles.filters}>
          <input
            placeholder="Suche nach Titel, Kategorie oder Anbieter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.input}
          >
            <option value="alle">Alle Kategorien</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.input}
          >
            <option value="clicks">Nach Klicks</option>
            <option value="revenue">Nach Einnahmen</option>
            <option value="price">Nach Preis</option>
            <option value="title">Nach Titel</option>
          </select>
        </div>

        {sortedProducts.length === 0 ? (
          <p>Keine Produkte gefunden.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produkt</th>
                  <th style={styles.th}>Preis</th>
                  <th style={styles.th}>Klicks</th>
                  <th style={styles.th}>Einnahmen</th>
                  <th style={styles.th}>Kategorie</th>
                  <th style={styles.th}>Anbieter</th>
                  <th style={styles.th}>Aktion</th>
                </tr>
              </thead>

              <tbody>
                {sortedProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={styles.td}>
                      <strong>{p.title || p.name || "Ohne Titel"}</strong>
                      {p.asin && <div style={styles.small}>ASIN: {p.asin}</div>}
                    </td>

                    <td style={styles.td}>{formatPrice(p.price)}</td>
                    <td style={styles.td}>{p.clicks || 0}</td>
                    <td style={styles.td}>{formatPrice(getRevenue(p))}</td>
                    <td style={styles.td}>{p.category || "allgemein"}</td>
                    <td style={styles.td}>{p.source || "manual"}</td>

                    <td style={styles.td}>
                      {p.url && (
                        <>
                          <button
                            onClick={() => window.open(p.url, "_blank")}
                            style={styles.view}
                          >
                            Öffnen
                          </button>

                          <button
                            onClick={() => navigator.clipboard.writeText(p.url)}
                            style={styles.copy}
                          >
                            Link kopieren
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => editProduct(p)}
                        style={styles.edit}
                      >
                        Bearbeiten
                      </button>

                      <button
                        onClick={() => deleteProduct(p.id)}
                        style={styles.delete}
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {false && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h2>Produkt bearbeiten</h2>

            <label style={styles.label}>Titel</label>
            <input
              value={editingProduct.title}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  title: e.target.value,
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>Preis</label>
            <input
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  price: e.target.value,
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>Bild URL</label>
            <input
              value={editingProduct.image}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  image: e.target.value,
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>Produktlink / Affiliate-Link</label>
            <input
              value={editingProduct.url}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  url: e.target.value,
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>Kategorie</label>
            <input
              value={editingProduct.category}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  category: e.target.value,
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>Anbieter</label>
            <select
              value={editingProduct.source}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  source: e.target.value,
                })
              }
              style={styles.input}
            >
              <option value="manual">Manuell</option>
              <option value="amazon">Amazon</option>
              <option value="amazon_auto">Amazon Auto</option>
              <option value="mediamarkt">MediaMarkt</option>
              <option value="saturn">Saturn</option>
              <option value="otto">OTTO</option>
              <option value="ebay">eBay</option>
              <option value="other">Andere</option>
            </select>

            <label style={styles.label}>ASIN nur bei Amazon</label>
            <input
              value={editingProduct.asin}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  asin: e.target.value,
                })
              }
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={styles.save}
              >
                {saving ? "Speichert..." : "Speichern"}
              </button>

              <button
                onClick={() => setEditingProduct(null)}
                style={styles.cancel}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    fontFamily: "sans-serif",
    background: "#f4f4f4",
    minHeight: "100vh",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr 220px 220px",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 6,
    boxSizing: "border-box",
    marginBottom: 10,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    padding: 10,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: 10,
    verticalAlign: "top",
  },
  small: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  view: {
    background: "#0070f3",
    color: "#fff",
    border: "none",
    padding: "7px 10px",
    marginRight: 6,
    marginBottom: 6,
    cursor: "pointer",
    borderRadius: 6,
  },
  copy: {
    background: "#555",
    color: "#fff",
    border: "none",
    padding: "7px 10px",
    marginRight: 6,
    marginBottom: 6,
    cursor: "pointer",
    borderRadius: 6,
  },
  edit: {
    background: "#111",
    color: "#fff",
    border: "none",
    padding: "7px 10px",
    marginRight: 6,
    marginBottom: 6,
    cursor: "pointer",
    borderRadius: 6,
  },
  delete: {
    background: "red",
    color: "#fff",
    border: "none",
    padding: "7px 10px",
    cursor: "pointer",
    borderRadius: 6,
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modalBox: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    width: "90%",
    maxWidth: 520,
  },
  label: {
    display: "block",
    fontSize: 14,
    marginBottom: 5,
    marginTop: 10,
  },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 20,
  },
  save: {
    background: "green",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    cursor: "pointer",
    borderRadius: 6,
  },
  cancel: {
    background: "#777",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    cursor: "pointer",
    borderRadius: 6,
  },
};
