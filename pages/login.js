import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ session, authReady }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && session) {
      location.href = '/admin';
    }
  }, [authReady, session]);

  async function login() {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();

        if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
          setMessage('Deine E-Mail ist noch nicht bestätigt. Prüfe dein Postfach oder deaktiviere in Supabase die E-Mail-Bestätigung für Tests.');
        } else if (msg.includes('invalid login credentials')) {
          setMessage('E-Mail oder Passwort ist falsch.');
        } else {
          setMessage(error.message);
        }
        return;
      }

      if (data?.session) {
        location.href = '/admin';
      }
    } catch (_err) {
      setMessage('Login fehlgeschlagen. Prüfe deine Supabase-Einstellungen und versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <div className="micro-label">Access Terminal</div>
          <h1>Session wird geprüft</h1>
          <p>Bitte einen Moment warten …</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="micro-label">Access Terminal</div>
        <h1>Eintritt in Orbital Noir</h1>
        <p>Authentifiziere dich, um neue Module ins Archiv einzuspeisen.</p>

        <input
          className="field"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn auth-btn" onClick={login} disabled={loading}>
          {loading ? 'Prüfe Zugang...' : 'Login'}
        </button>

        {message ? <p className="auth-error">{message}</p> : null}

        <p className="auth-switch">
          Noch kein Zugang? <a href="/register">Zugang anfordern</a>
        </p>
      </div>
    </div>
  );
}
