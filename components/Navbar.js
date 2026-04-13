import { supabase } from '../lib/supabase';

export default function Navbar({ user }) {
  async function logout(){
    await supabase.auth.signOut();
    location.reload();
  }

  return (
    <div style={{
      display:"flex",
      justifyContent:"space-between",
      padding:"20px",
      background:"#020617",
      color:"white"
    }}>
      <h2>⚡ Tech Shop</h2>

      <div>
        {!user ? (
          <>
            <a href="/login" style={{marginRight:"10px"}}>Login</a>
            <a href="/register">Register</a>
          </>
        ) : (
          <>
            <a href="/admin" style={{marginRight:"10px"}}>Admin</a>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
}
