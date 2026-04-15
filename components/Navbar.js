import { supabase } from "../lib/supabase";

export default function Navbar({ session }) {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="nav-wrap">
      <div className="shell nav">
        <a href="/" className="brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="brand-name">Orbital-Noir</div>
            <div className="brand-subline">Premium Tech Curation</div>
          </div>
        </a>

        <nav className="nav-links">
          <a className="nav-link" href="/">Shop</a>
          {!session ? (
            <>
              <a className="nav-link" href="/login">Login</a>
              <a className="nav-cta" href="/register">Registrieren</a>
            </>
          ) : (
            <>
              <a className="nav-link" href="/admin">Admin</a>
              <button className="nav-cta" onClick={logout}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
