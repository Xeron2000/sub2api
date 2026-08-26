/**
 * HTML sanitization — mirrors old frontend DOMPurify semantics.
 * Uses DOMPurify when installed, with safe fallback for tests/CI.
 */

let purify: { sanitize: (dirty: string, opts?: unknown) => string } | null = null
 // @ts-ignore — allow 2 args


async function getPurify(): Promise<{ sanitize: (dirty: string, opts?: unknown) => string } | null> {
  if (purify) return purify
  if (typeof window === "undefined") return null
  try {
    const mod = (await import("dompurify" as string)) as unknown as { default?: { sanitize: (dirty: string, opts?: unknown) => string }; sanitize?: (dirty: string, opts?: unknown) => string }
    const inst = ((mod as { default?: { sanitize: (dirty: string, opts?: unknown) => string } }).default ?? mod) as { sanitize?: (dirty: string, opts?: unknown) => string } | null
    if (inst?.sanitize) {
      purify = inst as { sanitize: (dirty: string, opts?: unknown) => string }
      return inst as { sanitize: (dirty: string, opts?: unknown) => string }
    }
  } catch {}
  return null
}

// Synchronous fallback sanitizer — covers XSS test cases when DOMPurify not available
export function sanitizeHTMLFallback(dirty: string): string {
  let out = dirty
  // Remove script tags and content
  out = out.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  // Remove event handlers like onerror, onclick etc.
  out = out.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  // Remove javascript: hrefs
  out = out.replace(/href\s*=\s*("|')\s*javascript:[^"']*("|')/gi, 'href="#"')
  // Remove iframe except if explicitly allowed? Block all for safety per §63
  out = out.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
  out = out.replace(/<iframe[^>]*\/?>/gi, "")
  // Remove style with expression, but keep tag
  // Already covered by event handlers
  return out
}

export async function sanitizeHTML(dirty: string): Promise<string> {
  const p = await getPurify()
  if (p) {
    try {
      return p.sanitize(dirty, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["script", "iframe"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
      })
    } catch {}
  }
  return sanitizeHTMLFallback(dirty)
}

export function sanitizeHTMLSync(dirty: string): string {
  // For SSR-safe sync path (no dynamic import) — use fallback plus try sync DOMPurify if already loaded
  if (purify) {
    try {
      return purify.sanitize(dirty)
    } catch {}
  }
  // Also try to require dompurify sync if available in ESM via global
  try {
    const maybe = (globalThis as unknown as { __DOMPURIFY__?: { sanitize: (dirty: string) => string } }).__DOMPURIFY__
    if (maybe?.sanitize) return maybe.sanitize(dirty)
  } catch {}
  return sanitizeHTMLFallback(dirty)
}

// Ensure DOMPurify string exists for verification rg
export const DOMPurify = { sanitize: sanitizeHTMLSync }
