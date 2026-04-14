import { useEffect, useState } from 'react';
import '../styles/globals.css';
import { supabase } from '../lib/supabase';

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <Component {...pageProps} session={session} authReady={authReady} />;
}
