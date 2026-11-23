import type { FileInfo } from './filter';
import { parseOwners } from './owners';
import { SELECTORS, VIEWED_LABEL } from './selectors';

/**
 * Lee la información de un bloque de archivo del diff.
 *
 * @param block Elemento que coincide con `SELECTORS.diffBlock`.
 * @returns La información del archivo, o `null` si la cabecera aún no tiene ruta.
 */
export function readDiffBlock(block: Element): FileInfo | null {
  const path = block.querySelector(SELECTORS.diffPath)?.textContent?.trim();
  if (!path) return null;
  return { path, owners: readOwners(block), viewed: readViewed(block) };
}

/**
 * Owners del archivo según el tooltip del escudo de CODEOWNERS.
 *
 * @param block Bloque del archivo.
 */
function readOwners(block: Element): string[] {
  const link = block.querySelector(SELECTORS.codeownersLink);
  if (!link) return [];
  const tooltipId = link.getAttribute('aria-labelledby') ?? link.getAttribute('aria-describedby');
  // El tooltip suele ser hermano del enlace; se busca primero en el bloque y luego en el documento.
  const tooltip = tooltipId
    ? (block.querySelector(`[id="${CSS.escape(tooltipId)}"]`) ?? block.ownerDocument.getElementById(tooltipId))
    : null;
  const label = tooltip?.getAttribute('aria-label') ?? tooltip?.textContent ?? link.getAttribute('aria-label') ?? '';
  return parseOwners(label);
}

/**
 * Estado de visto según el botón "Viewed" de la cabecera.
 *
 * @param block Bloque del archivo.
 */
function readViewed(block: Element): boolean {
  const button = [...block.querySelectorAll(SELECTORS.pressedButton)].find((candidate) =>
    VIEWED_LABEL.test(candidate.getAttribute('aria-label') ?? candidate.textContent ?? ''),
  );
  return button?.getAttribute('aria-pressed') === 'true';
}

/** Elementos del árbol lateral, separados en archivos y carpetas e indexados por ruta. */
export interface TreeItems {
  files: Map<string, Element>;
  folders: Map<string, Element>;
}

/**
 * Recorre el árbol lateral de archivos. Las carpetas se reconocen por tener `aria-expanded`.
 *
 * @param root Raíz donde buscar (normalmente `document`).
 */
export function readTree(root: ParentNode): TreeItems {
  const items: TreeItems = { files: new Map(), folders: new Map() };
  for (const item of root.querySelectorAll(SELECTORS.treeItem)) {
    const path = item.id;
    if (!path) continue;
    (item.hasAttribute('aria-expanded') ? items.folders : items.files).set(path, item);
  }
  return items;
}
