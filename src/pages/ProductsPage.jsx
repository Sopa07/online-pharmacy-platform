import { Filter, SlidersHorizontal, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import products from "../data/products.json";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
import { formatNaira } from "../utils/formatCurrency";

const PAGE_SIZE = 24;
const MAX_CATALOG_PRICE = Math.ceil(Math.max(...products.map((item) => item.price)) / 1000) * 1000;
const CATEGORIES = ["All", ...new Set(products.map((item) => item.category))].sort((a, b) =>
  a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)
);
const BRAND_OPTIONS = Object.entries(
  products.reduce((counts, product) => {
    counts[product.brand] = (counts[product.brand] || 0) + 1;
    return counts;
  }, {})
)
  .sort(([, countA], [, countB]) => countB - countA)
  .slice(0, 60)
  .map(([brand]) => brand);

function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [maxPrice, setMaxPrice] = useState(MAX_CATALOG_PRICE);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [sortBy, setSortBy] = useState("popularity");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "All");
  }, [searchParams]);

  const suggestions = useMemo(() => products.map((item) => item.name), []);

  const filteredProducts = useMemo(() => {
    // Filter pipeline keeps behavior easy to reason about as filters grow.
    let data = [...products];

    data = data.filter((item) => item.price <= maxPrice);

    if (category !== "All") {
      data = data.filter((item) => item.category === category);
    }

    if (selectedBrands.length > 0) {
      data = data.filter((item) => selectedBrands.includes(item.brand));
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query)
      );
    }

    if (sortBy === "price") {
      data.sort((a, b) => a.price - b.price);
    } else if (sortBy === "newest") {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      data.sort((a, b) => b.popularity - a.popularity);
    }

    return data;
  }, [category, maxPrice, search, selectedBrands, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, maxPrice, search, selectedBrands, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const toggleBrand = (brand) => {
    setSelectedBrands((previous) =>
      previous.includes(brand) ? previous.filter((item) => item !== brand) : [...previous, brand]
    );
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    addToast(`${product.name} added to cart.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Browse Medicines</h1>
        <p className="mt-2 text-sm text-slate-600">Search, filter, and sort products across pharmacy categories.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card-soft h-fit p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={16} className="text-brand-700" />
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          </div>

          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="category"
                      value={option}
                      checked={category === option}
                      onChange={(event) => setCategory(event.target.value)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Price Range</h3>
              <input
                type="range"
                min="0"
                max={MAX_CATALOG_PRICE}
                step="1000"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="w-full accent-brand-600"
                aria-label="Maximum price range"
              />
              <p className="mt-1 text-sm text-slate-600">Up to {formatNaira(maxPrice)}</p>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Popular Brands</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {BRAND_OPTIONS.map((brand) => (
                  <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="card-soft space-y-4 p-4">
            <SearchBar
              value={search}
              onChange={setSearch}
              onSelect={setSearch}
              suggestions={suggestions}
              placeholder="Search by medicine name, brand, or category"
              ariaLabel="Product search"
            />
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                <SlidersHorizontal size={15} />
                {filteredProducts.length} products found
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Sort:
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price">Price</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="card-soft p-4">
                  <LoadingSkeleton className="h-40 w-full" />
                  <LoadingSkeleton className="mt-4 h-4 w-2/3" />
                  <LoadingSkeleton className="mt-2 h-3 w-full" />
                  <LoadingSkeleton className="mt-4 h-9 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={setSelectedProduct}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              {filteredProducts.length === 0 ? (
                <div className="card-soft col-span-full p-8 text-center">
                  <p className="text-sm text-slate-600">No medicines match your current filters.</p>
                </div>
              ) : null}
              </div>

              {filteredProducts.length > PAGE_SIZE ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {pageCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                      disabled={currentPage === pageCount}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <Modal isOpen={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name ?? ""}>
        {selectedProduct ? (
          <div className="space-y-4">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              loading="lazy"
              className="h-52 w-full rounded-xl bg-slate-100 object-contain"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
                {selectedProduct.category}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedProduct.requiresPrescription
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {selectedProduct.requiresPrescription ? "Prescription Required" : "Over the Counter"}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{selectedProduct.description}</p>
            <div className="rounded-xl bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900">Dosage Information</h4>
              <p className="mt-1 text-sm text-slate-600">{selectedProduct.dosage}</p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">Reviews</h4>
              <div className="space-y-2">
                {selectedProduct.reviews.map((review, index) => (
                  <article key={`${review.name}-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{review.name}</p>
                      <div className="inline-flex items-center gap-1 text-amber-500">
                        <Star size={14} className="fill-current" />
                        <span className="text-xs font-semibold">{review.rating}.0</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
                  </article>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAddToCart(selectedProduct)}
              className="w-full rounded-full bg-accent-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              Add to Cart - {formatNaira(selectedProduct.price)}
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default ProductsPage;
