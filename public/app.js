import { SECOES, INTRO } from './perguntas.js';
import * as M from './motor.js';

const CHAVE = 'faxa-form-alan-v1';
const ETIQUETAS = {
  decisao: 'Decisão para conversarmos',
  ricardo: 'Pedido seu que está comigo',
  terceiros: 'Depende de cliente ou fornecedor',
};
const RESPONSAVEIS = ['Alan', 'Ricardo', 'Cliente', 'Fornecedor', 'Outra pessoa'];

const estado = { respostas: {}, tela: 'inicio', atual: null, avisouStorage: false };
const raiz = document.getElementById('conteudo');
let timerAvanco = null;

/* ---------- utilidades ---------- */
function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const f of filhos.flat()) {
    if (f == null || f === false) continue;
    el.append(f.nodeType ? f : document.createTextNode(f));
  }
  return el;
}
let uid = 0;
const novoId = (p) => `${p}-${++uid}`;

const ICONES = {
  esquerda: 'M15 5l-7 7 7 7',
  direita: 'M9 5l7 7-7 7',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  lista: 'M4 7h16M4 12h16M4 17h10',
};
function icone(nome) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'i');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', ICONES[nome]);
  svg.append(p);
  return svg;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.hidden = true), 3600);
}

/* ---------- armazenamento (rascunho neste aparelho) ---------- */
function carregar() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (d) {
      estado.respostas = d.respostas || {};
      estado.atual = d.atual || null;
    }
  } catch { /* sem armazenamento: o formulário continua funcionando */ }
}
function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ respostas: estado.respostas, atual: estado.atual }));
  } catch {
    if (!estado.avisouStorage) {
      estado.avisouStorage = true;
      toast('Este aparelho não guardou o rascunho. Use "Baixar rascunho" para não perder.');
    }
  }
}
function limparArmazenamento() {
  try { localStorage.removeItem(CHAVE); } catch { /* ignora */ }
}

