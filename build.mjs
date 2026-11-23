// Empaqueta la extensión en dist/, lista para "Load unpacked" en brave://extensions.
import * as esbuild from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

/** Copia los archivos estáticos; la versión del manifest sale de package.json para no duplicarla. */
async function copyStatic() {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const manifest = JSON.parse(await readFile('src/manifest.json', 'utf8'));
  manifest.version = pkg.version;
  await writeFile(`${outdir}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  await copyFile('src/styles.css', `${outdir}/styles.css`);
}

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const options = {
  entryPoints: ['src/content.ts'],
  outfile: `${outdir}/content.js`,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  sourcemap: watch ? 'inline' : false,
  logLevel: 'info',
  plugins: [{ name: 'static', setup: (build) => build.onEnd(copyStatic) }],
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
