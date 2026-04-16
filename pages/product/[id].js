import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  async function loadProduct() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    setProduct(data);
  }

  if (!product) return <div>Loading...</div>;

  return (
    <div className="shell">
      <div className="panel-v2" style={{ padding: "30px" }}>
        <img src={product.image} style={{ width: "100%", borderRadius: "20px" }} />

        <h1>{product.name}</h1>
        <p>{product.description}</p>

        <h2>{product.price} €</h2>

        {product.buy_link && (
          <a className="cta-primary" href={product.buy_link} target="_blank">
            Jetzt kaufen
          </a>
        )}
      </div>
    </div>
  );
}
