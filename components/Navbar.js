import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar({ session }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const isLoggedIn = useMemo(() => !!session, [session]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();

    if (!q) return;

    router.push(`/?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="shop-nav">
      <div className="shop-nav-top">
        <Link href="/" className="shop-logo">
          <span className="shop-logo-mark">◉</span>
          <div className="shop-logo-text">
            <strong>Orbital-Noir</strong>
            <span>Tech Deals</span>
          </div>
        </Link>

        <form className="shop-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Produkte suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Suchen</button>
        </form>

        <nav className="shop-nav-actions">
          <Link href="/">Start</Link>
          <Link href="/admin">Admin</Link>

          {isLoggedIn ? (
            <>
              <Link href="/account">Konto</Link>
              <button className="shop-nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Registrieren</Link>
            </>
          )}
        </nav>
      </div>

      <div className="shop-nav-bottom">
        <Link href="/">Alle</Link>
        <Link href="/?category=smartphone">Smartphones</Link>
        <Link href="/?category=smart-tv">Smart TV</Link>
        <Link href="/?category=audio">Audio</Link>
        <Link href="/?category=laptop">Laptops</Link>
        <Link href="/?category=zubehoer">Zubehör</Link>
      </div>
    </header>
  );
}
