// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrFilesController } from '../src/controller';
import fixture from './fixtures/pr.html?raw';

const store: Record<string, unknown> = {};

/** `chrome.storage.local` en memoria. */
function stubChrome(): void {
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: async (keys: string | string[]) =>
          Object.fromEntries([keys].flat().filter((k) => k in store).map((k) => [k, store[k]])),
        set: async (items: Record<string, unknown>) => Object.assign(store, items),
      },
    },
  });
}

const hidden = (selector: string) => document.querySelector(selector)?.hasAttribute('data-ghpf-hidden');
const byPath = (path: string) => `li[id="${path}"]`;
const flush = () => new Promise((resolve) => setTimeout(resolve, 50));

let controller: PrFilesController;

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
  stubChrome();
  document.body.innerHTML = fixture;
});

afterEach(() => {
  controller.stop();
  vi.unstubAllGlobals();
});

describe('PrFilesController', () => {
  it('sin filtros no oculta nada y lista los owners encontrados', async () => {
    controller = new PrFilesController('acme/repo');
    await controller.start();
    expect(document.querySelectorAll('[data-ghpf-hidden], [data-ghpf-unknown]')).toHaveLength(0);
    const owners = [...document.querySelectorAll('#ghpf-panel .ghpf-owners input')].map((i) => (i as HTMLInputElement).value);
    expect(owners).toEqual(['@acme/backend', '@alice', '@octocat', '__no_owner__']);
    expect(document.querySelector('.ghpf-count')?.textContent).toBe('Showing 3 of 3 loaded · 4 files in PR');
  });

  it('aplica el filtro guardado de owner en bloques, árbol y carpetas', async () => {
    store['owners:acme/repo'] = ['@octocat'];
    controller = new PrFilesController('acme/repo');
    await controller.start();

    expect(hidden('#diff-aaa')).toBe(false);
    expect(hidden('#diff-bbb')).toBe(true);
    expect(hidden('#diff-ccc')).toBe(true);
    expect(hidden(byPath('apps/api/Shared.cs'))).toBe(true);
    expect(hidden(byPath('apps/api'))).toBe(false);
    // La carpeta tests tiene un archivo no cargado, así que no se oculta y ese archivo queda atenuado.
    expect(hidden(byPath('apps/tests'))).toBe(false);
    expect(document.querySelector(byPath('apps/tests/NotLoaded.cs'))?.hasAttribute('data-ghpf-unknown')).toBe(true);
    expect(document.querySelector('.ghpf-count')?.textContent).toBe('Showing 1 of 3 loaded · 4 files in PR');
  });

  it('reacciona al marcar un archivo como visto', async () => {
    store.viewedMode = 'hideViewed';
    controller = new PrFilesController('acme/repo');
    await controller.start();
    expect(hidden('#diff-aaa')).toBe(true);
    expect(hidden('#diff-bbb')).toBe(false);

    const button = document.querySelector('#diff-bbb button[aria-pressed]')!;
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', 'Viewed');
    await flush();
    expect(hidden('#diff-bbb')).toBe(true);
  });

  it('el panel cambia y persiste el filtro', async () => {
    controller = new PrFilesController('acme/repo');
    await controller.start();
    const onlyViewed = document.querySelector<HTMLInputElement>('#ghpf-panel input[value="onlyViewed"]')!;
    onlyViewed.click();
    expect(hidden('#diff-aaa')).toBe(false);
    expect(hidden('#diff-bbb')).toBe(true);
    await flush();
    expect(store.viewedMode).toBe('onlyViewed');
  });

  it('stop limpia marcas y panel', async () => {
    store.viewedMode = 'hideViewed';
    controller = new PrFilesController('acme/repo');
    await controller.start();
    controller.stop();
    expect(document.querySelectorAll('[data-ghpf-hidden], #ghpf-panel')).toHaveLength(0);
  });
});
