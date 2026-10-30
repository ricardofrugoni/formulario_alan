// Monta uma mensagem de e-mail (MIME) com corpo em texto e anexos, sem dependências.

const enc = new TextEncoder();

export function base64Utf8(texto) {
  const bytes = enc.encode(texto);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const quebra76 = (b64) => b64.replace(/(.{76})/g, '$1\r\n');
const assunto = (t) => `=?UTF-8?B?${base64Utf8(t)}?=`;

export function limparCabecalho(v) {
  return String(v).replace(/[\r\n]+/g, ' ').trim();
}

export function montarMime({ de, para, assunto: subj, corpo, anexos = [], dominioId = 'faxa.local' }) {
  const limite = `faxa-${crypto.randomUUID()}`;
  const cab = [
    `From: ${limparCabecalho(de)}`,
    `To: ${limparCabecalho(para)}`,
    `Subject: ${assunto(limparCabecalho(subj))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${dominioId}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${limite}"`,
  ];
  const partes = [
    `--${limite}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    quebra76(base64Utf8(corpo)),
  ];
  for (const a of anexos) {
    const nome = a.nome.replace(/[^\w.\-]/g, '_');
    partes.push(
      `--${limite}`,
      `Content-Type: ${a.tipo}; name="${nome}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${nome}"`,
      '',
      quebra76(base64Utf8(a.conteudo)),
    );
  }
  partes.push(`--${limite}--`, '');
  return cab.join('\r\n') + '\r\n\r\n' + partes.join('\r\n');
}