function baixarArquivo(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = h('a', { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const metaAgora = () => ({ respondente: 'Alan Ribeiro', enviadoEm: new Date().toISOString() });
function baixarRascunho() {
  baixarArquivo('rascunho-faxa.json', JSON.stringify({ respostas: estado.respostas, atual: estado.atual }), 'application/json');
  toast('Rascunho baixado. Para continuar em outro aparelho, carregue esse arquivo na tela inicial.');
}
function carregarArquivo(arquivo) {
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const d = JSON.parse(leitor.result);
      if (!d || typeof d.respostas !== 'object') throw new Error('formato');
      estado.respostas = d.respostas;
      estado.atual = d.atual || null;
      salvar();
      toast('Rascunho carregado.');
      mostrar('inicio');
    } catch {
      toast('Esse arquivo não parece ser um rascunho deste formulário.');
    }
  };
  leitor.readAsText(arquivo);
}

/* ---------- respostas ---------- */
const resp = (id) => estado.respostas[id] || null;

function definir(item, patch) {
  const r = { ...(estado.respostas[item.id] || {}), ...patch, atualizadoEm: new Date().toISOString() };
  // Escrever uma resposta substitui "não sei", "não se aplica" e "conversar"
  if (('valor' in patch || 'texto' in patch) && !('estado' in patch) && r.estado in M.ESTADOS_ESPECIAIS && item.tipo !== 'confirmar') delete r.estado;
  if ('valor' in patch && !('estado' in patch) && item.tipo !== 'confirmar') {
    if (M.valorVazio(r.valor)) { if (!(r.estado in M.ESTADOS_ESPECIAIS)) delete r.estado; } else r.estado = 'respondido';
  }
  if (r.estado === undefined) delete r.estado;
  estado.respostas[item.id] = r;
  salvar();
  atualizarBarra();
  marcarCartao(item);
}

function marcarCartao(item) {
  const cartao = document.getElementById(`q-${item.id}`);
  if (!cartao) return;
  cartao.classList.remove('erro');
  const ok = cartao.querySelector('.estado-ok');
  if (ok) ok.hidden = !M.tratada(item, resp(item.id));
  for (const chip of cartao.querySelectorAll('.chip[data-e]')) {
    chip.setAttribute('aria-pressed', String(resp(item.id)?.estado === chip.dataset.e));
  }
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const restantes = () => { const p = M.progresso(SECOES, estado.respostas); return p.total - p.feitas; };

function montarBarra() {
  document.getElementById('barra').replaceChildren(...SECOES.map(() => h('span', { class: 'seg' }, h('i'))));
}
function atualizarBarra() {
  const p = M.progresso(SECOES, estado.respostas);
  const barra = document.getElementById('barra');
  barra.setAttribute('aria-valuenow', String(p.percentual));
  barra.setAttribute('aria-valuetext', `${p.feitas} de ${p.total} perguntas`);
  const atual = passos().find((x) => x.id === estado.atual)?.i;
  [...barra.children].forEach((seg, n) => {
    const ps = M.progressoSecao(SECOES[n], estado.respostas);
    seg.firstChild.style.width = ps.total ? `${Math.round((ps.feitas / ps.total) * 100)}%` : '0%';
    seg.classList.toggle('atual', n === atual);
    seg.classList.toggle('feito', ps.total > 0 && ps.feitas === ps.total);
  });
  document.getElementById('barra-txt').textContent = `${p.percentual}%`;
}

/* ---------- passos: cada pergunta é uma tela ---------- */
function passos() {
  const lista = [];
  SECOES.forEach((s, i) => {
    lista.push({ id: `sec:${s.id}`, tipo: 'assunto', secao: s, i });
    s.itens.filter((it) => M.visivel(it, estado.respostas)).forEach((it) => lista.push({ id: it.id, tipo: 'q', item: it, secao: s, i }));
  });
  return lista;
}
function posicao(lista) {
  const n = lista.findIndex((p) => p.id === estado.atual);
  return n >= 0 ? n : 0;
}
function ir(delta) {
  clearTimeout(timerAvanco);
  const lista = passos();
  const n = posicao(lista) + delta;
  if (n < 0) return mostrar('inicio');
  if (n >= lista.length) return mostrar('revisao');
  mostrar('passo', lista[n].id);
}
function avancarSuave() {
  clearTimeout(timerAvanco);
  const id = estado.atual;
  timerAvanco = setTimeout(() => { if (estado.tela === 'passo' && estado.atual === id) ir(1); }, 520);
}

/* ---------- campos ---------- */
function campoSimples(item, valor, aoMudar, { tipo, campo } = {}) {
  const t = tipo || item.tipo;
  const comum = { id: novoId('c'), 'aria-label': campo?.rotulo || item.titulo };
  if (t === 'longo') return h('textarea', { ...comum, rows: 4, placeholder: campo?.dica || item.dica || 'Escreva com suas palavras', oninput: (e) => aoMudar(e.target.value) }, valor || '');
  if (t === 'data') return h('input', { ...comum, type: 'date', value: valor || '', onchange: (e) => aoMudar(e.target.value) });
  if (t === 'valor') {
    return h('div', { class: 'moeda' }, h('span', null, 'R$'), h('input', { ...comum, type: 'text', inputmode: 'decimal', placeholder: '0,00', value: valor || '', oninput: (e) => aoMudar(e.target.value.replace(/[^\d.,]/g, '')) }));
  }
  return h('input', { ...comum, type: 'text', value: valor || '', placeholder: campo?.dica || item.dica || '', oninput: (e) => aoMudar(e.target.value) });
}

function rotuloOpcao(o) {
  return h('span', null, o.l, o.d ? h('small', null, o.d) : null);
}
// Mais de 6 opções: mostra as 5 primeiras e recolhe o resto (abre sozinho se algo recolhido estiver marcado).
function comMais(opcoes, fazOpcao, marcada, papel) {
  if (opcoes.length <= 6) return h('div', { class: 'opcoes', role: papel }, opcoes.map(fazOpcao));
  const vis = opcoes.slice(0, 5);
  const resto = opcoes.slice(5);
  return h('div', { role: papel },
    h('div', { class: 'opcoes' }, vis.map(fazOpcao)),
    h('details', { class: 'mais-opcoes', open: resto.some((o) => marcada(o.v)) },
      h('summary', null, `Mais opções (${resto.length})`),
      h('div', { class: 'opcoes' }, resto.map(fazOpcao))));
}
function escolhaUnica(nome, opcoes, atual, aoMudar) {
  return comMais(opcoes, (o) => h('label', { class: 'opcao' },
    h('input', { type: 'radio', name: nome, value: o.v, checked: atual === o.v, onchange: () => aoMudar(o.v) }), rotuloOpcao(o)), (v) => v === atual, 'radiogroup');
}
function escolhaMultipla(nome, opcoes, atual, aoMudar) {
  const sel = new Set(Array.isArray(atual) ? atual : []);
  return comMais(opcoes, (o) => h('label', { class: 'opcao' },
    h('input', { type: 'checkbox', name: nome, value: o.v, checked: sel.has(o.v), onchange: (e) => { e.target.checked ? sel.add(o.v) : sel.delete(o.v); aoMudar([...sel]); } }), rotuloOpcao(o)), (v) => sel.has(v), 'group');
}

function campoLista(item, valorCampo, campo, aoMudar) {
  if ((campo.tipo || 'texto') === 'escolha') {
    return h('select', { 'aria-label': campo.rotulo, onchange: (e) => aoMudar(e.target.value) },
      h('option', { value: '' }, 'Escolha…'), (campo.opcoes || []).map((o) => h('option', { value: o.v, selected: valorCampo === o.v }, o.l)));
  }
  return campoSimples(item, valorCampo, aoMudar, { tipo: campo.tipo || 'texto', campo });
}

function widgetLista(item) {
  const caixa = h('div');
  const linhas = () => (Array.isArray(resp(item.id)?.valor) ? resp(item.id).valor : []);
  const gravar = (novas) => definir(item, { valor: novas });
  const principais = item.campos.filter((c) => !c.extra);
  const extras = item.campos.filter((c) => c.extra);
  const desenhar = () => {
    caixa.replaceChildren();
    linhas().forEach((linha, n) => {
      const campo = (c) => h('div', null, h('label', { class: 'rot' }, c.rotulo),
        campoLista(item, linha[c.id], c, (v) => { const cp = linhas().map((x) => ({ ...x })); cp[n][c.id] = v; gravar(cp); }));
      caixa.append(h('div', { class: 'linha-lista' },
        h('div', { class: 'cab' }, h('strong', null, `${item.rotuloLinha || 'Item'} ${n + 1}`),
          h('button', { type: 'button', class: 'remover', onclick: () => { gravar(linhas().filter((_, i) => i !== n)); desenhar(); } }, 'Remover')),
        h('div', { class: 'grade' }, principais.map(campo)),
        extras.length ? h('details', { class: 'dep', open: extras.some((c) => !M.valorVazio(linha[c.id])) },
          h('summary', null, 'Mais detalhes (opcional)'), h('div', { class: 'grade' }, extras.map(campo))) : null));
    });
    caixa.append(h('div', { class: 'acoes' }, h('button', { type: 'button', class: 'botao', onclick: () => { gravar([...linhas(), {}]); desenhar(); } }, `+ ${item.rotuloAdicionar || 'Adicionar'}`)));
  };
  desenhar();
  return caixa;
}

const STATUS_SERVICO = [
  { v: 'oferece', l: 'Oferecemos' },
  { v: 'corrigir', l: 'Existe, mas precisa corrigir' },
  { v: 'nao_oferece', l: 'Não oferecemos' },
];

function widgetServicos(item) {
  const caixa = h('div');
  const lista = () => (Array.isArray(resp(item.id)?.valor) ? resp(item.id).valor : []);
  const gravar = (novas) => definir(item, { valor: novas });
  const detalhes = (entrada, atualizar) => h('div', null, item.campos
    .filter((c) => !['nome', 'origem', 'status', 'nomeCorrigido'].includes(c.id))
    .map((c) => h('div', null, h('label', { class: 'rot' }, c.rotulo),
      campoSimples(item, entrada[c.id], (v) => atualizar(c.id, v), { tipo: c.tipo || 'texto', campo: c }))));

  const desenhar = () => {
    caixa.replaceChildren();
    for (const p of item.opcoes) {
      const entrada = lista().find((e) => e.id === p.v) || { id: p.v, nome: p.l, origem: p.origem };
      const atualizar = (campo, v) => {
        const atual = lista().find((e) => e.id === p.v) || entrada;
        gravar([...lista().filter((e) => e.id !== p.v), { ...atual, [campo]: v }]);
      };
      const ativo = entrada.status === 'oferece' || entrada.status === 'corrigir';
      const cartao = h('div', { class: `servico ${ativo ? 'sim' : ''}` },
        h('strong', null, p.l),
        h('div', { class: 'origem' }, p.origem === 'site' ? 'Aparece no site da Faxa' : p.origem === 'conversa' ? 'Citado na nossa conversa' : 'Precisa de confirmação'),
        p.d ? h('p', { class: 'ajuda' }, p.d) : null,
        escolhaUnica(novoId('s'), STATUS_SERVICO, entrada.status, (v) => { atualizar('status', v); desenhar(); }));
      if (entrada.status === 'corrigir') {
        cartao.append(h('label', { class: 'rot' }, 'Como deve ficar o nome ou a descrição?'),
          campoSimples(item, entrada.nomeCorrigido, (v) => atualizar('nomeCorrigido', v), { tipo: 'texto' }));
      }
      if (ativo) cartao.append(detalhes(entrada, atualizar));
      caixa.append(cartao);
    }
    lista().filter((e) => e.origem === 'adicionado').forEach((entrada) => {
      const atualizar = (campo, v) => gravar(lista().map((e) => (e.id === entrada.id ? { ...e, [campo]: v } : e)));
      caixa.append(h('div', { class: 'servico sim' },
        h('div', { class: 'cab', style: 'display:flex;justify-content:space-between;align-items:center' }, h('strong', null, 'Outro serviço'),
          h('button', { type: 'button', class: 'remover', onclick: () => { gravar(lista().filter((e) => e.id !== entrada.id)); desenhar(); } }, 'Remover')),
        h('label', { class: 'rot' }, 'Nome do serviço'),
        campoSimples(item, entrada.nome, (v) => atualizar('nome', v), { tipo: 'texto' }),
        detalhes(entrada, atualizar)));
    });
    caixa.append(h('div', { class: 'acoes' }, h('button', {
      type: 'button', class: 'botao',
      onclick: () => { gravar([...lista(), { id: `extra-${Date.now()}`, nome: '', origem: 'adicionado', status: 'oferece' }]); desenhar(); },
    }, '+ Adicionar outro serviço')));
  };
  desenhar();
  return caixa;
}

/* ---------- uma pergunta ---------- */
function corpoConfirmar(item) {
  const r = () => resp(item.id) || {};
  const SEC = [['corrigido', 'Corrigir'], ['complementado', 'Complementar'], ['conversar', 'Preciso conversar com Ricardo']];
  let ajustando = SEC.some(([e]) => r().estado === e);
  const area = h('div', { class: 'complemento' });
  const sec = h('div', { class: 'conf conf-sec' });
  const botoesSec = {};
  const btnOk = h('button', {
    type: 'button',
    onclick: () => {
      const novo = r().estado === 'confirmado' ? undefined : 'confirmado';
      definir(item, { estado: novo });
      if (novo === 'confirmado') { ajustando = false; avancarSuave(); } else clearTimeout(timerAvanco);
      redesenhar();
    },
  }, 'Confirmar');
  const btnAj = h('button', {
    type: 'button',
    onclick: () => {
      ajustando = !ajustando;
      if (ajustando && r().estado === 'confirmado') definir(item, { estado: undefined });
      clearTimeout(timerAvanco);
      redesenhar();
    },
  }, 'Ajustar');
  SEC.forEach(([e, rot]) => {
    botoesSec[e] = h('button', { type: 'button', onclick: () => { definir(item, { estado: r().estado === e ? undefined : e }); clearTimeout(timerAvanco); redesenhar(); } }, rot);
    sec.append(botoesSec[e]);
  });
  const redesenhar = () => {
    btnOk.setAttribute('aria-pressed', String(r().estado === 'confirmado'));
    btnAj.setAttribute('aria-pressed', String(ajustando));
    btnAj.setAttribute('aria-expanded', String(ajustando));
    sec.hidden = !ajustando;
    for (const [e, b] of Object.entries(botoesSec)) b.setAttribute('aria-pressed', String(r().estado === e));
    area.replaceChildren();
    const est = r().estado;
    if (est === 'corrigido' || est === 'complementado') {
      area.append(h('label', { class: 'rot', for: `t-${item.id}` }, est === 'corrigido' ? 'Como é o correto?' : 'O que mais precisa constar?'),
        h('textarea', { id: `t-${item.id}`, rows: 3, oninput: (e) => definir(item, { texto: e.target.value }) }, r().texto || ''));
    } else if (est === 'conversar') {
      area.append(h('label', { class: 'rot', for: `t-${item.id}` }, 'Quer adiantar o assunto? (opcional)'),
        h('textarea', { id: `t-${item.id}`, rows: 2, oninput: (e) => definir(item, { nota: e.target.value }) }, r().nota || ''));
    }
  };
  const resumo = Array.isArray(item.resumo)
    ? h('ul', { class: 'lista' }, item.resumo.map((x) => h('li', null, x)))
    : h('p', null, item.resumo);
  const caixa = h('div', null,
    h('div', { class: 'resumo' }, h('b', null, 'Pelo que conversamos, ficou entendido que:'), resumo),
    h('div', { class: 'conf' }, btnOk, btnAj), sec, area);
  redesenhar();
  return caixa;
}

function corpoCampo(item) {
  const r = () => resp(item.id) || {};
  switch (item.tipo) {
    case 'escolha':
    case 'simnao': {
      const opcoes = item.tipo === 'simnao' ? [{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }] : item.opcoes;
      const extra = h('div');
      const mostrarExtra = () => {
        extra.replaceChildren();
        if (r().valor === 'outro') extra.append(h('label', { class: 'rot' }, 'Qual?'), campoSimples(item, r().texto, (v) => definir(item, { texto: v }), { tipo: 'texto' }));
      };
      const grupo = escolhaUnica(novoId('r'), opcoes, r().valor, (v) => {
        definir(item, { valor: v });
        mostrarExtra();
        if (v !== 'outro') avancarSuave(); else clearTimeout(timerAvanco);
      });
      mostrarExtra();
      return h('div', null, grupo, extra);
    }
    case 'multipla': {
      const extra = h('div');
      const mostrarExtra = () => {
        extra.replaceChildren();
        if ((r().valor || []).includes('outro')) extra.append(h('label', { class: 'rot' }, 'Qual outro?'), campoSimples(item, r().texto, (v) => definir(item, { texto: v }), { tipo: 'texto' }));
      };
      const grupo = escolhaMultipla(novoId('m'), item.opcoes, r().valor, (v) => { definir(item, { valor: v }); mostrarExtra(); });
      mostrarExtra();
      return h('div', null, grupo, extra);
    }
    case 'lista': return widgetLista(item);
    case 'servicos': return widgetServicos(item);
    default: return campoSimples(item, r().valor, (v) => definir(item, { valor: v }));
  }
}

function cartao(item) {
  const r = () => resp(item.id) || {};
  const corpo = item.tipo === 'confirmar' ? corpoConfirmar(item) : corpoCampo(item);

  const atalhos = h('div', { class: 'atalhos' });
  if (item.tipo !== 'confirmar') {
    for (const [e, rot] of Object.entries(M.ESTADOS_ESPECIAIS)) {
      atalhos.append(h('button', {
        type: 'button', class: 'chip', 'data-e': e, 'aria-pressed': String(r().estado === e),
        onclick: () => {
          clearTimeout(timerAvanco);
          if (r().estado === e) {
            const copia = { ...r() };
            delete copia.estado;
            if (!M.valorVazio(copia.valor)) copia.estado = 'respondido';
            estado.respostas[item.id] = copia;
            salvar(); atualizarBarra(); marcarCartao(item);
          } else {
            definir(item, { estado: e });
            if (e !== 'conversar') avancarSuave();
          }
        },
      }, rot));
    }
  }

  const campoDuvida = h('textarea', { rows: 2, placeholder: 'O que você precisa que eu esclareça?', 'aria-label': 'Explique sua dúvida', hidden: !r().duvida?.marcada, oninput: (e) => definir(item, { duvida: { marcada: true, texto: e.target.value } }) }, r().duvida?.texto || '');
  const marca = h('input', { type: 'checkbox', checked: Boolean(r().duvida?.marcada), onchange: (e) => { definir(item, { duvida: { ...(r().duvida || {}), marcada: e.target.checked } }); campoDuvida.hidden = !e.target.checked; } });
  const mais = h('details', { class: 'mais', open: Boolean(r().estado in M.ESTADOS_ESPECIAIS || r().duvida?.marcada) },
    h('summary', null, item.tipo === 'confirmar' ? 'Tenho uma dúvida' : 'Não sei responder ou tenho uma dúvida'),
    item.tipo === 'confirmar' ? null : atalhos,
    h('label', { class: 'opcao' }, marca, h('span', null, 'Marcar como dúvida para o Ricardo')), campoDuvida);

  let dep = null;
  if (item.grupo === 'terceiros' || item.responsavel) {
    dep = h('details', { class: 'dep', open: Boolean((item.grupo === 'terceiros' && item.tipo !== 'confirmar') || r().responsavel || r().falta) },
      h('summary', null, 'Depende de outra pessoa? Diga quem resolve e o que falta'),
      h('label', { class: 'rot' }, 'Quem resolve?'),
      h('select', { 'aria-label': 'Quem resolve', onchange: (e) => definir(item, { responsavel: e.target.value }) },
        h('option', { value: '' }, 'Escolha…'), RESPONSAVEIS.map((x) => h('option', { value: x, selected: r().responsavel === x }, x))),
      h('label', { class: 'rot' }, 'O que falta para isso andar?'),
      h('textarea', { rows: 2, oninput: (e) => definir(item, { falta: e.target.value }) }, r().falta || ''));
  }

  const grupo = item.grupo && ETIQUETAS[item.grupo] ? h('p', { class: 'etiqueta' }, ETIQUETAS[item.grupo]) : null;
  const ref = item.ref ? h('details', { class: 'ref' }, h('summary', null, 'De onde vem isso'), h('p', null, item.ref)) : null;

  return h('article', { class: 'q', id: `q-${item.id}`, 'data-id': item.id },
    h('h2', null, item.titulo),
    item.ajuda ? h('p', { class: 'ajuda' }, item.ajuda) : null,
    grupo,
    corpo, dep, mais, ref,
    h('p', { class: 'q-meta' }, h('span', null, item.levId || item.id),
      item.obrigatorio ? h('span', { class: 'importante' }, 'Importante') : h('span', null, 'Opcional'),
      h('span', { class: 'ok estado-ok', hidden: !M.tratada(item, r()) }, 'Anotado')));
}

/* ---------- telas ---------- */
function mostrar(tela, atual) {
  clearTimeout(timerAvanco);
  document.getElementById('toast').hidden = true;
  estado.tela = tela;
  if (atual != null) estado.atual = atual;
  if (tela !== 'enviado') salvar();
  desenhar();
  window.scrollTo({ top: 0 });
  raiz.focus({ preventScroll: true });
}

function navegacao(previa, aoAvancar, rotuloBotao) {
  return h('nav', { class: 'nav', 'aria-label': 'Navegação' }, h('div', { class: 'nav-in' },
    h('p', { class: 'previa' }, previa),
    h('button', { type: 'button', class: 'redondo', 'aria-label': rotuloBotao, onclick: aoAvancar }, icone('direita'))));
}

function telaInicio() {
  const tem = Object.keys(estado.respostas).length > 0;
  const p = M.progresso(SECOES, estado.respostas);
  const arquivo = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: (e) => e.target.files[0] && carregarArquivo(e.target.files[0]) });
  return h('div', null,
    h('section', { class: 'hero' },
      h('p', { class: 'marca' }, 'Faxa Marketing'),
      h('h1', null, INTRO.titulo),
      INTRO.paragrafos.map((t) => h('p', null, t))),
    h('ol', { class: 'passos' }, INTRO.passos.map((t, i) => h('li', null, h('b', null, i + 1), h('span', null, t)))),
    h('div', { class: 'acoes' },
      h('button', { type: 'button', class: 'botao principal', onclick: () => mostrar('passo', tem && estado.atual ? estado.atual : `sec:${SECOES[0].id}`) }, tem ? `Continuar de onde parei (${p.percentual}%)` : 'Começar'),
      tem ? h('button', { type: 'button', class: 'botao', onclick: () => mostrar('revisao') }, 'Ir para a revisão') : null),
    h('div', { class: 'mapa', role: 'list' }, SECOES.map((s) => {
      const ps = M.progressoSecao(s, estado.respostas);
      return h('button', { type: 'button', role: 'listitem', class: ps.total && ps.feitas === ps.total ? 'feito' : '', onclick: () => mostrar('passo', `sec:${s.id}`) },
        h('span', null, h('strong', null, s.titulo), h('small', null, s.cliente || 'Faxa')), h('span', { class: 'conta' }, `${ps.feitas} de ${ps.total}`));
    })),
    h('p', { class: 'nota' }, 'Seu preenchimento fica guardado neste aparelho enquanto você responde. Só chega ao Ricardo quando você enviar no final.'),
    h('div', { class: 'acoes' },
      h('button', { type: 'button', class: 'link', onclick: baixarRascunho }, 'Baixar rascunho'),
      h('button', { type: 'button', class: 'link', onclick: () => arquivo.click() }, 'Carregar rascunho'), arquivo));
}

