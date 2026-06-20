import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { formatNaira } from "../utils/formatCurrency";

function CartDrawer({ open, onClose, items, subtotal, onUpdateQuantity, onRemove, onCheckout }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-slate-900/45 transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-label="Close cart drawer overlay"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart drawer"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Your Cart</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-slate-100" aria-label="Close cart drawer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag size={32} className="text-slate-400" />
              <p className="mt-3 text-sm text-slate-600">Your cart is empty.</p>
              <Link
                to="/products"
                onClick={onClose}
                className="mt-3 rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
              >
                Browse Medicines
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900">{item.name}</h4>
                    <p className="text-sm text-slate-600">{formatNaira(item.price)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onRemove(item.id)}
                    className="rounded-md p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 p-1 transition hover:bg-slate-100"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 p-1 transition hover:bg-slate-100"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="space-y-3 border-t border-slate-200 p-5">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          <button
            type="button"
            onClick={onCheckout}
            disabled={items.length === 0}
            className="w-full rounded-full bg-accent-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Checkout
          </button>
        </div>
      </aside>
    </>
  );
}

export default CartDrawer;
