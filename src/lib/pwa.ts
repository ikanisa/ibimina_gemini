/**
 * PWA cache helpers.
 *
 * We previously shipped a custom `public/sw.js` with fixed cache keys (static-v1/runtime-v1).
 * That can cause stale app shells after deploy. These helpers allow a safe cleanup.
 */

const LEGACY_CACHE_PREFIXES = ['static-v', 'runtime-v'];

export async function clearLegacyPwaCaches(): Promise<void> {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  const legacyKeys = keys.filter((k) => LEGACY_CACHE_PREFIXES.some((p) => k.startsWith(p)));
  await Promise.all(legacyKeys.map((k) => caches.delete(k)));
}

export async function clearAllAppCachesAndReload(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (err) {
    console.warn('Failed to unregister service workers:', err);
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.warn('Failed to clear caches:', err);
  }

  // Reload after clearing. A normal reload is usually enough after unregister+cache delete.
  window.location.reload();
}


