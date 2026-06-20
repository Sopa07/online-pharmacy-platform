function ArticleCard({ article }) {
  return (
    <article className="group card-soft overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-44 overflow-hidden bg-slate-100">
        <img
          src={article.image}
          alt={article.headline}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{article.headline}</h3>
        <p className="line-clamp-3 text-sm text-slate-600">{article.summary}</p>
        <button
          type="button"
          className="rounded-full border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-semibold text-accent-700 transition hover:border-accent-300 hover:bg-accent-100"
        >
          Read More
        </button>
      </div>
    </article>
  );
}

export default ArticleCard;
