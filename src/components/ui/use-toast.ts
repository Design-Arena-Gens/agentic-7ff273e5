export type ToastPayload = {
  id: string;
  title: string;
  description?: string;
  duration?: number;
};

type Listener = (payload: ToastPayload) => void | (() => void);

class ToastBus {
  private listeners = new Set<Listener>();

  publish(payload: ToastPayload) {
    for (const listener of this.listeners) {
      const disposer = listener(payload);
      if (typeof disposer === "function") {
        setTimeout(disposer, payload.duration ?? 3200);
      }
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const toastBus = new ToastBus();

export function toast(payload: Omit<ToastPayload, "id">) {
  toastBus.publish({
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    ...payload
  });
}
