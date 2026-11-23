import { describe, expect, it } from 'vitest';
import {
  NO_OWNER,
  collectOwners,
  isFileVisible,
  isFilterActive,
  isFolderHidden,
  treeFileState,
  type FileInfo,
  type FilterState,
} from '../src/filter';

const file = (path: string, owners: string[], viewed = false): FileInfo => ({ path, owners, viewed });
const filter = (owners: string[], viewedMode: FilterState['viewedMode'] = 'all'): FilterState => ({ owners, viewedMode });

describe('isFilterActive', () => {
  it('inactivo por defecto', () => expect(isFilterActive(filter([]))).toBe(false));
  it('activo con owners', () => expect(isFilterActive(filter(['@a']))).toBe(true));
  it('activo con modo de vistos', () => expect(isFilterActive(filter([], 'onlyViewed'))).toBe(true));
});

describe('isFileVisible', () => {
  it('sin owners seleccionados no filtra por owner', () => {
    expect(isFileVisible(file('x', ['@a']), filter([]))).toBe(true);
  });

  it('muestra si coincide algún owner', () => {
    expect(isFileVisible(file('x', ['@a', '@org/t']), filter(['@org/t']))).toBe(true);
    expect(isFileVisible(file('x', ['@a']), filter(['@b']))).toBe(false);
  });

  it('archivos sin owner solo con NO_OWNER seleccionado', () => {
    expect(isFileVisible(file('x', []), filter(['@a']))).toBe(false);
    expect(isFileVisible(file('x', []), filter(['@a', NO_OWNER]))).toBe(true);
    expect(isFileVisible(file('x', ['@a']), filter([NO_OWNER]))).toBe(false);
  });

  it('modos de vistos', () => {
    expect(isFileVisible(file('x', [], true), filter([], 'hideViewed'))).toBe(false);
    expect(isFileVisible(file('x', [], false), filter([], 'hideViewed'))).toBe(true);
    expect(isFileVisible(file('x', [], true), filter([], 'onlyViewed'))).toBe(true);
    expect(isFileVisible(file('x', [], false), filter([], 'onlyViewed'))).toBe(false);
  });

  it('combina owners y vistos con AND', () => {
    expect(isFileVisible(file('x', ['@a'], true), filter(['@a'], 'hideViewed'))).toBe(false);
    expect(isFileVisible(file('x', ['@a'], true), filter(['@a'], 'onlyViewed'))).toBe(true);
  });
});

describe('treeFileState', () => {
  it('todo visible sin filtro, aunque no esté cargado', () => {
    expect(treeFileState(undefined, filter([]))).toBe('visible');
  });
  it('desconocido si no está cargado y hay filtro', () => {
    expect(treeFileState(undefined, filter(['@a']))).toBe('unknown');
  });
  it('oculto o visible según el filtro', () => {
    expect(treeFileState(file('x', ['@a']), filter(['@a']))).toBe('visible');
    expect(treeFileState(file('x', ['@b']), filter(['@a']))).toBe('hidden');
  });
});

describe('isFolderHidden', () => {
  const paths = ['src/a.ts', 'src/b.ts', 'src/lib/c.ts', 'srcx/d.ts'];

  it('oculta si todos los descendientes están ocultos', () => {
    expect(isFolderHidden('src', paths, new Set(['src/a.ts', 'src/b.ts', 'src/lib/c.ts']))).toBe(true);
  });
  it('visible si algún descendiente está visible', () => {
    expect(isFolderHidden('src', paths, new Set(['src/a.ts', 'src/b.ts']))).toBe(false);
  });
  it('no confunde prefijos de nombre', () => {
    expect(isFolderHidden('src', paths, new Set(['src/a.ts', 'src/b.ts', 'src/lib/c.ts', 'srcx/d.ts']))).toBe(true);
    expect(isFolderHidden('srcx', paths, new Set(['src/a.ts']))).toBe(false);
  });
  it('visible si no tiene descendientes conocidos', () => {
    expect(isFolderHidden('empty', paths, new Set(paths))).toBe(false);
  });
});

describe('collectOwners', () => {
  it('únicos y ordenados', () => {
    expect(collectOwners([file('a', ['@b', '@a']), file('b', ['@a']), file('c', [])])).toEqual(['@a', '@b']);
  });
});
