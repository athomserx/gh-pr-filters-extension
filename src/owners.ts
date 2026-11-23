/**
 * Extrae los handles de owners (`@usuario` o `@org/equipo`) de una etiqueta de CODEOWNERS,
 * p. ej. "Owned by @a @org/b (from CODEOWNERS line 56)".
 * Ignora correos (`dev@example.com`), que CODEOWNERS también admite como owner.
 *
 * @param label Texto de la etiqueta del escudo.
 * @returns Handles únicos, en orden de aparición, con el `@` incluido.
 */
export function parseOwners(label: string): string[] {
  const matches = label.match(/(?<![\w.])@[A-Za-z0-9][\w.-]*(?:\/[\w.-]+)?/g) ?? [];
  return [...new Set(matches)];
}
