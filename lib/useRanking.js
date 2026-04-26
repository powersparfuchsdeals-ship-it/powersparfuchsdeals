import { useMemo } from "react";
import { calculateScore } from "./ranking";

export function useRanking(products, trackingEvents = []) {
  return useMemo(() => {
    const clickMap = new Map();

    trackingEvents.forEach((e) => {
      if (e.type === "click") {
        const id = String(e.product_id);
        clickMap.set(id, (clickMap.get(id) || 0) + 1);
      }
    });

    return [...products]
      .map((p) => {
        const trackingClicks = clickMap.get(String(p.id)) || 0;

        return {
          ...p,
          score: calculateScore(p, trackingClicks),
          trackingClicks
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [products, trackingEvents]);
}
