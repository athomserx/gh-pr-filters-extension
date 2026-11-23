/**
 * Selectores del DOM de "Files changed" (UI en React de GitHub).
 * Centralizados aquí porque GitHub cambia su markup con frecuencia.
 * Se evitan las clases con hash (p. ej. `diff__GZFl4M`), que cambian en cada despliegue.
 */
export const SELECTORS = {
  /** Bloque completo de un archivo (cabecera + diff). Su `id` es `diff-<sha256 de la ruta>`. */
  diffBlock: 'div[role="region"][id^="diff-"]',
  /** Texto con la ruta del archivo dentro de la cabecera. */
  diffPath: '[data-diff-header-wrapper] h3 a[href^="#diff-"] code',
  /** Enlace con el escudo de CODEOWNERS; su tooltip trae los owners. */
  codeownersLink: '[data-diff-header-wrapper] a[href*="/CODEOWNERS#L"]',
  /** Botones con estado presionado; el de "Viewed" se distingue por su etiqueta. */
  pressedButton: '[data-diff-header-wrapper] button[aria-pressed]',
  /** Elemento del árbol lateral; su `id` es la ruta completa. */
  treeItem: 'li[role="treeitem"]',
} as const;

/** Etiqueta del botón de visto, en sus dos estados ("Viewed" / "Not Viewed"). */
export const VIEWED_LABEL = /viewed/i;
