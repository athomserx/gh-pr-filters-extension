/** Modo del filtro de archivos vistos. */
export type ViewedMode = 'all' | 'hideViewed' | 'onlyViewed';

/** Valor especial en la selección de owners que representa a los archivos sin owner. */
export const NO_OWNER = '__no_owner__';

/** Criterios de filtrado elegidos por el usuario. */
export interface FilterState {
  /** Handles seleccionados (y opcionalmente `NO_OWNER`). Vacío = sin filtro de owners. */
  owners: string[];
  viewedMode: ViewedMode;
}

/** Lo que se sabe de un archivo del PR una vez que su bloque se renderizó. */
export interface FileInfo {
  path: string;
  owners: string[];
  viewed: boolean;
}

/** Estado de un archivo en el árbol lateral. `unknown` = su bloque aún no se ha cargado. */
export type TreeFileState = 'visible' | 'hidden' | 'unknown';

export const DEFAULT_FILTER: FilterState = { owners: [], viewedMode: 'all' };

/**
 * Indica si hay algún criterio que oculte archivos.
 *
 * @param filter Criterios actuales.
 */
export function isFilterActive(filter: FilterState): boolean {
  return filter.owners.length > 0 || filter.viewedMode !== 'all';
}

/**
 * Decide si un archivo pasa los filtros. Owners y vistos se combinan con AND;
 * dentro de owners basta con que coincida alguno.
 *
 * @param file Información del archivo.
 * @param filter Criterios actuales.
 */
export function isFileVisible(file: FileInfo, filter: FilterState): boolean {
  if (filter.viewedMode === 'hideViewed' && file.viewed) return false;
  if (filter.viewedMode === 'onlyViewed' && !file.viewed) return false;
  if (filter.owners.length === 0) return true;
  if (file.owners.length === 0) return filter.owners.includes(NO_OWNER);
  return file.owners.some((owner) => filter.owners.includes(owner));
}

/**
 * Estado de un archivo en el árbol lateral, considerando que puede no estar cargado aún.
 *
 * @param file Información conocida del archivo, o `undefined` si su bloque no se ha visto.
 * @param filter Criterios actuales.
 */
export function treeFileState(file: FileInfo | undefined, filter: FilterState): TreeFileState {
  if (!isFilterActive(filter)) return 'visible';
  if (!file) return 'unknown';
  return isFileVisible(file, filter) ? 'visible' : 'hidden';
}

/**
 * Una carpeta se oculta solo si tiene archivos conocidos debajo y todos están ocultos.
 *
 * @param folderPath Ruta de la carpeta, sin `/` final.
 * @param filePaths Todas las rutas de archivos conocidas (árbol + bloques).
 * @param hiddenPaths Rutas de archivos ocultos.
 */
export function isFolderHidden(
  folderPath: string,
  filePaths: Iterable<string>,
  hiddenPaths: ReadonlySet<string>,
): boolean {
  const prefix = `${folderPath}/`;
  let hasDescendants = false;
  for (const path of filePaths) {
    if (!path.startsWith(prefix)) continue;
    if (!hiddenPaths.has(path)) return false;
    hasDescendants = true;
  }
  return hasDescendants;
}

/**
 * Owners distintos presentes en los archivos conocidos, ordenados alfabéticamente.
 *
 * @param files Archivos conocidos.
 */
export function collectOwners(files: Iterable<FileInfo>): string[] {
  const owners = new Set<string>();
  for (const file of files) file.owners.forEach((owner) => owners.add(owner));
  return [...owners].sort((a, b) => a.localeCompare(b));
}
