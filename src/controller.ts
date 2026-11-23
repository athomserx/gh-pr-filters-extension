import {
  collectOwners,
  isFileVisible,
  isFilterActive,
  isFolderHidden,
  treeFileState,
  type FileInfo,
  type FilterState,
} from './filter';
import { FilterPanel, PANEL_ID } from './panel';
import { readDiffBlock, readTree } from './scanner';
import { SELECTORS } from './selectors';
import { loadFilter, loadPanelCollapsed, saveFilter, savePanelCollapsed } from './storage';

/** Atributo que oculta un elemento vía `styles.css`. */
const HIDDEN_ATTR = 'data-ghpf-hidden';
/** Atributo que atenúa un elemento del árbol cuyo estado aún se desconoce. */
const UNKNOWN_ATTR = 'data-ghpf-unknown';

/**
 * Aplica los filtros en la pestaña de archivos de un PR. Acumula lo que va aprendiendo de cada
 * archivo porque GitHub renderiza los bloques de forma progresiva.
 */
export class PrFilesController {
  private readonly known = new Map<string, FileInfo>();
  private filter: FilterState = { owners: [], viewedMode: 'all' };
  private panel: FilterPanel | null = null;
  private observer: MutationObserver | null = null;
  private frame = 0;
  private stopped = false;

  /**
   * @param repo `owner/repo` del PR, usado para persistir la selección de owners.
   */
  constructor(private readonly repo: string) {}

  /** Carga la configuración, inserta el panel y empieza a observar el DOM. */
  async start(): Promise<void> {
    const [filter, collapsed] = await Promise.all([loadFilter(this.repo), loadPanelCollapsed()]);
    if (this.stopped) return;
    this.filter = filter;
    this.panel = new FilterPanel(
      {
        onFilterChange: (next) => {
          this.filter = next;
          void saveFilter(this.repo, next);
          this.apply();
        },
        onCollapsedChange: (next) => void savePanelCollapsed(next),
      },
      collapsed,
    );
    document.body.append(this.panel.element);

    this.observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => !isInsidePanel(m.target))) this.schedule();
    });
    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'aria-label', 'aria-expanded'],
    });
    this.apply();
  }

  /** Detiene la observación, quita el panel y deja la página como estaba. */
  stop(): void {
    this.stopped = true;
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
    this.panel?.element.remove();
    for (const node of document.querySelectorAll(`[${HIDDEN_ATTR}], [${UNKNOWN_ATTR}]`)) {
      node.removeAttribute(HIDDEN_ATTR);
      node.removeAttribute(UNKNOWN_ATTR);
    }
  }

  /** Agrupa varios cambios del DOM en una sola pasada por frame. */
  private schedule(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.apply();
    });
  }

  /** Lee el estado de la página y oculta o muestra bloques y elementos del árbol. */
  private apply(): void {
    const active = isFilterActive(this.filter);
    const hiddenPaths = new Set<string>();

    for (const block of document.querySelectorAll(SELECTORS.diffBlock)) {
      const info = readDiffBlock(block);
      if (!info) continue;
      this.known.set(info.path, info);
      const hidden = active && !isFileVisible(info, this.filter);
      setFlag(block, HIDDEN_ATTR, hidden);
    }

    // Archivos ya vistos pero cuyo bloque GitHub pudo desmontar siguen contando.
    let shown = 0;
    for (const info of this.known.values()) {
      if (!active || isFileVisible(info, this.filter)) shown++;
      else hiddenPaths.add(info.path);
    }

    const tree = readTree(document);
    for (const [path, item] of tree.files) {
      const state = treeFileState(this.known.get(path), this.filter);
      setFlag(item, HIDDEN_ATTR, state === 'hidden');
      setFlag(item, UNKNOWN_ATTR, state === 'unknown');
    }

    const allPaths = new Set([...tree.files.keys(), ...this.known.keys()]);
    for (const [path, item] of tree.folders) {
      setFlag(item, HIDDEN_ATTR, active && isFolderHidden(path, allPaths, hiddenPaths));
    }

    this.panel?.render({
      availableOwners: collectOwners(this.known.values()),
      filter: this.filter,
      counts: { loaded: this.known.size, total: allPaths.size, shown },
    });
  }
}

/**
 * Activa o quita un atributo booleano solo si cambia, para no generar mutaciones innecesarias.
 *
 * @param node Elemento a marcar.
 * @param attr Nombre del atributo.
 * @param on Estado deseado.
 */
function setFlag(node: Element, attr: string, on: boolean): void {
  if (node.hasAttribute(attr) !== on) node.toggleAttribute(attr, on);
}

/**
 * Indica si un nodo pertenece al panel, cuyos cambios no deben disparar un nuevo filtrado.
 *
 * @param node Nodo mutado.
 */
function isInsidePanel(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  return element?.closest(`#${PANEL_ID}`) != null;
}
