import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const ToastUI = () =>
    toast ? (
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-[90vw] backdrop-blur-lg ${
          toast.type === "error"
            ? "bg-red-500/20 border border-red-500/40 text-red-400"
            : toast.type === "warning"
            ? "bg-yellow-500/20 border border-yellow-500/40 text-yellow-400"
            : "bg-green-500/20 border border-green-500/40 text-green-400"
        }`}
      >
        <span>
          {toast.type === "error"
            ? "❌"
            : toast.type === "warning"
            ? "⚠️"
            : "✅"}
        </span>
        <span className="text-white/90">{toast.message}</span>
      </div>
    ) : null;

  return { showToast, ToastUI };
}