import { useEffect, useState } from "react";
import DealCard from "../components/DealCard";

export default function DealsPage() {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((data) => setDeals(data));
  }, []);

  const handleClick = async (deal) => {
    // Tracking speichern
    await fetch("/api/track-click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dealId: deal.id }),
    });

    // Weiterleitung Affiliate
    window.open(deal.affiliateUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <h1 className="text-white text-2xl font-bold mb-6">
        🔥 Top Deals heute
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onClick={handleClick} />
        ))}
      </div>
    </div>
  );
}
