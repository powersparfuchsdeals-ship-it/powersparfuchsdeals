import { supabase } from "./supabase";

export function useTracking() {
  function isAllowed() {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cookie-consent") === "accepted";
  }

  async function trackClick(product) {
    if (!isAllowed() || !product?.id) return;

    const price = Number(product.price || 0);
    const commissionRate = Number(product.commission_rate || 0.03);
    const estimatedRevenue = price * commissionRate;

    try {
      await supabase.from("tracking_events").insert([
        {
          type: "click",
          product_id: String(product.id),
          name: product.name || "",
          merchant: product.merchant || product.source || "",
          product_price: price,
          estimated_revenue: estimatedRevenue,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error("Tracking error:", error);
    }
  }

  async function trackView(product) {
    if (!isAllowed() || !product?.id) return;

    try {
      await supabase.from("tracking_events").insert([
        {
          type: "view",
          product_id: String(product.id),
          name: product.name || "",
          merchant: product.merchant || product.source || "",
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error("Tracking error:", error);
    }
  }

  return { trackClick, trackView };
}
