import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Register(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');

  async function register(){
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if(error){
      alert(error.message);
    } else {
      alert("Registrierung erfolgreich! Jetzt einloggen.");
    }
  }

  return (
    <div style={{padding:"40px"}}>
      <h1>Registrieren</h1>
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Passwort" onChange={e=>setPassword(e.target.value)} />
      <button onClick={register}>Registrieren</button>
    </div>
  );
}