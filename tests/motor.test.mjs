import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../public/motor.js';
import { montarMime, base64Utf8 } from '../src/mime.js';

const SECOES = [
  {
    id: 's1', titulo: 'Assunto A', itens: [
      { id: 'A-01', levId: 'L-01', tipo: 'confirmar', titulo: 'Confirma?', resumo: 'X aconteceu', obrigatorio: true },
      { id: 'A-02', tipo: 'escolha', titulo: 'Usa o recurso?', obrigatorio: true, opcoes: [{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }, { v: 'outro', l: 'Outro' }] },
      { id: 'A-03', tipo: 'longo', titulo: 'Como funciona?', se: { id: 'A-02', em: ['sim'] }, obrigatorio: true },
      { id: 'A-04', tipo: 'lista', titulo: 'Custos', campos: [{ id: 'nome', rotulo: 'Ferramenta' }, { id: 'valor', rotulo: 'Valor' }] },
    ],
  },
];

test('pergunta condicional só aparece quando a condição é atendida', () => {
  const [, , cond] = SECOES[0].itens;
  assert.equal(M.visivel(cond, {}), false);
  assert.equal(M.visivel(cond, { 'A-02': { valor: 'nao' } }), false);
  assert.equal(M.visivel(cond, { 'A-02': { valor: 'sim' } }), true);
});

test('progresso conta só perguntas visíveis e tratadas', () => {
  let r = {};
  assert.deepEqual(M.progresso(SECOES, r), { total: 3, feitas: 0, percentual: 0 });
  r = { 'A-01': { estado: 'confirmado' }, 'A-02': { valor: 'sim', estado: 'respondido' } };
  assert.equal(M.progresso(SECOES, r).total, 4);
  assert.equal(M.progresso(SECOES, r).feitas, 2);
});

test('corrigir exige texto; não sei e conversar contam como posição tomada', () => {
  const [conf, esc] = SECOES[0].itens;
  assert.equal(M.tratada(conf, { estado: 'corrigido' }), false);
  assert.equal(M.tratada(conf, { estado: 'corrigido', texto: 'na verdade Y' }), true);
  assert.equal(M.tratada(esc, { estado: 'nao_sei' }), true);
  assert.equal(M.tratada(esc, { estado: 'conversar' }), true);
  assert.equal(M.tratada(esc, {}), false);
});

test('situação separa respondido, pendente e dúvida', () => {
  const [conf, esc] = SECOES[0].itens;
  assert.equal(M.situacao(conf, { estado: 'confirmado' }), 'respondido');
  assert.equal(M.situacao(esc, { estado: 'nao_sei' }), 'pendente');
  assert.equal(M.situacao(esc, { estado: 'nao_se_aplica' }), 'respondido');
  assert.equal(M.situacao(esc, { estado: 'conversar' }), 'duvida');
  assert.equal(M.situacao(esc, { valor: 'sim', estado: 'respondido', duvida: { marcada: true, texto: 'qual prazo?' } }), 'duvida');
  assert.equal(M.situacao(esc, undefined), 'pendente');
});

test('obrigatórias faltando ignora perguntas ocultas', () => {
  const falta = M.obrigatoriasFaltando(SECOES, { 'A-02': { valor: 'nao', estado: 'respondido' } }).map((i) => i.id);
  assert.deepEqual(falta, ['A-01']);
  const falta2 = M.obrigatoriasFaltando(SECOES, { 'A-02': { valor: 'sim', estado: 'respondido' } }).map((i) => i.id);
  assert.deepEqual(falta2, ['A-01', 'A-03']);
});

test('relatório em texto separa os três grupos e inclui IDs, listas e dúvidas', () => {
  const respostas = {
    'A-01': { estado: 'corrigido', texto: 'na verdade Y' },
    'A-02': { valor: 'sim', estado: 'respondido', duvida: { marcada: true, texto: 'qual prazo?' } },
    'A-03': { estado: 'nao_sei' },
    'A-04': { valor: [{ nome: 'VPS', valor: '80' }, { nome: 'Domínio', valor: '12' }], estado: 'respondido' },
  };
  const txt = M.montarRelatorioTexto({ respondente: 'Alan', enviadoEm: '2026-10-30T12:00:00Z' }, SECOES, respostas);
  assert.match(txt, /Respondidas: 2 \| Pendentes: 1 \| Dúvidas para Ricardo: 1/);
  assert.match(txt, /DÚVIDAS PARA RICARDO \(1\)[\s\S]*\[A-02\]/);
  assert.match(txt, /PENDENTES \(1\)[\s\S]*\[A-03\][\s\S]*Resposta: Não sei/);
  assert.match(txt, /Ferramenta: VPS \| Valor: 80/);
  assert.match(txt, /Corrigido: na verdade Y/);
  assert.doesNotMatch(txt, /undefined/);
});

test('JSON traz id do levantamento e situação', () => {
  const j = M.montarJson({ enviadoEm: 'x' }, SECOES, { 'A-01': { estado: 'confirmado' } });
  const a1 = j.itens.find((i) => i.id === 'A-01');
  assert.equal(a1.levantamento, 'L-01');
  assert.equal(a1.situacao, 'respondido');
  assert.equal(j.itens.find((i) => i.id === 'A-03').situacao, 'nao_exibida');
});

test('MIME: cabeçalhos, acentos e anexos decodificam de volta', () => {
  const corpo = 'Olá — ação, coração. Linha 2';
  const raw = montarMime({
    de: 'form@exemplo.com', para: 'dest@exemplo.com', assunto: 'Respostas — Alan', corpo,
    anexos: [{ nome: 'resp 1.txt', tipo: 'text/plain; charset=UTF-8', conteudo: 'anexo ✓' }],
  });
  assert.match(raw, /^From: form@exemplo.com\r\nTo: dest@exemplo.com\r\n/);
  const subj = raw.match(/Subject: =\?UTF-8\?B\?(.+?)\?=/)[1];
  assert.equal(Buffer.from(subj, 'base64').toString('utf8'), 'Respostas — Alan');
  const partes = raw.split(/--faxa-[0-9a-f-]+/).slice(1, -1);
  assert.equal(partes.length, 2);
  const dec = (p) => Buffer.from(p.split('\r\n\r\n')[1].replace(/\s+/g, ''), 'base64').toString('utf8');
  assert.equal(dec(partes[0]), corpo);
  assert.equal(dec(partes[1]), 'anexo ✓');
  assert.match(partes[1], /filename="resp_1.txt"/);
});

test('MIME: quebra de linha em cabeçalho não permite injetar campos', () => {
  const raw = montarMime({ de: 'a@b.com', para: 'c@d.com\r\nBcc: x@y.com', assunto: 'oi\r\nBcc: z@w.com', corpo: 'x' });
  assert.doesNotMatch(raw.split('\r\n\r\n')[0], /^Bcc:/m);
});

test('base64Utf8 aguenta texto grande', () => {
  const grande = 'ação '.repeat(50000);
  assert.equal(Buffer.from(base64Utf8(grande), 'base64').toString('utf8'), grande);
});
