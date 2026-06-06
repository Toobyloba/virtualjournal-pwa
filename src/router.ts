// ── router.ts ─────────────────────────────────────────────────────────────────

import { isLocked }    from './auth';
import { loadSettings } from './storage';

export type Route =
  | { name: 'lock' }
  | { name: 'setup' }
  | { name: 'home' }
  | { name: 'editor';    id?: string }
  | { name: 'entry';     id: string  }
  | { name: 'settings' };

type ScreenRenderer = (route: Route, container: HTMLElement) => void | Promise<void>;
let renderer: ScreenRenderer | null = null;
let appContainer: HTMLElement | null = null;

export function initRouter(
  container: HTMLElement,
  render: ScreenRenderer
): void {
  appContainer = container;
  renderer = render;
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

async function handleRoute(): Promise<void> {
  if (!renderer || !appContainer) return;

  const settings = await loadSettings();
  const hash     = location.hash.replace('#', '') || 'home';
  const [path, query] = hash.split('?');
  const params = new URLSearchParams(query ?? '');

  // Guard: redirect to lock if session expired
  const publicRoutes = ['lock', 'setup'];
  if (!publicRoutes.includes(path) && isLocked()) {
    if (!settings.hasVault) {
      location.hash = '#setup';
    } else {
      location.hash = '#lock';
    }
    return;
  }

  let route: Route;
  switch (path) {
    case 'setup':    route = { name: 'setup' };                        break;
    case 'lock':     route = { name: 'lock' };                         break;
    case 'editor':   route = { name: 'editor', id: params.get('id') ?? undefined }; break;
    case 'entry':    route = { name: 'entry',  id: params.get('id')! }; break;
    case 'settings': route = { name: 'settings' };                     break;
    default:         route = { name: 'home' };
  }

  await renderer(route, appContainer);
}

export function navigate(hash: string): void {
  location.hash = hash;
}
