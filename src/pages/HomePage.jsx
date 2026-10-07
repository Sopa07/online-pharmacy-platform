import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Stethoscope,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import categories from "../data/categories.json";
import products from "../data/products.json";
import articles from "../data/articles.json";
import CategoryCard from "../components/CategoryCard";
import ArticleCard from "../components/ArticleCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
import { formatNaira } from "../utils/formatCurrency";

const features = [
  {
    title: "Fast Delivery",
    description: "Same-day delivery in Lagos with discreet packaging.",
    icon: Truck
  },
  {
    title: "Certified Pharmacists",
    description: "Every prescription is reviewed by licensed Nigerian pharmacists.",
    icon: BadgeCheck
  },
  {
    title: "Secure Payment",
    description: "Checkout flow built with trusted payment safety standards.",
    icon: CreditCard
  },
  {
    title: "Online Consultation",
    description: "Talk to doctors via chat or video from anywhere in Nigeria.",
    icon: Stethoscope
  }
];

function HomePage() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setLoadingProducts(false), 850);
    return () => clearTimeout(timer);
  }, []);

  const featuredProducts = useMemo(() => {
    const withPhotos = products.filter(
      (product) => product.image && !product.image.startsWith("/product-placeholders/")
    );
    return (withPhotos.length >= 8 ? withPhotos : products).slice(0, 8);
  }, []);
  const bulletinPreview = useMemo(() => articles.slice(0, 3), []);

  const scrollCarousel = (direction = "next") => {
    if (!carouselRef.current) {
      return;
    }

    const amount = carouselRef.current.clientWidth * 0.9;
    carouselRef.current.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth"
    });
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    addToast(`${product.name} added to cart.`);
  };

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 px-6 py-16 shadow-soft sm:px-10 lg:px-14">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <Activity size={14} />
              24/7 Digital Pharmacy
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-purple-700 sm:text-5xl">
              Your Trusted Online Pharmacy
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Order medicines, upload prescriptions, and book specialist consultations in one secure Nigerian telehealth experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
              >
                Shop Medicines
              </button>
              <button
                type="button"
                onClick={() => navigate("/upload-prescription")}
                className="rounded-full border border-accent-300 bg-white px-6 py-3 text-sm font-semibold text-accent-700 transition hover:border-accent-400 hover:text-accent-800"
              >
                Upload Prescription
              </button>
            </div>
          </div>
          <div className="card-soft p-6">
            <p className="text-sm font-semibold text-slate-500">This Week in Care</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-sm text-slate-600">Average Delivery Time</p>
                <p className="mt-1 text-2xl font-bold text-brand-700">45 mins</p>
              </div>
              <div className="rounded-2xl bg-accent-50 p-4">
                <p className="text-sm text-slate-600">Consultation Satisfaction</p>
                <p className="mt-1 text-2xl font-bold text-accent-700">98.6%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-soft p-6">
          <h2 className="text-xl font-bold text-slate-900">Log in or Sign up</h2>
          <p className="mt-2 text-sm text-slate-600">
            Access your healthcare dashboard, track medications, and update your health profile.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/healthcare/login")}
            className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => navigate("/healthcare/login")}
            className="rounded-full border border-accent-300 bg-white px-5 py-2.5 text-sm font-semibold text-accent-700 transition hover:border-accent-400 hover:text-accent-800"
          >
            Sign up
          </button>
          </div>
        </div>
        <div className="card-soft p-6">
          <p className="text-sm font-semibold text-slate-700">Why create an account?</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="font-semibold text-purple-700">Saved prescriptions and consultation history</li>
            <li>Personalized medication reminders</li>
            <li className="font-semibold text-purple-700">Faster checkout and refill requests</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Why Patients Choose Us</h2>
            <p className="mt-1 text-sm text-slate-600">Built for trust, speed, and healthcare quality.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="card-soft p-5">
                <div className="mb-4 inline-flex rounded-xl bg-brand-100 p-2.5 text-brand-700">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Popular Categories</h2>
            <p className="mt-1 text-sm text-slate-600">Find healthcare essentials by need.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={(name) => navigate(`/products?category=${encodeURIComponent(name)}`)}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Medicines</h2>
            <p className="mt-1 text-sm text-slate-600">Top picks from our pharmacy experts.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollCarousel("prev")}
              className="rounded-full border border-accent-300 bg-white px-4 py-2 text-sm font-semibold text-accent-700 transition hover:border-accent-400 hover:text-accent-800"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("next")}
              className="rounded-full border border-accent-300 bg-white px-4 py-2 text-sm font-semibold text-accent-700 transition hover:border-accent-400 hover:text-accent-800"
            >
              Next
            </button>
          </div>
        </div>
        {loadingProducts ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card-soft p-4">
                <LoadingSkeleton className="h-36 w-full" />
                <LoadingSkeleton className="mt-3 h-4 w-3/4" />
                <LoadingSkeleton className="mt-2 h-4 w-1/2" />
                <LoadingSkeleton className="mt-4 h-9 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div ref={carouselRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {featuredProducts.map((product) => (
              <article key={product.id} className="card-soft min-w-[250px] snap-start overflow-hidden">
                <img src={product.image} alt={product.name} loading="lazy" className="h-40 w-full object-cover" />
                <div className="space-y-2 p-4">
                  <h3 className="font-semibold text-slate-900">{product.name}</h3>
              <p className="text-sm text-slate-600">{formatNaira(product.price)}</p>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="w-full rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600"
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Weekly Health Bulletin</h2>
            <p className="mt-1 text-sm text-slate-600">Practical healthcare guidance from our team.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/bulletin")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 hover:text-accent-800"
          >
            View all articles
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {bulletinPreview.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-brand-700 px-6 py-12 text-white shadow-soft sm:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Need Personalized Support?</h2>
            <p className="mt-2 text-brand-100">
              Speak with a specialist today for medication guidance, chronic care support, and treatment follow-up across Nigeria.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/healthcare")}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent-700 transition hover:bg-accent-50"
          >
            Speak to a Specialist
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
