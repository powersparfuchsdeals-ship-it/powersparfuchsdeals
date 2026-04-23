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
              Max Mustermann
              <br />
              Musterstraße 1
              <br />
              12345 Musterstadt
              <br />
              Deutschland
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>Kontakt</h2>
            <p style={styles.text}>
              E-Mail: info@deinedomain.de
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>Verantwortlich für den Inhalt</h2>
            <p style={styles.text}>
              Max Mustermann
              <br />
              Musterstraße 1
              <br />
              12345 Musterstadt
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>Affiliate-Hinweis</h2>
            <p style={styles.text}>
              Diese Website enthält Affiliate-Links. Wenn über solche Links ein Kauf
              zustande kommt, kann eine Provision gezahlt werden. Für Nutzer entstehen
              dadurch keine zusätzlichen Kosten.
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
            <Link href="/" style={styles.linkButton}>
              Zurück zum Shop
            </Link>
            <Link href="/datenschutz" style={styles.secondaryLink}>
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
    color: "#111827",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },

  shell: {
    maxWidth: "980px",
    margin: "0 auto",
    padding: "40px 16px"
  },

  card: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 60px rgba(0,0,0,0.08)"
  },

  label: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
    marginBottom: "12px"
  },

  title: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    color: "#111827"
  },

  section: {
    marginTop: "26px"
  },

  heading: {
    margin: 0,
    marginBottom: "10px",
    fontSize: "20px",
    color: "#111827"
  },

  text: {
    margin: 0,
    color: "#4b5563",
    lineHeight: 1.75,
    fontSize: "16px"
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "30px"
  },

  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 600
  },

  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    background: "#f3f4f6",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 600,
    border: "1px solid #d1d5db"
  }
};
