import { supabase } from "../lib/supabase";

export default function Navbar({ session }) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const userEmail = session?.user?.email || "";
  const isAdmin =
    userEmail && adminEmail
      ? userEmail.toLowerCase() === adminEmail.toLowerCase()
      : false;

  async function handleLogout(e) {
    e.preventDefault();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="navbar-wrap">
      <nav className="navbar shell">
        <div className="navbar-left">
          <a className="brand-link" href="/">
            Orbital-Noir
          </a>
        </div>

        <div className="navbar-right">
          <a className="nav-link" href="/">
            Shop
          </a>

          {session ? (
            <>
              {isAdmin ? (
                <a className="nav-link nav-btn" href="/admin">
                  Admin
                </a>
              ) : null}

              <a className="nav-link nav-btn" href="#" onClick={handleLogout}>
                Logout
              </a>
            </>
          ) : (
            <>
              <a className="nav-link nav-btn" href="/login">
                Login
              </a>
              <a className="nav-link nav-btn" href="/register">
                Register
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
