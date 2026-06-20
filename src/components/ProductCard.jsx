import { formatNaira } from "../utils/formatCurrency";

function ProductCard({ product, onAddToCart, onViewDetails }) {
  return (
    <article
      className="group card-soft overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      aria-label={product.name}
    >
      <button type="button" onClick={() => onViewDetails(product)} className="w-full text-left">
        <div className="relative h-48 overflow-hidden bg-slate-100">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand-700">
            {product.category}
          </span>
        </div>
      </button>
      <div className="space-y-3 p-4">
        <button type="button" onClick={() => onViewDetails(product)} className="block w-full text-left">
          <h3 className="line-clamp-2 min-h-14 text-lg font-semibold text-slate-900">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{product.description}</p>
        </button>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-brand-700">{formatNaira(product.price)}</p>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
