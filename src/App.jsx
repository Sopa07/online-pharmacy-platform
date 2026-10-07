import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ToastContainer from "./components/ToastContainer";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import UploadPrescriptionPage from "./pages/UploadPrescriptionPage";
import HealthcarePage from "./pages/HealthcarePage";
import HealthcareLoginPage from "./pages/HealthcareLoginPage";
import CheckoutPage from "./pages/CheckoutPage";
import BulletinPage from "./pages/BulletinPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import products from "./data/products.json";
import { useCart } from "./hooks/useCart";
import { useAuth } from "./hooks/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth();
  if (!isReady) {
    return <div className="card-soft p-6 text-sm font-semibold text-slate-600">Checking secure session...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/healthcare/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { isAdmin, isAuthenticated, isReady } = useAuth();
  if (!isReady) {
    return <div className="card-soft p-6 text-sm font-semibold text-slate-600">Checking admin access...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/healthcare/login?redirect=/admin" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/healthcare" replace />;
  }
  return children;
}

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  const { items, cartCount, subtotal, updateQuantity, removeFromCart } = useCart();

  const productNames = useMemo(() => products.map((product) => product.name), []);

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        cartCount={cartCount}
        onCartOpen={() => setIsCartOpen(true)}
        searchSuggestions={productNames}
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/upload-prescription" element={<UploadPrescriptionPage />} />
          <Route path="/healthcare/login" element={<HealthcareLoginPage />} />
          <Route
            path="/healthcare"
            element={
              <ProtectedRoute>
                <HealthcarePage />
              </ProtectedRoute>
            }
          />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="/bulletin" element={<BulletinPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        subtotal={subtotal}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />
      <ToastContainer />
    </div>
  );
}

export default App;
