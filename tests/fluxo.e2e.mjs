// Verifica no Chrome real: uma pergunta por tela, avanço automático, condicionais, "não sei", dúvida,
// listas, serviços, retomada após recarregar, revisão, envio (sucesso e falha), PDF e compartilhamento.
// Uso: node tests/fluxo.e2e.mjs [pasta_para_capturas]   (precisa de Chrome instalado)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(aqui, '..', 'public');
const capturas = process.argv[2];
if (capturas) fs.mkdirSync(capturas, { recursive: true });
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const enviados = [];
let falhar = false;

const servidor = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/enviar') {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (falhar) return res.end(JSON.stringify({ ok: false, erro: 'Não foi possível enviar agora.' }));
      enviados.push(JSON.parse(b));
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  const arq = path.join(pub, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!arq.startsWith(pub) || !fs.existsSync(arq)) { res.statusCode = 404; return res.end(); }
  res.setHeader('content-type', TIPOS[path.extname(arq)] || 'text/plain');
  res.end(fs.readFileSync(arq));
});
await new Promise((r) => servidor.listen(0, r));
const base = `http://localhost:${servidor.address().port}`;

const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const navegador = await puppeteer.launch({ executablePath: chrome, headless: true });
const falhas = [];
const passo = async (nome, fn) => { try { await fn(); console.log('ok  -', nome); } catch (e) { falhas.push(nome); console.log('FALHOU -', nome, '\n   ', e.message.split('\n').slice(0, 6).join(' | ')); } };

const pagina = await navegador.newPage();
await pagina.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
const erros = [];
pagina.on('pageerror', (e) => erros.push(e.message));
pagina.on('dialog', (d) => d.accept());
await pagina.goto(base);

const foto = async (nome) => {
  if (!capturas) return;
  await new Promise((r) => setTimeout(r, 650)); // deixa a animação de entrada terminar
  await pagina.screenshot({ path: path.join(capturas, `${nome}.png`) });
};
const texto = (sel) => pagina.$eval(sel, (e) => e.textContent);
const clicar = async (seletor, conteudo) => {
  const h = await pagina.evaluateHandle((sel, c) => [...document.querySelectorAll(sel)].find((e) => !c || e.textContent.includes(c)), seletor, conteudo);
  assert.ok(h.asElement(), `não achei ${seletor} ${conteudo || ''}`);
  await h.asElement().evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); // evita clicar sob a barra fixa de baixo
  await h.asElement().click();
};
const proxima = () => clicar('.redondo');
const espera = (id) => pagina.waitForSelector(`#q-${id}`, { timeout: 4000 });
const idAtual = () => pagina.$eval('.q', (e) => e.dataset.id);
const irAoAssunto = async (titulo) => { await clicar('#topo-menu'); await clicar('.mapa button', titulo); await pagina.waitForSelector('.assunto'); };

await passo('abre na tela inicial, sem barra do topo', async () => {
  assert.match(await texto('h1'), /Alan/);
  assert.equal(await pagina.$eval('#topo', (e) => e.hidden), true);
  await foto('01-inicio');
});

await passo('começa pela entrada do assunto Criyotec e vai à primeira pergunta', async () => {
  await clicar('button', 'Começar');
  await pagina.waitForSelector('.assunto');
  assert.match(await texto('.assunto h2'), /Criyotec/);
  await foto('02-assunto');
  await proxima();
  await espera('CRY-06');
  assert.equal(await pagina.$eval('#topo', (e) => e.hidden), false);
  assert.equal((await pagina.$$('.q')).length, 1, 'só uma pergunta por tela');
  await foto('03-confirmar');
});

await passo('gradiente de meta: barra tem um trecho por assunto e o atual se destaca', async () => {
  assert.equal((await pagina.$$('#barra .seg')).length, 8);
  assert.equal((await pagina.$$('#barra .seg.atual')).length, 1);
});

