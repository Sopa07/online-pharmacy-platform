import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-extrabold text-brand-700">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">The page you requested does not exist in this demo.</p>
      <Link
        to="/"
        className="mt-5 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
      >
        Return Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
