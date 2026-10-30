# Hand-off de design

Referências em `design/`: `referencia-ux-onboarding.jpg` (fluxo) e `referencia-cores-tipografia.jpg` (cor e tipo).

## Direção aplicada
Fundo carvão, folhas e campos em creme quente, texto branco-creme, tipografia geométrica leve (Albert Sans variável, pesos 300–600). Uma pergunta por tela, barra de progresso fina no topo, opções em pílula, botão redondo para avançar com prévia cinza da próxima pergunta.

## Onde mexer sem tocar na lógica
- **Tokens:** bloco `:root` no topo de `public/estilo.css` (cores, fonte, pesos, raios, altura de toque `--alvo`, largura `--largura`).
- **Fonte:** `public/fonts/*.woff2` + `@font-face` no CSS.
- **Texto das telas:** `public/perguntas.js` (conteúdo) e `public/app.js` (rótulos fixos como "Confirmar", "A seguir").
- **Ícones:** objeto `ICONES` em `app.js` (SVG, traço 2, `currentColor`). Para trocar de biblioteca, troque os caminhos.

## Mapa de telas e classes
| Tela | Estrutura | Classes principais |
|---|---|---|
| Início | marca, título, 2 parágrafos, 3 passos, botão, lista de assuntos | `.hero`, `.passos`, `.mapa` |
| Entrada de assunto | contador, título grande, intro | `.assunto` |
| Pergunta | título, ajuda, corpo, atalhos, dúvida, "de onde vem", meta | `.q`, `.resumo`, `.opcoes/.opcao`, `.conf`, `.chip`, `.linha-lista`, `.servico` |
| Revisão | resumo em linha, aviso de pendências, ações, listas recolhíveis | `.rev-resumo`, `.aviso`, `.rev-lista` |
| Recebido | selo, título, texto | `.sucesso` |
| Topo (perguntas e revisão) | voltar, contexto, %, menu + barra | `.topo`, `.barra` |
| Rodapé (perguntas) | prévia + botão redondo | `.nav`, `.previa`, `.redondo` |

Estados já tratados: marcado (`:has(input:checked)`, `aria-pressed`), foco (anel azul claro), erro de destaque (`.q.erro`), oculto (`[hidden]`), reduzir movimento, impressão (`@media print`).

## Leis de UX aplicadas
Hick (uma pergunta por tela, 8 obrigatórias no máximo), Fitts (alvos de 52 px, botão redondo no polegar), Miller (8 assuntos curtos), Jakob (padrão de onboarding conhecido), Zeigarnik e gradiente de meta (barra e contador sempre visíveis), Tesler (o sistema pré-preenche o que já foi dito), Postel (aceita "não sei" e texto livre), Von Restorff ("Confirmar" em destaque, botão redondo único), Pico-fim (tela de "Recebido!").

## Regras do piso de qualidade que valem aqui
Sem rótulo acima de título, sem borda lateral grossa em destaque, sem símbolos de texto como ícone, sem vidro desfocado, uma única animação de entrada por tela, sombras com deslocamento e desfoque, contraste mínimo 4,5:1 (valores anotados nos tokens).

## Em aberto para o outro agente
- Logo da Faxa (existe `faxa-marketing-logo.jpg` em Downloads; não foi usado).
- Versão clara opcional (hoje só escura, como a referência).
- Ilustração ou microanimação da tela "Recebido!" (hoje só o selo).
- Revisar espaçamento da lista de custos (`FIN-04`, 10 campos por linha).

## Como conferir depois de mexer
```bash
npm test                                      # conteúdo e regras
node tests/fluxo.e2e.mjs <pasta-de-capturas>  # fluxo no Chrome + PNGs (390×844)
node tests/desktop.shot.mjs <pasta>           # PNGs a 1280×800
```
