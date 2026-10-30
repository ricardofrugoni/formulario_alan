# Formulário Faxa — alinhamento com Alan

Página única, em português, para Alan revisar o que já foi levantado na conversa e responder o que falta. Ao final, as respostas chegam ao Ricardo por e-mail (relatório em texto + arquivo `.json`). Não há banco de dados.

## O que tem aqui

| Pasta/arquivo | Para quê |
|---|---|
| `public/perguntas.js` | **Todo o conteúdo**: assuntos, perguntas, opções, resumos "Pelo que conversamos…". Cada pergunta aponta para um item do levantamento (`levId`). |
| `public/motor.js` | Regras (pergunta condicional, progresso, obrigatórias, situação respondido/pendente/dúvida, relatório). Usado pela tela, pelo servidor e pelos testes. |
| `public/app.js` | Interface: uma pergunta por tela, rascunho, revisão, envio, PDF, compartilhar. |
| `public/estilo.css`, `public/index.html`, `public/fonts/` | Visual. Cores e tipografia são variáveis no topo do CSS. |
| `src/worker.js`, `src/mime.js` | Servidor do Cloudflare que monta o e-mail com anexos e envia. |
| `wrangler.jsonc` | Configuração do Cloudflare (sem segredos). |
| `tests/` | Testes de regras, de perguntas, de e-mail e de fluxo no Chrome. |
| `../levantamento/` | Fonte do levantamento (`itens.mjs`), gerador e `LEVANTAMENTO.md`. |

## Rodar e testar no seu computador

```bash
npm install
npm test                      # regras, perguntas (levId, termos técnicos, sem segredos) e e-mail
node tests/fluxo.e2e.mjs      # fluxo completo no Chrome (preencher, retomar, revisar, enviar, falha, PDF)
npm run dev                   # abre em http://127.0.0.1:8787 com o servidor de envio simulado
```

No modo `dev` o Wrangler não envia e-mail de verdade: grava o e-mail montado em `.wrangler/tmp/email/*.eml` para conferência.

Se mudar o levantamento: `node levantamento/gerar.mjs` refaz o `LEVANTAMENTO.md`.

## Publicar no Cloudflare (só depois da sua autorização)

1. `npx wrangler login`.
2. No painel do Cloudflare, no domínio que você vai usar: **Email → Email Routing → ativar**. Não precisa criar caixa de e-mail.
3. Em **Destination addresses**, adicionar `ricardo.frugoni@icloud.com` e clicar no link de verificação que chega nesse e-mail.
4. Em `wrangler.jsonc`, trocar `REMETENTE` (ex.: `formulario@seudominio.com`; o endereço não precisa existir, mas o domínio precisa ter Email Routing ativo).
5. `npm run deploy`.
6. Link curto: **Workers & Pages → faxa-formulario → Settings → Domains & Routes → Add → Custom domain** (ex.: `alinha.seudominio.com`).
7. Faça um envio de teste antes de mandar o link para Alan.
8. **Depois que Alan enviar:** `npx wrangler delete` e remova o domínio. Isso encerra o "uso único".

## Onde as respostas ficam e como consultar

- **Enquanto Alan preenche:** só no navegador dele (rascunho). Ele pode "Baixar rascunho" e "Carregar rascunho" para trocar de aparelho. Não é recebimento online.
- **Quando Alan clica em enviar:** chega ao seu e-mail. Corpo e anexo `.txt` = relatório legível separado em *Dúvidas para Ricardo*, *Pendentes* e *Respondidas*. Anexo `.json` = dados estruturados com `id`, `levantamento`, `situacao`, `estado`, `valor`, `duvida`, `responsavel`, `falta` e `atualizadoEm` por pergunta.
- O servidor **não guarda nada**. O rascunho de Alan é apagado do aparelho ao enviar.
- Se o e-mail falhar, a tela orienta **Compartilhar arquivo** (menu do celular: WhatsApp, e-mail…) ou **Salvar como PDF**.

## Limitações e dependências externas

- **O envio real de e-mail não foi testado aqui**, só a montagem e o aceite pelo servidor local. O primeiro teste é no seu Cloudflare (passo 7).
- **Link público:** qualquer pessoa com o endereço abre a página e pode enviar. A página tem `noindex`, o servidor só aceita envio vindo da própria página e limita o tamanho. Nada impede um segundo envio além de você apagar o Worker.
- A página mostra resumos da conversa e nomes de clientes (Criyotec, Betgo). Não traz senhas, códigos, e-mails, links de convite ou dados pessoais de terceiros (há teste automático para isso).
- Rascunho no navegador: se Alan limpar os dados do site ou usar aba anônima, perde o que não baixou.
- Fonte Albert Sans empacotada em `public/fonts` (licença OFL). Nada é carregado de terceiros.
