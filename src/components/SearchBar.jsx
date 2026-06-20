import { Search } from "lucide-react";
import { useMemo, useState } from "react";

function SearchBar({
  value,
  onChange,
  onSelect,
  suggestions = [],
  placeholder = "Search medicines...",
  ariaLabel = "Search medicines"
}) {
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    if (!value?.trim()) {
      return [];
    }

    return suggestions
      .filter((item) => item.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 6);
  }, [suggestions, value]);

  return (
    <div className="relative">
      <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <Search size={18} className="text-slate-500" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 130)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="w-full border-0 bg-transparent px-2 text-sm text-slate-800 outline-none"
        />
      </div>

      {focused && matches.length > 0 ? (
        <ul className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {matches.map((match) => (
            <li key={match}>
              <button
                type="button"
                onClick={() => onSelect(match)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-accent-50 hover:text-accent-700"
              >
                {match}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default SearchBar;