function marcoTexto(pct) {
  if (pct >= 75) return 'Última reta.';
  if (pct >= 50) return 'Metade do caminho.';
  if (pct >= 25) return 'Bom ritmo.';
  return '';
}

function telaPasso() {
  const lista = passos();
  const n = posicao(lista);
  const passo = lista[n];
  estado.atual = passo.id;
  const proximo = lista[n + 1];
  const s = passo.secao;
  const deste = lista.filter((x) => x.secao === s && x.tipo === 'q');
  const falta = restantes();
  const previa = proximo
    ? h('span', null, h('small', null, proximo.tipo === 'assunto' ? 'Próximo assunto' : 'A seguir'), proximo.tipo === 'assunto' ? proximo.secao.titulo : proximo.item.titulo)
    : h('span', null, h('small', null, 'Última pergunta'), 'Revisar e enviar');

  document.getElementById('topo-ctx').textContent = passo.tipo === 'assunto'
    ? s.titulo
    : `${s.titulo} · ${deste.findIndex((x) => x.id === passo.id) + 1} de ${deste.length}${falta <= 10 ? ` · faltam ${falta}` : ''}`;

  if (passo.tipo === 'assunto') {
    const ps = M.progressoSecao(s, estado.respostas);
    const anterior = passo.i > 0 ? SECOES[passo.i - 1] : null;
    const anteriorFeito = anterior && (() => { const pa = M.progressoSecao(anterior, estado.respostas); return pa.total > 0 && pa.feitas === pa.total; })();
    const pct = M.progresso(SECOES, estado.respostas).percentual;
    const abertos = SECOES.filter((x) => { const px = M.progressoSecao(x, estado.respostas); return px.feitas < px.total; }).length;
    const frase = [anteriorFeito ? `${anterior.titulo} concluído.` : '', marcoTexto(pct), falta ? `Faltam ${plural(falta, 'pergunta', 'perguntas')} em ${plural(abertos, 'assunto', 'assuntos')}.` : 'Tudo respondido.'].filter(Boolean).join(' ');
    return h('div', null,
      h('section', { class: 'assunto' },
        h('h2', null, s.titulo),
        s.intro ? h('p', { class: 'suave' }, s.intro) : null,
        h('p', { class: 'conta' }, `${s.cliente && s.cliente !== s.titulo ? `${s.cliente} · ` : ''}${plural(deste.length, 'pergunta', 'perguntas')} neste assunto${ps.feitas ? `, ${ps.feitas} já respondidas` : ''}.`),
        h('p', { class: 'conquista' }, anteriorFeito ? icone('check') : null, frase)),
      navegacao(h('span', null, h('small', null, 'Primeira pergunta'), deste[0] ? deste[0].item.titulo : ''), () => ir(1), 'Começar este assunto'));
  }
  return h('div', null, cartao(passo.item), navegacao(previa, () => ir(1), proximo ? 'Próxima' : 'Revisar respostas'));
}

