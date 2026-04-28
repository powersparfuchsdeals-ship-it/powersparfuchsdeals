import { useState } from "react";

export default function DealCard({ deal, onClick }) {
  const [imgError, setImgError] = useState(false);

  const price = Number(deal.price || 0);
  const oldPrice = Number(deal.oldPrice || deal.old_price || 0);

  const discount =
    oldPrice && price && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : null;

  const handleClick = () => {
    if (onClick) onClick(deal);

    const url =
      deal.affiliateUrl ||
      deal.affiliate_url ||
      deal.buy_link ||
      deal.link ||
      deal.url;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 shadow-lg hover:scale-[1.02] transition">
      {/* IMAGE */}
      <div className="relative">
        <img
          src={imgError ? "/placeholder.png" : (deal.image || deal.thumbnail)}
          onError={() => setImgError(true)}
          alt={deal.title}
          className="w-full h-48 object-contain rounded-xl bg-black"
        />

        {discount && (
          <div className="absolute top-2 left-2 bg-green-500 text-black px-2 py-1 text-xs font-bold rounded">
            -{discount}%
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="mt-3">
        <h2 className="text-white text-sm font-semibold line-clamp-2">
          {deal.title}
        </h2>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-green-400 text-lg font-bold">
            {price}€
          </span>

          {oldPrice > 0 && (
            <span className="text-gray-500 line-through text-sm">
              {oldPrice}€
            </span>
          )}
        </div>

        {/* TRUST + FOMO */}
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>🔥 Beliebt heute</span>
          <span>👀 {deal.clicks || 0}</span>
        </div>

        {/* CTA */}
        <button
          onClick={handleClick}
          className="w-full mt-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2 rounded-xl font-semibold hover:opacity-90"
        >
          👉 Jetzt Deal ansehen
        </button>
      </div>
    </div>
  );
}
