// Sends an event to PostHog when it's set up; does nothing otherwise (local runs, tests, ad blockers).
export function track(event, props = {}) {
  if (typeof window !== 'undefined' && typeof window.posthog?.capture === 'function') {
    window.posthog.capture(event, props);
  }
}
