// Dependency-free preview/export server (no vite needed): bundles src/main.ts with Bun and serves
// app/public, plus /audio and /data from the repo root. Usage: bun scripts/serve.ts [--port 5173]
import path from 'node:path';
import { existsSync } from 'node:fs';

const APP = path.resolve(import.meta.dir, '..');
const ROOT = path.resolve(APP, '..');
const i = process.argv.indexOf('--port');
const port = i > 0 ? +process.argv[i + 1]! : 5173;

async function bundle() {
  const r = await Bun.build({ entrypoints: [path.join(APP, 'src/main.ts')], target: 'browser', format: 'esm', splitting: false, minify: false });
  if (!r.success) throw new Error(r.logs.map(String).join('\n'));
  return await r.outputs[0]!.text();
}

Bun.serve({
  port,
  async fetch(req) {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname);
    if (p === '/' ) p = '/index.html';
    if (p === '/src/main.ts') {
      try { return new Response(await bundle(), { headers: { 'content-type': 'text/javascript', 'cache-control': 'no-store' } }); }
      catch (e) { return new Response(`document.body.insertAdjacentHTML('beforeend', ${JSON.stringify('<pre style="color:#f55">' + String(e) + '</pre>')}); window.__pdoom = { error: ${JSON.stringify(String(e))} };`, { headers: { 'content-type': 'text/javascript' } }); }
    }
    const cands = [/^\/(audio|data)\//.test(p) ? path.join(ROOT, p) : '', path.join(APP, 'public', p), path.join(APP, p)].filter(Boolean);
    for (const f of cands) if (f.startsWith(ROOT) && existsSync(f) && !f.endsWith('/')) {
      const file = Bun.file(f);
      if (await file.exists()) return new Response(file);
    }
    return new Response('not found', { status: 404 });
  },
});
console.log(`serving http://localhost:${port}`);