function resumoResposta(item, r) {
  const txt = M.montarRelatorioTexto({ enviadoEm: '' }, [{ id: 's', titulo: '', itens: [item] }], { [item.id]: r });
  const m = txt.split('\n').find((l) => l.startsWith('  Resposta:'));
  return m ? m.replace('  Resposta: ', '') : '';
}

function irPara(item) {
  mostrar('passo', item.id);
  requestAnimationFrame(() => {
    const el = document.getElementById(`q-${item.id}`);
    if (el) { el.classList.add('erro'); setTimeout(() => el.classList.remove('erro'), 2500); }
  });
}

function telaRevisao() {
  const todas = M.todasPerguntas(SECOES).filter((i) => M.visivel(i, estado.respostas));
  const grupos = { duvida: [], pendente: [], respondido: [] };
  todas.forEach((i) => grupos[M.situacao(i, resp(i.id))].push(i));
  const faltando = M.obrigatoriasFaltando(SECOES, estado.respostas);
  document.getElementById('topo-ctx').textContent = 'Revisão';

  const linha = (i) => h('li', null,
    h('div', null, h('strong', null, i.titulo), h('div', { class: 'resp' }, resumoResposta(i, resp(i.id) || {}) || 'Sem resposta ainda'),
      resp(i.id)?.duvida?.texto ? h('div', { class: 'resp' }, `Dúvida: ${resp(i.id).duvida.texto}`) : null),
    h('button', { type: 'button', class: 'link', onclick: () => irPara(i) }, 'Editar'));
  const bloco = (titulo, lista, aberto) => h('details', { open: aberto, class: 'ref', style: 'font-size:1rem;margin-top:18px' },
    h('summary', { style: 'color:var(--texto)' }, h('strong', null, `${titulo} (${lista.length})`)), h('ul', { class: 'rev-lista' }, lista.map(linha)));

  return h('div', null,
    h('section', { class: 'assunto' }, h('h2', null, 'Revise antes de enviar'),
      h('p', { class: 'suave' }, 'Dá para voltar e ajustar qualquer item. Depois de enviado, o Ricardo recebe tudo de uma vez.')),
    h('p', { class: 'rev-resumo' },
      h('strong', null, grupos.respondido.length), grupos.respondido.length === 1 ? ' respondida · ' : ' respondidas · ',
      h('strong', null, grupos.pendente.length), grupos.pendente.length === 1 ? ' pendente · ' : ' pendentes · ',
      h('strong', null, grupos.duvida.length), grupos.duvida.length === 1 ? ' dúvida' : ' dúvidas'),
    faltando.length ? h('div', { class: 'aviso' }, h('strong', null, `Faltam ${faltando.length} pergunta(s) importante(s)`),
      h('ul', null, faltando.slice(0, 8).map((i) => h('li', null, i.titulo, ' ', h('button', { type: 'button', class: 'link', onclick: () => irPara(i) }, 'Responder')))),
      h('p', { class: 'ajuda' }, 'Se não souber, toque em "Não sei" ou "Preciso conversar com Ricardo".')) : null,
    h('div', { class: 'acoes' },
      h('button', { type: 'button', class: 'botao principal', onclick: enviarFormulario, disabled: faltando.length > 0 }, 'Enviar para o Ricardo'),
      h('button', { type: 'button', class: 'botao', onclick: gerarPdf }, 'Salvar como PDF')),
    h('div', { class: 'acoes' },
      h('button', { type: 'button', class: 'link', onclick: compartilhar }, 'Compartilhar arquivo'),
      h('button', { type: 'button', class: 'link', onclick: baixarRascunho }, 'Baixar rascunho')),
    h('p', { class: 'nota', id: 'msg-envio', role: 'status' }),
    bloco('Dúvidas para o Ricardo', grupos.duvida, true),
    bloco('Ainda pendentes', grupos.pendente, grupos.pendente.length <= 8),
    bloco('Respondidas', grupos.respondido, false));
}

