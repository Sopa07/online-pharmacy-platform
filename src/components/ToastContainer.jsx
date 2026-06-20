import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useToast } from "../hooks/useToast";

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[60] space-y-3 sm:right-6">
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex min-w-[280px] items-start gap-3 rounded-xl border p-3 shadow-lg transition ${
              isError ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
            role="status"
            aria-live="polite"
          >
            {isError ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="rounded-md p-1 transition hover:bg-black/5"
              onClick={() => removeToast(toast.id)}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
