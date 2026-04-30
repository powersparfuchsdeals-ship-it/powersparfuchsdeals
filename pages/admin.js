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
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

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
      asin: product.asin || "",
      source: product.source || "",
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
      estimatedRevenue: products.reduce((sum, p) => sum + getRevenue(p), 0),
    };
  }, [products]);

  if (loading) {
    return <div style={{ padding: 20 }}>Lädt...</div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      <div style={styles.section}>
        <AmazonAutoTransport onProductAdded={loadProducts} />
      </div>

      <div style={styles.card}>
        <h2>Übersicht</h2>
        <div>Produkte: {stats.totalProducts}</div>
        <div>Geschätzter Umsatz: {formatPrice(stats.estimatedRevenue)}</div>
      </div>

      <div style={styles.card}>
        <h2>Alle Produkte</h2>

        {products.length === 0 ? (
          <p>Keine Produkte vorhanden.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produkt</th>
                <th style={styles.th}>Preis</th>
                <th style={styles.th}>Klicks</th>
                <th style={styles.th}>Einnahmen</th>
                <th style={styles.th}>Quelle</th>
                <th style={styles.th}>Aktion</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>
                    <strong>{p.title || p.name || "Ohne Titel"}</strong>
                    {p.asin && <div style={styles.small}>ASIN: {p.asin}</div>}
                  </td>

                  <td style={styles.td}>{formatPrice(p.price)}</td>
                  <td style={styles.td}>{p.clicks || 0}</td>
                  <td style={styles.td}>{formatPrice(getRevenue(p))}</td>
                  <td style={styles.td}>{p.source || "manual"}</td>

                  <td style={styles.td}>
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
        )}
      </div>

      {editingProduct && (
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

            <label style={styles.label}>ASIN</label>
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
  section: {
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    padding: 10,
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
  edit: {
    background: "#111",
    color: "#fff",
    border: "none",
    padding: "7px 10px",
    marginRight: 8,
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
  input: {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 6,
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
