import { useEffect,useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home(){
const [products,setProducts]=useState([]);

useEffect(()=>{load();},[]);

async function load(){
const {data}=await supabase.from('products').select('*');
setProducts(data||[]);
}

return (
<div style={{background:"#020617",color:"white",minHeight:"100vh",padding:"40px"}}>
<h1>⚡ Premium Tech Shop</h1>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"20px"}}>
{products.map(p=>(
<div key={p.id} style={{background:"#0f172a",padding:"20px",borderRadius:"16px"}}>
<img src={p.image} style={{width:"100%",borderRadius:"10px"}} />
<h3>{p.name}</h3>
<p>{p.price} €</p>
</div>
))}
</div>
</div>
);
}