function telaEnviado() {
  return h('div', { class: 'sucesso' },
    h('div', { class: 'selo-ok' }, icone('check')),
    h('h1', null, 'Recebido!'),
    h('p', null, 'Obrigado, Alan. O Ricardo já recebeu suas respostas e vai usar tudo para organizar o que vem agora.'),
    h('p', { class: 'suave' }, 'Seu rascunho foi apagado deste aparelho. Se quiser ficar com uma cópia, salve em PDF.'),
    h('div', { class: 'acoes' }, h('button', { type: 'button', class: 'botao', onclick: gerarPdf }, 'Salvar uma cópia em PDF')));
}

/* ---------- envio, PDF e compartilhamento ---------- */
function preencherImpressao() {
  const meta = metaAgora();
  const todas = M.todasPerguntas(SECOES).filter((i) => M.visivel(i, estado.respostas));
  const g = { duvida: [], pendente: [], respondido: [] };
  todas.forEach((i) => g[M.situacao(i, resp(i.id))].push(i));
  const bloco = (titulo, lista) => h('div', null, h('h2', null, `${titulo} (${lista.length})`),
    lista.length ? lista.map((i) => {
      const r = resp(i.id) || {};
      return h('div', { class: 'it' }, h('b', null, i.titulo), h('span', { class: 'id' }, `${i.id} · ${i.secaoTitulo}`),
        h('div', null, resumoResposta(i, r) || '—'),
        r.duvida?.texto ? h('div', null, `Dúvida: ${r.duvida.texto}`) : null,
        r.falta ? h('div', null, `O que falta: ${r.falta}${r.responsavel ? ` (quem resolve: ${r.responsavel})` : ''}`) : null);
    }) : h('p', null, '(nenhuma)'));
  document.getElementById('impressao').replaceChildren(
    h('h1', null, 'Formulário Faxa — respostas de Alan Ribeiro'),
    h('p', null, `Gerado em ${new Date(meta.enviadoEm).toLocaleString('pt-BR')}`),
    bloco('Dúvidas para o Ricardo', g.duvida), bloco('Pendentes', g.pendente), bloco('Respondidas', g.respondido));
}
function gerarPdf() {
  preencherImpressao();
  setTimeout(() => window.print(), 50);
}

