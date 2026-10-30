// Captura a versão de computador para conferência visual. Uso: node tests/desktop.shot.mjs <pasta>
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import puppeteer from 'puppeteer-core';
const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public'); const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(pub, q.url === '/' ? 'index.html' : q.url.split('?')[0]); if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', T[path.extname(f)] || 'text/plain'); r.end(fs.readFileSync(f)); });
await new Promise((r) => srv.listen(0, r));
const b = await puppeteer.launch({ executablePath: ['C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync), headless: true });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); await p.goto(`http://localhost:${srv.address().port}`);
const clicar = async (s, c) => { const h = await p.evaluateHandle((s, c) => [...document.querySelectorAll(s)].find((e) => !c || e.textContent.includes(c)), s, c); await h.asElement().click(); };
const foto = async (n) => { await new Promise((r) => setTimeout(r, 650)); await p.screenshot({ path: path.join(out, n + '.png') }); };
await foto('d1-inicio'); await clicar('button', 'Começar'); await clicar('.redondo'); await foto('d2-confirmar');
await clicar('#q-CRY-06 .conf button', 'Confirmar'); await new Promise((r) => setTimeout(r, 900)); await foto('d3-texto');
await b.close(); srv.close();
