/** Identifica la página "Files changed" de un PR concreto. */
export interface PrFilesRoute {
  /** `owner/repo`. */
  repo: string;
  /** `owner/repo#n`, para detectar el cambio de PR sin recargar. */
  key: string;
}

const PR_FILES_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/(?:files|changes)(?:\/|$)/;

/**
 * Reconoce si una ruta corresponde a la pestaña de archivos de un PR.
 *
 * @param pathname `location.pathname`.
 * @returns Los datos del PR, o `null` si la ruta no aplica.
 */
export function matchPrFilesRoute(pathname: string): PrFilesRoute | null {
  const match = PR_FILES_PATH.exec(pathname);
  if (!match) return null;
  const [, owner, name, number] = match;
  const repo = `${owner}/${name}`;
  return { repo, key: `${repo}#${number}` };
}
