import { NO_OWNER, isFilterActive, type FilterState, type ViewedMode } from './filter';

/** Conteo de archivos mostrado en el panel. */
export interface FileCounts {
  /** Archivos cuyo bloque ya se renderizó. */
  loaded: number;
  /** Total de archivos conocidos (árbol lateral + bloques). */
  total: number;
  /** Archivos cargados que pasan el filtro. */
  shown: number;
}

/** Datos que el panel necesita para pintarse. */
export interface PanelModel {
  availableOwners: string[];
  filter: FilterState;
  counts: FileCounts;
}

/** Acciones que el panel delega a quien lo controla. */
export interface PanelCallbacks {
  onFilterChange(filter: FilterState): void;
  onCollapsedChange(collapsed: boolean): void;
}

const VIEWED_OPTIONS: ReadonlyArray<[ViewedMode, string]> = [
  ['all', 'All'],
  ['hideViewed', 'Hide viewed'],
  ['onlyViewed', 'Only viewed'],
];

export const PANEL_ID = 'ghpf-panel';

/** Panel flotante con los controles de filtrado. */
export class FilterPanel {
  readonly element: HTMLElement;
  private readonly ownersList: HTMLElement;
  private readonly countText: HTMLElement;
  private readonly activeBadge: HTMLElement;
  private readonly viewedInputs = new Map<ViewedMode, HTMLInputElement>();
  private filter: FilterState = { owners: [], viewedMode: 'all' };
  private ownersSignature = '';

  /**
   * Construye el panel (sin insertarlo en el documento).
   *
   * @param callbacks Acciones a ejecutar ante cambios del usuario.
   * @param collapsed Estado inicial de colapso.
   */
  constructor(
    private readonly callbacks: PanelCallbacks,
    collapsed: boolean,
  ) {
    this.element = el('aside', { id: PANEL_ID, className: 'ghpf-panel' });
    this.element.toggleAttribute('data-collapsed', collapsed);

    const toggle = el('button', { type: 'button', className: 'ghpf-toggle' });
    toggle.append(el('span', { textContent: 'PR filters' }));
    this.activeBadge = el('span', { className: 'ghpf-badge', textContent: 'on' });
    toggle.append(this.activeBadge);
    toggle.addEventListener('click', () => {
      const next = !this.element.hasAttribute('data-collapsed');
      this.element.toggleAttribute('data-collapsed', next);
      this.callbacks.onCollapsedChange(next);
    });

    const body = el('div', { className: 'ghpf-body' });

    const ownersSection = el('fieldset', { className: 'ghpf-section' });
    ownersSection.append(el('legend', { textContent: 'Owners' }));
    this.ownersList = el('div', { className: 'ghpf-owners' });
    ownersSection.append(this.ownersList);

    const viewedSection = el('fieldset', { className: 'ghpf-section' });
    viewedSection.append(el('legend', { textContent: 'Viewed' }));
    for (const [mode, text] of VIEWED_OPTIONS) {
      const input = el('input', { type: 'radio', name: 'ghpf-viewed', value: mode });
      input.addEventListener('change', () => this.emit({ ...this.filter, viewedMode: mode }));
      this.viewedInputs.set(mode, input);
      viewedSection.append(labeled(input, text));
    }

    this.countText = el('p', { className: 'ghpf-count' });

    const clear = el('button', { type: 'button', className: 'ghpf-clear', textContent: 'Clear filters' });
    clear.addEventListener('click', () => this.emit({ owners: [], viewedMode: 'all' }));

    body.append(ownersSection, viewedSection, this.countText, clear);
    this.element.append(toggle, body);
  }

  /**
   * Actualiza el panel. La lista de owners solo se reconstruye si cambió, para no perder el foco.
   *
   * @param model Datos a mostrar.
   */
  render(model: PanelModel): void {
    this.filter = model.filter;

    // Se incluyen owners guardados que no aparecen en este PR para poder deseleccionarlos.
    const owners = [...new Set([...model.availableOwners, ...model.filter.owners.filter((o) => o !== NO_OWNER)])];
    const signature = owners.join('\n');
    if (signature !== this.ownersSignature) {
      this.ownersSignature = signature;
      this.renderOwners(owners);
    }
    for (const input of this.ownersList.querySelectorAll<HTMLInputElement>('input')) {
      input.checked = model.filter.owners.includes(input.value);
    }
    for (const [mode, input] of this.viewedInputs) input.checked = model.filter.viewedMode === mode;

    const { loaded, total, shown } = model.counts;
    this.countText.textContent = `Showing ${shown} of ${loaded} loaded · ${total} files in PR`;
    this.activeBadge.hidden = !isFilterActive(model.filter);
  }

  /**
   * Reconstruye las casillas de owners.
   *
   * @param owners Handles a listar.
   */
  private renderOwners(owners: string[]): void {
    const items: HTMLElement[] = [...owners, NO_OWNER].map((owner) => {
      const input = el('input', { type: 'checkbox', value: owner });
      input.addEventListener('change', () => {
        const selected = new Set(this.filter.owners);
        if (input.checked) selected.add(owner);
        else selected.delete(owner);
        this.emit({ ...this.filter, owners: [...selected] });
      });
      return labeled(input, owner === NO_OWNER ? '(no owner)' : owner);
    });
    if (owners.length === 0) {
      items.unshift(el('p', { className: 'ghpf-empty', textContent: 'No CODEOWNERS found yet' }));
    }
    this.ownersList.replaceChildren(...items);
  }

  /**
   * Notifica un cambio de criterios.
   *
   * @param filter Criterios nuevos.
   */
  private emit(filter: FilterState): void {
    this.filter = filter;
    this.callbacks.onFilterChange(filter);
  }
}

/**
 * Crea un elemento con propiedades iniciales.
 *
 * @param tag Etiqueta HTML.
 * @param props Propiedades a asignar.
 */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

/**
 * Envuelve un input en un `label` con texto.
 *
 * @param input Control.
 * @param text Texto visible.
 */
function labeled(input: HTMLInputElement, text: string): HTMLLabelElement {
  const label = el('label', { className: 'ghpf-option' });
  label.append(input, el('span', { textContent: text }));
  return label;
}