await passo('Hick: confirmar mostra só 2 botões; "Ajustar" revela os outros 3', async () => {
  const visiveis = await pagina.$$eval('#q-CRY-06 .conf:not(.conf-sec) button', (b) => b.map((x) => x.textContent));
  assert.deepEqual(visiveis, ['Confirmar', 'Ajustar']);
  assert.equal(await pagina.$eval('#q-CRY-06 .conf-sec', (e) => e.hidden), true);
  assert.equal(await pagina.$eval('#q-CRY-06 details.mais', (d) => d.open), false, 'dúvida começa recolhida');
  await clicar('#q-CRY-06 .conf button', 'Ajustar');
  assert.equal(await pagina.$eval('#q-CRY-06 .conf-sec', (e) => e.hidden), false);
  assert.equal((await pagina.$$('#q-CRY-06 .conf-sec button')).length, 3);
});

await passo('corrigir exige texto e o progresso sobe', async () => {
  const antes = await texto('#barra-txt');
  await clicar('#q-CRY-06 .conf-sec button', 'Corrigir');
  await pagina.type('#t-CRY-06', 'o fornecedor já enviou o aviso');
  assert.notEqual(await texto('#barra-txt'), antes);
  await foto('04-corrigir');
});

await passo('pergunta importante com texto livre; escolha avança sozinha até o próximo assunto', async () => {
  await proxima(); await espera('CRY-01');
  await pagina.type('#q-CRY-01 textarea', 'faltam ver as mensagens em operação');
  await foto('05-texto');
  await proxima(); await espera('CRY-02q');
  await clicar('#q-CRY-02q .opcao', 'Em parte');
  await pagina.waitForSelector('.assunto');
  assert.match(await texto('.assunto h2'), /Betgo/);
});

await passo('gradiente de meta: ao concluir um assunto, o próximo mostra a conquista e quanto falta', async () => {
  const t = await texto('.conquista');
  assert.match(t, /Criyotec concluído/);
  assert.match(t, /Faltam \d+ perguntas? em \d+ assuntos?/);
  assert.equal(await pagina.$eval('#barra .seg', (s) => s.classList.contains('feito')), true);
});

await passo('confirmar avança sozinho para a próxima pergunta', async () => {
  await proxima(); await espera('BET-01');
  await clicar('#q-BET-01 .conf button', 'Confirmar');
  await espera('BET-01q');
  await foto('06-escolha-apos-avanco');
});

await passo('seções retiradas não aparecem no mapa', async () => {
  await clicar('#topo-menu');
  const titulos = await pagina.$$eval('.mapa strong', (n) => n.map((x) => x.textContent));
  assert.equal(titulos.includes('Leads fora do funil'), false);
  assert.equal(titulos.length, 8);
  await clicar('.mapa button', 'Betgo');
  await pagina.waitForSelector('.assunto');
});

await passo('Hick: lista com muitas opções mostra 5 e recolhe o resto; abre sozinha se algo escondido estiver marcado', async () => {
  await proxima(); await espera('BET-01');
  await proxima(); await espera('BET-01q');
  await proxima(); await espera('BET-04');
  await proxima(); await espera('BET-05');
  assert.equal((await pagina.$$('#q-BET-05 [role=group] > .opcoes > .opcao')).length, 5);
  assert.match(await texto('#q-BET-05 details.mais-opcoes summary'), /Mais opções \(4\)/);
  assert.equal(await pagina.$eval('#q-BET-05 details.mais-opcoes', (d) => d.open), false);
  await clicar('#q-BET-05 details.mais-opcoes summary');
  await clicar('#q-BET-05 details.mais-opcoes .opcao', 'Cupom ou bônus');
  await pagina.reload();
  await clicar('button', 'Continuar de onde parei');
  await espera('BET-05');
  assert.equal(await pagina.$eval('#q-BET-05 details.mais-opcoes', (d) => d.open), true);
  assert.equal(await pagina.$eval('#q-BET-05 details.mais-opcoes input:checked', (i) => i.value), 'cupom');
});

