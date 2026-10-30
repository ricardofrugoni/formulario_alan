import test from 'node:test';
import assert from 'node:assert/strict';
import { SECOES } from '../public/perguntas.js';
import { todasPerguntas } from '../public/motor.js';

// O levantamento fica fora deste repositório (contém dados de negócio); sem ele, os testes de vínculo são pulados.
const LEV = await import('../../levantamento/itens.mjs').then((m) => m, () => null);
const ITENS = LEV?.ITENS;
const FORA = new Set(LEV?.FORA_DO_FORMULARIO || []);
const semLevantamento = ITENS ? false : 'levantamento/ ausente';
const todas = todasPerguntas(SECOES);
const levIds = new Set((ITENS || []).map((i) => i.id));
const GRUPOS = ['confirmar', 'alan', 'decisao', 'ricardo', 'terceiros'];
const TIPOS = ['confirmar', 'texto', 'longo', 'escolha', 'multipla', 'simnao', 'data', 'valor', 'lista', 'servicos'];

test('IDs de pergunta são únicos', () => {
  const ids = todas.map((p) => p.id);
  assert.deepEqual(ids.filter((x, n) => ids.indexOf(x) !== n), []);
});

test('toda pergunta aponta para um item existente do levantamento', { skip: semLevantamento }, () => {
  for (const p of todas) assert.ok(levIds.has(p.levId), `${p.id}: levId ${p.levId} não existe`);
});

test('tipos e grupos válidos; opções e condicionais consistentes', () => {
  const ids = new Set(todas.map((p) => p.id));
  for (const p of todas) {
    assert.ok(TIPOS.includes(p.tipo), `${p.id}: tipo ${p.tipo}`);
    if (p.grupo) assert.ok(GRUPOS.includes(p.grupo), `${p.id}: grupo ${p.grupo}`);
    if (['escolha', 'multipla', 'servicos'].includes(p.tipo)) {
      assert.ok(p.opcoes?.length >= 2 || p.tipo === 'servicos', `${p.id}: sem opções`);
      const vs = p.opcoes.map((o) => o.v);
      assert.equal(new Set(vs).size, vs.length, `${p.id}: opções repetidas`);
    }
    if (p.tipo === 'confirmar') assert.ok(p.resumo, `${p.id}: sem resumo`);
    if (p.tipo === 'lista') assert.ok(p.campos?.length, `${p.id}: lista sem campos`);
    if (p.se) assert.ok(ids.has(p.se.id), `${p.id}: condição aponta para ${p.se.id}`);
  }
});

test('textos de Alan não trazem termos técnicos', () => {
  const proibido = /\b(webhook|payload|token|endpoint|supabase|deploy|hmac|api|json|cache|ttl|timestamp|swagger|openapi|sql)\b/i;
  const textos = (p) => [p.titulo, p.ajuda, p.dica, JSON.stringify(p.resumo), ...(p.opcoes || []).flatMap((o) => [o.l, o.d]), ...(p.campos || []).map((c) => c.rotulo)];
  for (const p of todas) for (const t of textos(p)) if (t) assert.doesNotMatch(t, proibido, `${p.id}: "${t}"`);
});

test('não vaza senha, código, e-mail ou link de convite', () => {
  const tudo = JSON.stringify(SECOES);
  assert.doesNotMatch(tudo, /@[\w.-]+\.\w+/);
  assert.doesNotMatch(tudo, /accept-invite|metodofx|123456789|Kiritokun/i);
});

test('poucas perguntas obrigatórias (Hick: não travar o preenchimento)', () => {
  assert.ok(todas.filter((p) => p.obrigatorio).length <= 8);
});

test('toda pergunta do levantamento com q está no formulário ou na lista de retiradas', { skip: semLevantamento }, () => {
  const cobertos = new Set(todas.map((p) => p.levId));
  const faltando = ITENS.filter((i) => i.q && !cobertos.has(i.id) && !FORA.has(i.id)).map((i) => i.id);
  assert.deepEqual(faltando, [], 'itens com pergunta sem campo no formulário');
});

test('itens retirados por decisão não reaparecem no formulário', { skip: semLevantamento }, () => {
  const cobertos = new Set(todas.map((p) => p.levId));
  const reapareceu = [...FORA].filter((id) => cobertos.has(id));
  assert.deepEqual(reapareceu, []);
});
