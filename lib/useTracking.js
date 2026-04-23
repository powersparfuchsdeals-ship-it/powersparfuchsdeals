import { supabase } from "./supabase";

export function useTracking() {
  function isAllowed() {
    return localStorage.getItem("cookie-consent") === "accepted";
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