await passo('condicional: "Sim" mostra a pergunta extra; "Não" pula', async () => {
  await irAoAssunto('Módulo de IA');
  await proxima();
  for (const id of ['IA-09', 'IA-01', 'IA-02', 'IA-03', 'IA-04', 'IA-05', 'IA-06']) { await espera(id); await proxima(); }
  await espera('IA-07');
  await clicar('#q-IA-07 .opcao', 'Sim, retomar');
  await espera('IA-07b');
  await clicar('#topo-voltar');
  await espera('IA-07');
  await clicar('#q-IA-07 .opcao', 'Não, só responder');
  await espera('IA-08a');
});

await passo('"Preciso conversar" fica marcado; digitar depois desmarca; dúvida abre campo', async () => {
  await clicar('#topo-voltar'); await espera('IA-07');
  await clicar('#topo-voltar'); await espera('IA-06');
  assert.equal(await pagina.$eval('#q-IA-06 details.mais', (d) => d.open), false, 'atalhos começam recolhidos');
  await pagina.$eval('#q-IA-06 details.mais', (d) => (d.open = true));
  await clicar('#q-IA-06 .chip', 'Preciso conversar');
  assert.equal(await pagina.$eval('#q-IA-06 .chip[data-e=conversar]', (e) => e.getAttribute('aria-pressed')), 'true');
  await pagina.type('#q-IA-06 > textarea', 'depende do caso');
  assert.equal(await pagina.$eval('#q-IA-06 .chip[data-e=conversar]', (e) => e.getAttribute('aria-pressed')), 'false');
  await clicar('#q-IA-06 details.mais label');
  await pagina.type('#q-IA-06 details.mais textarea', 'qual o limite de valor?');
  await foto('07-duvida');
});

await passo('lista repetível: custos com várias colunas', async () => {
  await irAoAssunto('Financeiro e custos');
  await proxima();
  for (const id of ['FIN-01', 'FIN-02', 'FIN-03']) { await espera(id); await proxima(); }
  await espera('FIN-04');
  await clicar('#q-FIN-04 button', 'Adicionar ferramenta');
  await clicar('#q-FIN-04 button', 'Adicionar ferramenta');
  assert.equal((await pagina.$$('#q-FIN-04 .linha-lista')).length, 2);
  assert.equal(await pagina.$eval('#q-FIN-04 .linha-lista > .grade', (g) => g.querySelectorAll('input,select,textarea').length), 4, 'só 4 campos à vista');
  assert.match(await texto('#q-FIN-04 .linha-lista details.dep summary'), /Mais detalhes/);
  assert.equal(await pagina.$eval('#q-FIN-04 .linha-lista details.dep', (d) => d.open), false);
  const campos = await pagina.$$('#q-FIN-04 .linha-lista input[type=text]');
  await campos[0].type('VPS');
  await foto('08-lista');
});

await passo('serviços: oferecemos abre detalhes e dá para adicionar outro', async () => {
  await irAoAssunto('Serviços da Faxa');
  await proxima(); await espera('SRV-03');
  await clicar('#q-SRV-03 .servico .opcao', 'Oferecemos');
  await pagina.waitForSelector('#q-SRV-03 .servico textarea');
  await clicar('#q-SRV-03 button', 'Adicionar outro serviço');
  assert.equal((await pagina.$$('#q-SRV-03 .servico')).length, 7);
  await foto('09-servicos');
});

await passo('rascunho sobrevive a recarregar e retoma na mesma pergunta', async () => {
  const antes = await idAtual();
  await pagina.reload();
  await clicar('button', 'Continuar de onde parei');
  await espera(antes);
  assert.equal(await idAtual(), antes);
  assert.equal((await pagina.$$('#q-SRV-03 .servico.sim')).length, 2);
});

