function LoadingSkeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

export default LoadingSkeleton;
