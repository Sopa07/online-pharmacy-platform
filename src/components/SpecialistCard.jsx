import { Star } from "lucide-react";

function SpecialistCard({ specialist }) {
  return (
    <article className="card-soft overflow-hidden p-4">
      <div className="flex items-center gap-4">
        <img
          src={specialist.photo}
          alt={specialist.name}
          loading="lazy"
          className="h-16 w-16 rounded-2xl object-cover"
        />
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900">{specialist.name}</h3>
          <p className="text-sm text-brand-700">{specialist.specialization}</p>
          <p className="text-xs text-slate-500">{specialist.availability}</p>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Star size={12} className="fill-amber-400 text-amber-500" />
        {specialist.rating} rating
      </div>
    </article>
  );
}

export default SpecialistCard;
