"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toastBus, type ToastPayload } from "./use-toast";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    return toastBus.subscribe((payload) => {
      setToasts((prev) => [...prev, payload]);
      const timeout = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== payload.id));
      }, payload.duration ?? 3200);
      return () => clearTimeout(timeout);
    });
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-6 right-6 z-[1000] space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto min-w-[240px] rounded-lg border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur"
        >
          <p className="text-sm font-medium text-white">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs text-slate-400">{toast.description}</p>
          ) : null}
        </div>
      ))}
    </div>,
    document.body
  );
}
