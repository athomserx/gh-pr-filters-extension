import { describe, expect, it } from 'vitest';
import { parseOwners } from '../src/owners';

describe('parseOwners', () => {
  it('extrae un usuario', () => {
    expect(parseOwners('Owned by @octocat (from CODEOWNERS line 56)')).toEqual(['@octocat']);
  });

  it('extrae usuarios y equipos sin duplicados', () => {
    expect(parseOwners('Owned by @alice @acme/backend-team @alice (from CODEOWNERS line 3)')).toEqual([
      '@alice',
      '@acme/backend-team',
    ]);
  });

  it('ignora correos', () => {
    expect(parseOwners('Owned by dev@example.com @bob')).toEqual(['@bob']);
  });

  it('devuelve vacío sin handles', () => {
    expect(parseOwners('')).toEqual([]);
  });
});
