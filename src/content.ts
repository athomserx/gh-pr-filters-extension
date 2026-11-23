import { PrFilesController } from './controller';
import { matchPrFilesRoute } from './route';

/*
 * GitHub navega sin recargar la página, así que el script corre en todo github.com
 * y activa el controlador solo mientras la URL sea la pestaña de archivos de un PR.
 */

let current: { key: string; controller: PrFilesController } | null = null;
let lastHref = '';

/** Arranca, reinicia o detiene el controlador según la URL actual. */
function syncWithLocation(): void {
  if (location.href === lastHref) return;
  lastHref = location.href;

  const route = matchPrFilesRoute(location.pathname);
  if (current && current.key === route?.key) return;

  current?.controller.stop();
  current = null;
  if (!route) return;

  const controller = new PrFilesController(route.repo);
  current = { key: route.key, controller };
  void controller.start();
}

syncWithLocation();
window.addEventListener('popstate', syncWithLocation);
document.addEventListener('turbo:load', syncWithLocation);
// Las navegaciones con pushState no emiten eventos; se detectan como cambios en el DOM.
new MutationObserver(syncWithLocation).observe(document.documentElement, { childList: true, subtree: true });
