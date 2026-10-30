import { EmailMessage } from 'cloudflare:email';
import { montarMime } from './mime.js';
import { montarRelatorioTexto, montarJson } from '../public/motor.js';
import { SECOES } from '../public/perguntas.js';

const LIMITE_BYTES = 400_000;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/api/enviar') return env.ASSETS.fetch(req);
    if (req.method !== 'POST') return json({ ok: false, erro: 'Método não permitido.' }, 405);

    // Só aceita envio vindo da própria página.
    const origem = req.headers.get('origin');
    if (origem && origem !== url.origin) return json({ ok: false, erro: 'Origem não permitida.' }, 403);

    const bruto = await req.text();
    if (bruto.length > LIMITE_BYTES) return json({ ok: false, erro: 'Conteúdo grande demais.' }, 413);

    let corpo;
    try {
      corpo = JSON.parse(bruto);
    } catch {
      return json({ ok: false, erro: 'Conteúdo inválido.' }, 400);
    }
    if (!corpo || typeof corpo.respostas !== 'object' || Array.isArray(corpo.respostas)) {
      return json({ ok: false, erro: 'Respostas ausentes.' }, 400);
    }

    const meta = { respondente: env.RESPONDENTE || 'Alan Ribeiro', enviadoEm: new Date().toISOString() };
    const relatorio = montarRelatorioTexto(meta, SECOES, corpo.respostas);
    const dados = JSON.stringify(montarJson(meta, SECOES, corpo.respostas), null, 2);
    const stamp = meta.enviadoEm.slice(0, 16).replace(/[:T]/g, '-');

    const raw = montarMime({
      de: env.REMETENTE,
      para: env.DESTINO,
      assunto: `Formulário Faxa respondido — ${meta.respondente}`,
      corpo: relatorio,
      anexos: [
        { nome: `respostas-faxa-${stamp}.txt`, tipo: 'text/plain; charset=UTF-8', conteudo: relatorio },
        { nome: `respostas-faxa-${stamp}.json`, tipo: 'application/json; charset=UTF-8', conteudo: dados },
      ],
      dominioId: (env.REMETENTE.split('@')[1] || 'faxa.local').replace(/[^\w.-]/g, ''),
    });

    try {
      await env.EMAIL.send(new EmailMessage(env.REMETENTE, env.DESTINO, raw));
    } catch (e) {
      console.error('falha no envio', e && e.message);
      return json({ ok: false, erro: 'Não foi possível enviar agora. Use "Compartilhar arquivo" ou "Salvar como PDF" e envie para o Ricardo.' }, 502);
    }
    return json({ ok: true });
  },
};
