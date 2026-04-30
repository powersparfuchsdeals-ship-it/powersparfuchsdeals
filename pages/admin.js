import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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

  async function loadProducts() {
    try {
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
        alert("Fehler beim Löschen");
        return;
      }

      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Löschen");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const stats = useMemo(() => {
    return {
      totalProducts: products.length,
      estimatedRevenue: products.reduce(
        (sum, p) => sum + getRevenue(p),
        0
      ),
    };
  }, [products]);

  if (loading) {
    return <div style={{ padding: 20 }}>Lädt...</div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin</h1>

      <div style={styles.card}>
        <div>Produkte: {stats.totalProducts}</div>
        <div>Umsatz: {formatPrice(stats.estimatedRevenue)}</div>
      </div>

      <div style={styles.card}>
        <h2>Alle Produkte</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Preis</th>
              <th>Klicks</th>
              <th>Einnahmen</th>
              <th>Aktion</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{formatPrice(p.price)}</td>
                <td>{p.clicks || 0}</td>
                <td>{formatPrice(getRevenue(p))}</td>
                <td>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    style={styles.delete}
                  >
                    Löschen
                  </button>

                  <button
                    onClick={() => alert("Edit kommt")}
                    style={styles.edit}
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  delete: {
    background: "red",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    marginRight: 8,
    cursor: "pointer",
  },
  edit: {
    background: "#111",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    cursor: "pointer",
  },
};