await passo('revisão separa dúvidas e pendentes; envio bloqueado sem as perguntas importantes', async () => {
  await clicar('#topo-menu');
  await clicar('button', 'Ir para a revisão');
  await pagina.waitForSelector('.rev-resumo');
  assert.match(await texto('.rev-resumo'), /dúvidas?$/);
  assert.equal(await pagina.$eval('.acoes .botao.principal', (e) => e.disabled), true);
  assert.match(await texto('.aviso'), /importante/);
  await foto('10-revisao-bloqueada');
});

await passo('com a última importante como "não sei", o envio libera', async () => {
  await pagina.evaluate(() => {
    const c = 'faxa-form-alan-v1'; const d = JSON.parse(localStorage.getItem(c));
    d.respostas['IA-09'] = { estado: 'nao_sei' };
    localStorage.setItem(c, JSON.stringify(d));
  });
  await pagina.reload();
  await clicar('button', 'Ir para a revisão');
  await pagina.waitForSelector('.rev-resumo');
  assert.equal(await pagina.$eval('.acoes .botao.principal', (e) => e.disabled), false);
});

await passo('falha no envio mantém o rascunho e orienta alternativas', async () => {
  falhar = true;
  await clicar('.acoes .botao.principal', 'Enviar para o Ricardo');
  await pagina.waitForFunction(() => document.getElementById('msg-envio').textContent.includes('continuam guardadas'));
  assert.notEqual(await pagina.evaluate(() => localStorage.getItem('faxa-form-alan-v1')), null);
  assert.equal(enviados.length, 0);
  falhar = false;
});

await passo('compartilhar: aparelho que compartilha recebe o arquivo de texto com as respostas', async () => {
  await pagina.evaluate(() => {
    window.__compartilhado = null;
    navigator.canShare = () => true;
    navigator.share = async (d) => { window.__compartilhado = { nome: d.files[0].name, texto: await d.files[0].text() }; };
  });
  await clicar('.link', 'Compartilhar arquivo');
  await pagina.waitForFunction(() => window.__compartilhado);
  const c = await pagina.evaluate(() => window.__compartilhado);
  assert.equal(c.nome, 'respostas-faxa.txt');
  assert.match(c.texto, /DÚVIDAS PARA RICARDO \(\d+\)/);
});

await passo('compartilhar: aparelho sem compartilhamento baixa o arquivo e avisa', async () => {
  await pagina.evaluate(() => { navigator.canShare = () => false; });
  await clicar('.link', 'Compartilhar arquivo');
  await pagina.waitForFunction(() => document.getElementById('toast').textContent.includes('baixado'));
});

await passo('enviar manda as respostas ao servidor, apaga o rascunho e agradece', async () => {
  await clicar('.acoes .botao.principal', 'Enviar para o Ricardo');
  await pagina.waitForFunction(() => document.body.textContent.includes('Recebido!'));
  assert.equal(enviados.length, 1);
  const r = enviados[0].respostas;
  assert.equal(r['BET-01'].estado, 'confirmado');
  assert.equal(r['CRY-06'].estado, 'corrigido');
  assert.equal(r['IA-06'].duvida.texto, 'qual o limite de valor?');
  assert.equal(r['IA-09'].estado, 'nao_sei');
  assert.equal(await pagina.evaluate(() => localStorage.getItem('faxa-form-alan-v1')), null);
  await foto('11-enviado');
});

await passo('PDF: monta a versão de impressão com os três grupos', async () => {
  await clicar('button', 'Salvar uma cópia em PDF');
  assert.match(await pagina.$eval('#impressao', (e) => e.textContent), /Dúvidas para o Ricardo \(\d+\)/);
});

await passo('sem erros de JavaScript durante todo o fluxo', async () => assert.deepEqual(erros, []));

await navegador.close();
servidor.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\ntodos os fluxos passaram');