// Alternativa sem e-mail: abre o compartilhamento do aparelho (WhatsApp, e-mail...) com o arquivo de respostas.
async function compartilhar() {
  const txt = M.montarRelatorioTexto(metaAgora(), SECOES, estado.respostas);
  const arquivo = new File([txt], 'respostas-faxa.txt', { type: 'text/plain' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], title: 'Respostas do formulário Faxa' });
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
  }
  baixarArquivo('respostas-faxa.txt', txt, 'text/plain');
  toast('Arquivo baixado. Mande para o Ricardo pelo WhatsApp ou e-mail.');
}

async function enviarFormulario() {
  const msg = document.getElementById('msg-envio');
  if (M.obrigatoriasFaltando(SECOES, estado.respostas).length) return;
  if (!window.confirm('Enviar agora para o Ricardo? Depois de enviado, o rascunho é apagado deste aparelho.')) return;
  msg.textContent = 'Enviando…';
  try {
    const res = await fetch('/api/enviar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ respostas: estado.respostas }) });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok || !dados.ok) throw new Error(dados.erro || 'falha');
    limparArmazenamento();
    estado.respostas = {};
    mostrar('enviado');
  } catch (e) {
    msg.textContent = `${e.message === 'falha' ? 'Não foi possível enviar agora.' : e.message} Suas respostas continuam guardadas. Tente de novo ou use "Compartilhar arquivo" ou "Salvar como PDF" e mande para o Ricardo.`;
  }
}

/* ---------- desenho ---------- */
function desenhar() {
  raiz.replaceChildren();
  const noTopo = estado.tela === 'passo' || estado.tela === 'revisao';
  document.getElementById('topo').hidden = !noTopo;
  raiz.append(estado.tela === 'passo' ? telaPasso() : estado.tela === 'revisao' ? telaRevisao() : estado.tela === 'enviado' ? telaEnviado() : telaInicio());
  atualizarBarra();
}

document.getElementById('topo-voltar').append(icone('esquerda'));
document.getElementById('topo-menu').append(icone('lista'));
document.getElementById('topo-voltar').addEventListener('click', () => {
  if (estado.tela === 'revisao') { const l = passos(); mostrar('passo', l[l.length - 1].id); } else ir(-1);
});
document.getElementById('topo-menu').addEventListener('click', () => mostrar('inicio'));

carregar();
montarBarra();
desenhar();
