import "@testing-library/jest-dom/vitest"

// Robust localStorage polyfill for jsdom without URL (or when vitest provides opaque origin)
class LocalStorageMock implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(key: string) { return this.store.get(key) ?? null }
  setItem(key: string, value: string) { this.store.set(String(key), String(value)) }
  removeItem(key: string) { this.store.delete(key) }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null }
}

function ensureLocalStorage() {
  if (typeof window === "undefined") return
  let hasLocalStorage: boolean
  try {
    hasLocalStorage = !!window.localStorage
  } catch {
    hasLocalStorage = false
  }
  if (!hasLocalStorage) {
    const mock = new LocalStorageMock()
    Object.defineProperty(window, "localStorage", { value: mock, writable: true, configurable: true })
  }
  if (typeof globalThis.localStorage === "undefined") {
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = window.localStorage
  } else {
    try {
      globalThis.localStorage.clear()
    } catch {
      Object.defineProperty(globalThis, "localStorage", { value: window.localStorage, writable: true, configurable: true })
    }
  }
}

ensureLocalStorage()
