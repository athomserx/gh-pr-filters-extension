// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { readDiffBlock, readTree } from '../src/scanner';
import { SELECTORS } from '../src/selectors';
import fixture from './fixtures/pr.html?raw';

beforeEach(() => {
  document.body.innerHTML = fixture;
});

describe('readDiffBlock', () => {
  it('lee ruta, owners y vistos de cada bloque', () => {
    const files = [...document.querySelectorAll(SELECTORS.diffBlock)].map(readDiffBlock);
    expect(files).toEqual([
      { path: 'apps/api/VentaController.cs', owners: ['@octocat'], viewed: true },
      { path: 'apps/api/Shared.cs', owners: ['@alice', '@acme/backend'], viewed: false },
      { path: 'apps/tests/CargueTests.cs', owners: [], viewed: false },
    ]);
  });

  it('devuelve null si la cabecera aún no tiene ruta', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div data-diff-header-wrapper="true"></div>';
    expect(readDiffBlock(block)).toBeNull();
  });
});

describe('readTree', () => {
  it('separa archivos y carpetas por ruta', () => {
    const tree = readTree(document);
    expect([...tree.folders.keys()]).toEqual(['apps', 'apps/api', 'apps/tests']);
    expect([...tree.files.keys()]).toEqual([
      'apps/api/VentaController.cs',
      'apps/api/Shared.cs',
      'apps/tests/CargueTests.cs',
      'apps/tests/NotLoaded.cs',
    ]);
  });
});
