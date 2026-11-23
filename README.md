# GH PR Filters

Brave/Chromium extension (Manifest V3) that filters files in the **Files changed** tab of a GitHub pull request:

- **By owner**: show only files owned by one or more CODEOWNERS handles (users or teams), or files with no owner.
- **By viewed state**: all, hide viewed, or only viewed.

It reads the CODEOWNERS shield GitHub already renders in each file header, so it needs no token and makes no API calls. The only permission is `storage`.

## Install (unpacked)

```sh
pnpm install
pnpm build
```

1. Open `brave://extensions` (or `chrome://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select the `dist/` folder.

After rebuilding, click the reload icon on the extension card and refresh the PR page.

## Usage

Open a PR's **Files changed** tab. A floating panel appears at the bottom right:

- **Owners**: filled with the handles found on the page. No selection means no owner filter; with a selection, a file shows if *any* of its owners is selected.
- **Viewed**: combined with the owner filter (both must pass). Toggling a file's **Viewed** button re-filters live.
- **Counter**: `Showing K of N loaded · M files in PR`. GitHub renders large PRs progressively; files not loaded yet show dimmed in the file tree while a filter is active. Scroll to load them.

The viewed mode is remembered globally and the owner selection per repository.

## Limits

- Team owners (`@org/team`) are matched by exact handle; they are not expanded to members.
- Only the new (React) Files changed UI is supported.
- GitHub changes its markup often. All selectors live in `src/selectors.ts`.

## Development

```sh
pnpm dev        # watch build into dist/
pnpm test       # vitest (jsdom fixture in tests/fixtures/pr.html)
pnpm typecheck
pnpm check      # typecheck + test + build
```
