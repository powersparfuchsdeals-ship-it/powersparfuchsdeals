import Link from "next/link";

export default function Impressum() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px" }}>
      <h1>Impressum</h1>

      <p><strong>Angaben gemäß § 5 DDG</strong></p>

      <p>
        Max Mustermann<br />
        Musterstraße 123<br />
        12345 Musterstadt<br />
        Deutschland
      </p>

      <p>
        <strong>Kontakt:</strong><br />
        E-Mail: info@deinedomain.de
      </p>

      <p>
        <strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong><br />
        Max Mustermann<br />
        Adresse wie oben
      </p>

      <h2>Affiliate-Hinweis</h2>
      <p>
        Diese Website enthält Affiliate-Links. Wenn du über solche Links einkaufst,
        erhalte ich eine Provision. Für dich entstehen keine zusätzlichen Kosten.
      </p>

      <h2>Haftungsausschluss</h2>
      <p>
        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die
        Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch
        keine Gewähr übernehmen.
      </p>

      <p style={{ marginTop: 30 }}>
        <Link href="/">Zurück zum Shop</Link>
      </p>
    </div>
  );
}
