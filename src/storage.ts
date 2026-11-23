import { DEFAULT_FILTER, type FilterState, type ViewedMode } from './filter';

const VIEWED_MODE_KEY = 'viewedMode';
const PANEL_COLLAPSED_KEY = 'panelCollapsed';
const VIEWED_MODES: readonly ViewedMode[] = ['all', 'hideViewed', 'onlyViewed'];

/**
 * Clave de la selección de owners; se guarda por repositorio porque los owners difieren entre repos.
 *
 * @param repo `owner/repo`.
 */
function ownersKey(repo: string): string {
  return `owners:${repo}`;
}

/**
 * Carga los criterios guardados: el modo de vistos es global y los owners son por repositorio.
 *
 * @param repo `owner/repo`.
 */
export async function loadFilter(repo: string): Promise<FilterState> {
  const key = ownersKey(repo);
  const stored = await chrome.storage.local.get([VIEWED_MODE_KEY, key]);
  const viewedMode = VIEWED_MODES.find((mode) => mode === stored[VIEWED_MODE_KEY]) ?? DEFAULT_FILTER.viewedMode;
  const rawOwners = stored[key];
  const owners = Array.isArray(rawOwners) ? rawOwners.filter((o): o is string => typeof o === 'string') : [];
  return { owners, viewedMode };
}

/**
 * Guarda los criterios actuales.
 *
 * @param repo `owner/repo`.
 * @param filter Criterios a persistir.
 */
export async function saveFilter(repo: string, filter: FilterState): Promise<void> {
  await chrome.storage.local.set({ [VIEWED_MODE_KEY]: filter.viewedMode, [ownersKey(repo)]: filter.owners });
}

/** Indica si el usuario dejó el panel colapsado. */
export async function loadPanelCollapsed(): Promise<boolean> {
  const stored = await chrome.storage.local.get(PANEL_COLLAPSED_KEY);
  return stored[PANEL_COLLAPSED_KEY] === true;
}

/**
 * Guarda si el panel está colapsado.
 *
 * @param collapsed Nuevo estado.
 */
export async function savePanelCollapsed(collapsed: boolean): Promise<void> {
  await chrome.storage.local.set({ [PANEL_COLLAPSED_KEY]: collapsed });
}
