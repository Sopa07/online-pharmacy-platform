import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/upload-prescription", label: "Prescription" },
  { to: "/healthcare", label: "Healthcare" },
  { to: "/bulletin", label: "Bulletin" },
  { to: "/checkout", label: "Checkout" }
];

function Navbar({ cartCount, onCartOpen, searchSuggestions }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const navigateToProducts = (searchText) => {
    const normalized = searchText.trim();
    if (normalized) {
      navigate(`/products?search=${encodeURIComponent(normalized)}`);
      setQuery(normalized);
    } else {
      navigate("/products");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-xl border border-slate-300 p-2 text-slate-600 md:hidden"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <button type="button" onClick={() => navigate("/")} className="shrink-0">
          <BrandLogo className="h-12 w-auto rounded-md shadow-sm" />
        </button>

        <div className="hidden flex-1 md:block">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSelect={navigateToProducts}
            suggestions={searchSuggestions}
            placeholder="Search medicine or category"
            ariaLabel="Navbar medicine search"
          />
        </div>

        <button
          type="button"
          onClick={() => navigateToProducts(query)}
          className="rounded-xl border border-accent-300 p-2 text-accent-600 transition hover:border-accent-400 hover:bg-accent-50 md:hidden"
          aria-label="Search products"
        >
          <Search size={18} />
        </button>

        <button
          type="button"
          onClick={onCartOpen}
          className="relative rounded-xl border border-accent-300 p-2 text-accent-700 transition hover:border-accent-400 hover:bg-accent-50"
          aria-label="Open cart drawer"
        >
          <ShoppingCart size={18} />
          {cartCount > 0 ? (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-semibold text-white">
              {cartCount}
            </span>
          ) : null}
        </button>
      </nav>

      <div className="mx-auto hidden max-w-7xl items-center px-4 pb-3 md:flex sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-brand-100 text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        {isAuthenticated ? (
          <NavLink
            to="/healthcare"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-brand-100 px-5 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-200"
          >
            Hi, {user?.name?.split(" ")[0]}
          </NavLink>
        ) : (
          <NavLink
            to="/healthcare/login"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-accent-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accent-600"
          >
            Login / Sign Up
          </NavLink>
        )}
      </div>

      {menuOpen ? (
        <div className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-brand-100 text-brand-800" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <NavLink
              to="/healthcare"
              onClick={() => setMenuOpen(false)}
              className="mt-2 block rounded-lg bg-brand-100 px-3 py-2 text-sm font-semibold text-brand-800"
            >
              Hi, {user?.name?.split(" ")[0]}
            </NavLink>
          ) : (
            <NavLink
              to="/healthcare/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 block rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white shadow-soft"
            >
              Login / Sign Up
            </NavLink>
          )}
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
