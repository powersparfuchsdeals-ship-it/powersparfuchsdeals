import { supabase } from "./supabase";

export function useTracking() {
  function isAllowed() {
    return localStorage.getItem("cookie-consent") === "accepted";
  }
 export function useTracking() {
  function trackClick(product) {
    const commissionRate = 0.03; // 3%
    const estimated = product.price * commissionRate;

    console.log("💸 Einnahme geschätzt:", estimated.toFixed(2), "€");

    // später: in DB speichern möglich
  }

  return { trackClick };
}
  
  async function trackClick(product) {
    if (!isAllowed()) return;

    try {
      await supabase.from("tracking_events").insert([
        {
          type: "click",
          product_id: product.id,
          name: product.name,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (e) {
      console.error("Tracking error:", e);
    }
  }

  async function trackView(product) {
    if (!isAllowed()) return;

    try {
      await supabase.from("tracking_events").insert([
        {
          type: "view",
          product_id: product.id,
          name: product.name,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (e) {}
  }

  return { trackClick, trackView };
}
