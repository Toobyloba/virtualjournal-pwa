// ── main.ts ───────────────────────────────────────────────────────────────────

import { initRouter, navigate } from './router';
import { onLock }               from './auth';
import { loadSettings }         from './storage';
import { handleOAuthCallback, loadTokenFromIdb } from './drive';
import type { Route }           from './router';

import { renderLock }      from './screens/lock';
import { renderSetup }     from './screens/setup';
import { renderHome }      from './screens/home';
import { renderEditor }    from './screens/editor';
import { renderEntryView } from './screens/entryview';
import { renderSettings }  from './screens/settings';

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}

// On lock: redirect to lock screen
onLock(() => { navigate('#lock'); });

async function render(route: Route, container: HTMLElement): Promise<void> {
  container.innerHTML = '';

  switch (route.name) {
    case 'lock':     await renderLock(container);                       break;
    case 'setup':         renderSetup(container);                       break;
    case 'home':     await renderHome(container);                       break;
    case 'editor':   await renderEditor(container, route.id);           break;
    case 'entry':    await renderEntryView(container, route.id);        break;
    case 'settings': await renderSettings(container);                   break;
  }
}

async function init(): Promise<void> {
  // Handle Google OAuth redirect-back (token in URL hash)
  const wasOAuth = await handleOAuthCallback();
  if (!wasOAuth) {
    await loadTokenFromIdb();   // restore persisted token if still valid
  }

  const app = document.getElementById('app')!;
  const settings = await loadSettings();

  // Determine initial route
  if (!settings.hasVault) {
    location.hash = '#setup';
  } else if (!location.hash || location.hash === '#' || location.hash === '#home') {
    location.hash = '#lock';
  }

  initRouter(app, render);
}

init().catch(console.error);
