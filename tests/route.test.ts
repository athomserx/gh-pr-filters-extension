import { describe, expect, it } from 'vitest';
import { matchPrFilesRoute } from '../src/route';

describe('matchPrFilesRoute', () => {
  it.each(['/acme/repo/pull/12/files', '/acme/repo/pull/12/changes', '/acme/repo/pull/12/files/abc123'])(
    'reconoce %s',
    (path) => expect(matchPrFilesRoute(path)).toEqual({ repo: 'acme/repo', key: 'acme/repo#12' }),
  );

  it.each(['/acme/repo/pull/12', '/acme/repo/pull/12/commits', '/acme/repo', '/acme/repo/pull/12/filesx'])(
    'ignora %s',
    (path) => expect(matchPrFilesRoute(path)).toBeNull(),
  );
});
