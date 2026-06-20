function CategoryCard({ category, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(category.name)}
      className="group card-soft overflow-hidden text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="h-36 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
        <p className="text-sm text-slate-600">{category.description}</p>
      </div>
    </button>
  );
}

export default CategoryCard;
