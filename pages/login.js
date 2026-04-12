import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login(){
const [email,setEmail]=useState('');
const [password,setPassword]=useState('');

async function login(){
await supabase.auth.signInWithPassword({email,password});
alert("Eingeloggt!");
}

return (
<div style={{padding:"40px"}}>
<h1>Login</h1>
<input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
<input placeholder="Passwort" type="password" onChange={e=>setPassword(e.target.value)} />
<button onClick={login}>Login</button>
</div>
);
}
