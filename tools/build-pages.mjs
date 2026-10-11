import { build } from 'esbuild';
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'public'), dist, { recursive: true });
const result = await build({
  entryPoints: [resolve(root, 'src/index.ts')],
  outfile: resolve(dist, '_worker.js'),
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  bundle: true,
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  conditions: ['workerd', 'worker', 'browser'],
  logLevel: 'warning',
});
if (result.errors.length) process.exit(1);
const st = await stat(resolve(dist, '_worker.js'));
console.log('ATPCURSOS_PAGES_BUILD_OK', st.size);
