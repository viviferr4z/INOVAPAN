import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const raw = process.env.INOVAPAN_API_URL || '';
if (process.env.VERCEL && !raw) throw new Error('Defina INOVAPAN_API_URL na Vercel com a URL HTTPS real do Render terminada em /api.');
const url = new URL(raw || 'http://localhost:3000/api');
if (url.search || url.hash || url.username || url.password || url.pathname.replace(/\/$/,'') !== '/api') throw new Error('INOVAPAN_API_URL deve terminar em /api, sem credenciais, consulta ou fragmento.');
if (raw && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Para publicar, informe a URL HTTPS pública da API.');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of await readdir(root)) {
  if (entry.endsWith('.html') || ['css', 'js', 'vendor'].includes(entry)) await cp(path.join(root, entry), path.join(out, entry), { recursive: true });
}
await writeFile(path.join(out, 'js/config.js'), `window.INOVAPAN_API = ${JSON.stringify(url.href.replace(/\/$/,''))};\n`);
console.log('UI gerada em dist. A pasta contém somente arquivos públicos.');
