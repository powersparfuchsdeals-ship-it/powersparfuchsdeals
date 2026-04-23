import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div style={styles.page}>
      <main style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.label}>Orbital-Noir / Rechtliches</div>
          <h1 style={styles.title}>Impressum</h1>

          <section style={styles.section}>
            <h2 style={styles.heading}>Angaben gemäß § 5 DDG</h2>
            <p style={styles.text}>
              Th.Geratz<br />
              Gneisenaustr 31<br />
              52068 Aachen<br />
              Deutschland
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>Kontakt</h2>
            <p style={styles.text}>
              E-Mail: info@orbital-noir.com
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p style={styles.text}>
              Th.Geratz<br />
              Gneisenaustr 31<br />
              52068 Aachen<br />
              Deutschland
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>Affiliate-Hinweis</h2>
            <p style={styles.text}>
              Diese Website enthält Affiliate-Links (z. B. Amazon, Awin / OTTO).
              Wenn über solche Links ein Kauf zustande kommt, erhalte ich eine Provision.
              Für dich entstehen keine zusätzlichen Kosten.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>Haftung für Inhalte</h2>
            <p style={styles.text}>
              Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
              wird jedoch keine Gewähr übernommen.
            </p>
          </section>

          <div style={styles.actions}>
            <Link href="/" style={styles.primaryBtn}>
              Zurück zum Shop
            </Link>
            <Link href="/datenschutz" style={styles.secondaryBtn}>
              Datenschutz
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },

  shell: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 16px"
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 18px 60px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.06)"
  },

  label: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#6b7280",
    marginBottom: "10px",
    fontWeight: 700
  },

  title: {
    fontSize: "40px",
    margin: 0,
    marginBottom: "10px",
    color: "#111827"
  },

  section: {
    marginTop: "24px"
  },

  heading: {
    fontSize: "18px",
    marginBottom: "8px",
    color: "#111827"
  },

  text: {
    color: "#4b5563",
    lineHeight: 1.7
  },

  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "30px",
    flexWrap: "wrap"
  },

  primaryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600
  },

  secondaryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    background: "#f3f4f6",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 600
  }
};
