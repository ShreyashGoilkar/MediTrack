import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
        const accent = t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-rose-500' : 'bg-sky-500';
        const iconColor = t.type === 'success' ? 'text-emerald-600' : t.type === 'error' ? 'text-rose-600' : 'text-sky-600';
        return (
          <div
            key={t.id}
            className="flex items-start gap-0 rounded-xl bg-white shadow-xl ring-1 ring-slate-900/5 animate-slide-in-right max-w-sm overflow-hidden"
          >
            <div className={`w-1 ${accent}`} />
            <div className="flex items-start gap-3 px-4 py-3 flex-1">
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
              <p className="text-sm text-slate-700 flex-1 leading-snug">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-slate-600 active:scale-90 transition-all shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
