import { Minus, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
import { formatNaira } from "../utils/formatCurrency";

const deliveryDefaults = {
  name: "",
  phone: "",
  address: "",
  instructions: ""
};

const couponPresets = {
  SHAZZAR10: { type: "percent", value: 10, label: "Shazzar 10% off" },
  HEALTH5: { type: "percent", value: 5, label: "Health 5% off" },
  FREEDEL: { type: "delivery", value: 100, label: "Free delivery" }
};

function CheckoutPage() {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { addToast } = useToast();
  const [delivery, setDelivery] = useState(deliveryDefaults);
  const [paymentMethod, setPaymentMethod] = useState("Card (Naira)");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const baseDeliveryFee = items.length > 0 ? 2500 : 0;
  const deliveryFee =
    appliedCoupon?.type === "delivery" ? 0 : baseDeliveryFee;
  const discountAmount =
    appliedCoupon?.type === "percent"
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : 0;
  const total = subtotal + deliveryFee - discountAmount;

  const handlePlaceOrder = (event) => {
    event.preventDefault();
    if (items.length === 0) {
      addToast("Your cart is empty. Add medicines before checkout.", "error");
      return;
    }
    setPlacedOrder({
      paymentMethod,
      address: delivery.address,
      total
    });
    setSuccessModalOpen(true);
    addToast("Order placed successfully.");
    clearCart();
    setDelivery(deliveryDefaults);
  };

  const handleApplyCoupon = (event) => {
    event.preventDefault();
    const normalized = couponCode.trim().toUpperCase();
    const preset = couponPresets[normalized];
    if (!preset) {
      addToast("Invalid coupon code.", "error");
      return;
    }
    setAppliedCoupon({ code: normalized, ...preset });
    addToast(`${preset.label} applied.`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    addToast("Coupon removed.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Checkout and Payment</h1>
        <p className="mt-2 text-sm text-slate-600">Review your order and complete delivery details in Nigeria.</p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="card-soft p-6">
            <h2 className="text-lg font-semibold text-slate-900">Cart Summary</h2>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <p className="text-sm text-slate-600">No items in cart yet.</p>
                  <Link to="/products" className="mt-3 inline-block text-sm font-semibold text-accent-700 hover:text-accent-800">
                    Browse medicines
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-600">{formatNaira(item.price)} each</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 p-1 hover:bg-slate-100"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 p-1 hover:bg-slate-100"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="card-soft p-6">
            <h2 className="text-lg font-semibold text-slate-900">Delivery Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Name"
                name="name"
                value={delivery.name}
                onChange={(event) => setDelivery((previous) => ({ ...previous, name: event.target.value }))}
                required
              />
              <FormInput
                label="Phone"
                name="phone"
                type="tel"
                value={delivery.phone}
                onChange={(event) => setDelivery((previous) => ({ ...previous, phone: event.target.value }))}
                required
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Address"
                  name="address"
                  value={delivery.address}
                  onChange={(event) => setDelivery((previous) => ({ ...previous, address: event.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <FormInput
                  label="Delivery Instructions"
                  name="instructions"
                  as="textarea"
                  rows={3}
                  value={delivery.instructions}
                  onChange={(event) => setDelivery((previous) => ({ ...previous, instructions: event.target.value }))}
                  placeholder="Gate code or landmark"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-soft p-6">
            <h2 className="text-lg font-semibold text-slate-900">Payment Options</h2>
            <div className="mt-4 space-y-3">
              {["Card (Naira)", "Bank Transfer", "USSD", "Mobile Wallet"].map((method) => (
                <label
                  key={method}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    paymentMethod === method ? "border-brand-400 bg-brand-50" : "border-slate-300 hover:border-brand-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <Wallet size={16} className="text-brand-700" />
                  <span className="text-sm font-medium text-slate-700">{method}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card-soft p-6">
            <h2 className="text-lg font-semibold text-slate-900">Discount Coupon</h2>
            <form onSubmit={handleApplyCoupon} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                aria-label="Coupon code"
              />
              <button
                type="submit"
                className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600"
              >
                Apply
              </button>
            </form>
            {appliedCoupon ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <span className="font-semibold">{appliedCoupon.code}</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">Try: SHAZZAR10, HEALTH5, FREEDEL</p>
          </section>

          <section className="card-soft p-6">
            <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>{formatNaira(deliveryFee)}</span>
              </div>
              {discountAmount > 0 ? (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-{formatNaira(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatNaira(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              className="mt-5 w-full rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              Place Order
            </button>
          </section>
        </div>
      </form>

      <Modal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          setPlacedOrder(null);
        }}
        title="Order Confirmed"
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>Your order has been received and is being prepared for delivery.</p>
          <p>
            Payment method: <span className="font-semibold text-slate-900">{placedOrder?.paymentMethod || paymentMethod}</span>
          </p>
          <p>
            Total paid: <span className="font-semibold text-slate-900">{formatNaira(placedOrder?.total ?? total)}</span>
          </p>
          <p>
            Delivery destination: <span className="font-semibold text-slate-900">{placedOrder?.address || "Provided during checkout"}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setSuccessModalOpen(false);
              setPlacedOrder(null);
            }}
            className="w-full rounded-full bg-accent-500 px-5 py-3 text-sm font-semibold text-white hover:bg-accent-600"
          >
            Continue Shopping
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default CheckoutPage;
