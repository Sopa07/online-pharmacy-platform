import { useEffect, useState } from "react";
import articles from "../data/articles.json";
import ArticleCard from "../components/ArticleCard";
import FormInput from "../components/FormInput";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../hooks/useToast";

function BulletinPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = (event) => {
    event.preventDefault();
    addToast("You are now subscribed to the weekly health bulletin.");
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Weekly Health Bulletin</h1>
        <p className="mt-2 text-sm text-slate-600">Read practical health guidance and medication safety insights.</p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card-soft p-4">
              <LoadingSkeleton className="h-44 w-full" />
              <LoadingSkeleton className="mt-4 h-4 w-3/4" />
              <LoadingSkeleton className="mt-2 h-4 w-full" />
              <LoadingSkeleton className="mt-4 h-9 w-28 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <section className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50 to-accent-50 p-8 shadow-soft">
        <h2 className="text-2xl font-bold text-slate-900">Stay Updated Every Week</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Subscribe to receive health tips, medication safety updates, and seasonal wellness guidance.
        </p>
        <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <FormInput
              label="Newsletter Email"
              name="newsletter"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="self-end rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}

export default BulletinPage;
