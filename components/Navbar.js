import { supabase } from '../lib/supabase';

export default function Navbar({ user }) {
  async function logout() {
    await supabase.auth.signOut();
    location.href = '/';
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
            <div className="brand-name">Orbital Noir</div>
            <div className="brand-subline">Future Devices Archive</div>
          </div>
        </a>

        <nav className="nav-links">
          <a className="nav-link" href="/">Archiv</a>
          {!user ? (
            <>
              <a className="nav-link" href="/login">Login</a>
              <a className="nav-cta" href="/register">Zugang anfordern</a>
            </>
          ) : (
            <>
              <a className="nav-link" href="/admin">Control Deck</a>
              <button className="nav-cta" onClick={logout}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
