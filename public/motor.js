// Regras do formulário, sem dependência de navegador: usadas pela tela, pelo Worker de envio e pelos testes.

export const ESTADOS_ESPECIAIS = {
  nao_sei: 'Não sei',
  nao_se_aplica: 'Não se aplica',
  conversar: 'Preciso conversar com Ricardo',
};

export const ROTULO_ESTADO = {
  respondido: 'Respondido',
  confirmado: 'Confirmado',
  corrigido: 'Corrigido',
  complementado: 'Complementado',
  ...ESTADOS_ESPECIAIS,
};

export function todasPerguntas(secoes) {
  return secoes.flatMap((s) => s.itens.map((i) => ({ ...i, secaoId: s.id, secaoTitulo: s.titulo })));
}

export function valorVazio(v) {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => (typeof x === 'object' ? Object.values(x).every(valorVazio) : valorVazio(x)));
  if (typeof v === 'object') return Object.values(v).every(valorVazio);
  return false;
}

// Pergunta condicional: aparece só quando a resposta de outra pergunta atende à condição.
export function visivel(item, respostas) {
  if (!item.se) return true;
  const alvo = respostas[item.se.id];
  if (!alvo) return false;
  const v = alvo.valor;
  const lista = Array.isArray(v) ? v : [v];
  if (item.se.em) return lista.some((x) => item.se.em.includes(x));
  if (item.se.estado) return item.se.estado.includes(alvo.estado);
  return false;
}

export function duvidaMarcada(r) {
  return Boolean(r && (r.estado === 'conversar' || (r.duvida && r.duvida.marcada)));
}

// A pessoa tomou posição sobre a pergunta (respondeu, confirmou, ou disse "não sei", "não se aplica" ou "conversar").
export function tratada(item, r) {
  if (!r) return false;
  if (r.estado in ESTADOS_ESPECIAIS) return true;
  if (item.tipo === 'confirmar') {
    if (r.estado === 'confirmado') return true;
    if (r.estado === 'corrigido' || r.estado === 'complementado') return !valorVazio(r.texto);
    return false;
  }
  return !valorVazio(r.valor);
}

// respondido: informação útil recebida | pendente: sem resposta útil ("não sei" inclusive) | duvida: precisa falar com Ricardo
export function situacao(item, r) {
  if (duvidaMarcada(r)) return 'duvida';
  if (!tratada(item, r)) return 'pendente';
  if (r.estado === 'nao_sei') return 'pendente';
  return 'respondido';
}

export function progresso(secoes, respostas) {
  const vis = todasPerguntas(secoes).filter((i) => visivel(i, respostas));
  const feitas = vis.filter((i) => tratada(i, respostas[i.id])).length;
  return { total: vis.length, feitas, percentual: vis.length ? Math.round((feitas / vis.length) * 100) : 0 };
}

export function progressoSecao(secao, respostas) {
  const vis = secao.itens.filter((i) => visivel(i, respostas));
  return { total: vis.length, feitas: vis.filter((i) => tratada(i, respostas[i.id])).length };
}

export function obrigatoriasFaltando(secoes, respostas) {
  return todasPerguntas(secoes).filter(
    (i) => i.obrigatorio && visivel(i, respostas) && !tratada(i, respostas[i.id]),
  );
}

function textoValor(item, r) {
  if (r.estado in ESTADOS_ESPECIAIS) return ROTULO_ESTADO[r.estado];
  if (item.tipo === 'confirmar') {
    const base = ROTULO_ESTADO[r.estado] || '';
    return r.texto ? `${base}: ${r.texto}` : base;
  }
  const v = r.valor;
  const rotulo = (x) => (item.opcoes || []).find((o) => o.v === x)?.l ?? x;
  if (Array.isArray(v)) {
    if (item.tipo === 'lista' || item.tipo === 'servicos') {
      return v
        .map((linha, n) => `   ${n + 1}) ` + Object.entries(linha).filter(([, x]) => !valorVazio(x)).map(([k, x]) => `${rotuloCampo(item, k)}: ${Array.isArray(x) ? x.join(', ') : x}`).join(' | '))
        .join('\n');
    }
    return v.map(rotulo).join(', ') + (valorVazio(r.texto) ? '' : ` (${r.texto})`);
  }
  return String(rotulo(v)) + (valorVazio(r.texto) ? '' : ` — ${r.texto}`);
}

function rotuloCampo(item, k) {
  return (item.campos || []).find((c) => c.id === k)?.rotulo ?? k;
}

export function montarRelatorioTexto(meta, secoes, respostas) {
  const perguntas = todasPerguntas(secoes).filter((i) => visivel(i, respostas));
  const grupos = { duvida: [], pendente: [], respondido: [] };
  for (const p of perguntas) grupos[situacao(p, respostas[p.id])].push(p);

  const linhas = [];
  linhas.push(`FORMULÁRIO FAXA — RESPOSTAS DE ${meta.respondente || 'ALAN'}`);
  linhas.push(`Enviado em: ${meta.enviadoEm}`);
  linhas.push(`Respondidas: ${grupos.respondido.length} | Pendentes: ${grupos.pendente.length} | Dúvidas para Ricardo: ${grupos.duvida.length}`);
  linhas.push('');

  const bloco = (titulo, lista) => {
    linhas.push(`==== ${titulo} (${lista.length}) ====`);
    if (!lista.length) linhas.push('(nenhuma)');
    for (const p of lista) {
      const r = respostas[p.id] || {};
      linhas.push('');
      const lev = p.levId && p.levId !== p.id ? ` (levantamento ${p.levId})` : '';
      linhas.push(`[${p.id}]${lev} ${p.secaoTitulo} — ${p.titulo}`);
      if (r.estado || !valorVazio(r.valor)) linhas.push(`  Resposta: ${textoValor(p, r)}`);
      if (r.estado && r.estado in ESTADOS_ESPECIAIS && !valorVazio(r.nota)) linhas.push(`  Observação: ${r.nota}`);
      if (r.duvida && r.duvida.marcada) linhas.push(`  Dúvida: ${valorVazio(r.duvida.texto) ? '(sem detalhe)' : r.duvida.texto}`);
      if (!valorVazio(r.responsavel)) linhas.push(`  Quem resolve: ${r.responsavel}`);
      if (!valorVazio(r.falta)) linhas.push(`  O que falta: ${r.falta}`);
      if (!valorVazio(r.nota) && !(r.estado in ESTADOS_ESPECIAIS)) linhas.push(`  Observação: ${r.nota}`);
    }
    linhas.push('');
  };
  bloco('DÚVIDAS PARA RICARDO', grupos.duvida);
  bloco('PENDENTES', grupos.pendente);
  bloco('RESPONDIDAS', grupos.respondido);
  return linhas.join('\n');
}

export function montarJson(meta, secoes, respostas) {
  const itens = todasPerguntas(secoes).map((p) => {
    const r = respostas[p.id] || null;
    return {
      id: p.id,
      levantamento: p.levId || null,
      secao: p.secaoId,
      visivel: visivel(p, respostas),
      situacao: visivel(p, respostas) ? situacao(p, r) : 'nao_exibida',
      estado: r?.estado ?? null,
      valor: r?.valor ?? null,
      texto: r?.texto ?? null,
      nota: r?.nota ?? null,
      duvida: r?.duvida ?? null,
      responsavel: r?.responsavel ?? null,
      falta: r?.falta ?? null,
      atualizadoEm: r?.atualizadoEm ?? null,
    };
  });
  return { versao: 1, ...meta, itens };
}
