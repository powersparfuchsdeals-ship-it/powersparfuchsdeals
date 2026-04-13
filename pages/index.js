import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

export default function Home(){
  const [products,setProducts]=useState([]);
  const [user,setUser]=useState(null);

  useEffect(()=>{
    load();
    checkUser();
  },[]);

  async function checkUser(){
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  async function load(){
    const {data}=await supabase.from('products').select('*');
    setProducts(data||[]);
  }

  return (
    <div style={{background:"#020617",color:"white",minHeight:"100vh"}}>
      <Navbar user={user} />

      <div style={{padding:"40px"}}>
        <h1>⚡ Premium Tech Shop</h1>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
          gap:"20px",
          marginTop:"20px"
        }}>
          {products.map(p=>(
            <div key={p.id} style={{
              background:"#0f172a",
              padding:"20px",
              borderRadius:"16px",
              boxShadow:"0 0 20px rgba(0,0,0,0.5)"
            }}>
              <img src={p.image} style={{
                width:"100%",
                borderRadius:"10px"
              }} />
              <h3>{p.name}</h3>
              <p>{p.price} €</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
