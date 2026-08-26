type ToastFn = (msg: string) => void

function noop(msg: string) {
  if (typeof window !== "undefined") {
    // fallback: dispatch custom event for future Sonner integration
    try {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: msg }))
    } catch {}
    // minimal visual fallback via console
    console.log("[toast]", msg)
  }
}

export const toast: { success: ToastFn; error: ToastFn; info: ToastFn } = {
  success: noop,
  error: noop,
  info: noop,
}
