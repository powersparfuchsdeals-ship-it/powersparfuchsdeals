import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div style={styles.page}>
      <main style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.label}>Orbital-Noir / Rechtliches</div>
          <h1 style={styles.title}>Datenschutzerklärung</h1>

          <section style={styles.section}>
            <h2 style={styles.heading}>1. Allgemeine Hinweise</h2>
            <p style={styles.text}>
              Der Schutz personenbezogener Daten ist uns wichtig. Diese
              Datenschutzerklärung informiert darüber, welche Daten auf dieser
              Website verarbeitet werden.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>2. Hosting</h2>
            <p style={styles.text}>
              Diese Website wird bei Vercel gehostet. Beim Aufruf der Website
              können technische Daten wie IP-Adresse, Browsertyp, Uhrzeit des
              Zugriffs und angeforderte Inhalte verarbeitet werden.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>3. Datenverarbeitung durch Supabase</h2>
            <p style={styles.text}>
              Für Login, Authentifizierung und Datenbankfunktionen wird Supabase
              eingesetzt. Dabei können insbesondere E-Mail-Adresse, Nutzer-ID und
              technische Verbindungsdaten verarbeitet werden.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>4. Affiliate-Links</h2>
            <p style={styles.text}>
              Diese Website nutzt Affiliate-Links, zum Beispiel zu Amazon oder
              Partnernetzwerken wie Awin. Beim Anklicken solcher Links können
              Daten an den jeweiligen Anbieter übertragen werden.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>5. Cookies und lokale Speicherung</h2>
            <p style={styles.text}>
              Diese Website kann technisch notwendige Cookies oder lokale
              Speicherfunktionen des Browsers verwenden, um Einstellungen und
              Funktionen bereitzustellen.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>6. Rechte der betroffenen Personen</h2>
            <p style={styles.text}>
              Nutzer haben im Rahmen der gesetzlichen Vorschriften das Recht auf
              Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung
              sowie Widerspruch gegen die Verarbeitung ihrer Daten.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>7. Kontakt</h2>
            <p style={styles.text}>
              Bei Fragen zum Datenschutz:
              <br />
              E-Mail: info@deinedomain.de
            </p>
          </section>

          <div style={styles.actions}>
            <Link href="/" style={styles.linkButton}>
              Zurück zum Shop
            </Link>
            <Link href="/impressum" style={styles.secondaryLink}>
              Impressum
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
