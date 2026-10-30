// Conteúdo do formulário. Cada pergunta aponta para um item do levantamento (levId).
// grupo: confirmar (padrão para tipo "confirmar") | alan (padrão) | decisao | ricardo | terceiros
export const INTRO = {
  selo: 'Alinhamento Faxa',
  titulo: 'Alan, vamos deixar tudo organizado?',
  paragrafos: [
    'O Ricardo juntou o que vocês já conversaram. Você não precisa repetir nada: é só confirmar, corrigir ou completar.',
    'Não sabe? Toque em "Não sei" ou em "Preciso conversar com Ricardo". Pode parar quando quiser e voltar depois.',
  ],
  passos: [
    'Confirme o que o Ricardo já entendeu.',
    'Responda só o que ainda falta.',
    'Revise e envie. O Ricardo recebe tudo de uma vez.',
  ],
};

export const CAMPOS_SERVICO = [
  { id: 'nome', rotulo: 'Serviço' },
  { id: 'origem', rotulo: 'Origem' },
  { id: 'status', rotulo: 'Situação' },
  { id: 'nomeCorrigido', rotulo: 'Nome corrigido' },
  { id: 'escopo', rotulo: 'O que inclui', tipo: 'longo' },
  { id: 'publico', rotulo: 'Para quem é', tipo: 'longo' },
  { id: 'preco', rotulo: 'Preço ou faixa de preço', tipo: 'texto' },
  { id: 'etapas', rotulo: 'Etapas do atendimento, do primeiro contato ao fechamento', tipo: 'longo' },
  { id: 'crm', rotulo: 'O que o CRM precisa guardar ou fazer para esse serviço', tipo: 'longo' },
];

const SIM_NAO_DEPENDE = [{ v: 'sim', l: 'Sim' }, { v: 'em_parte', l: 'Em parte' }, { v: 'nao', l: 'Não' }];
const OUTRO = { v: 'outro', l: 'Outro' };

export const SECOES = [
  {
    id: 'criyotec', titulo: 'Criyotec', cliente: 'Criyotec',
    intro: 'O que falta para a Criyotec aprovar e fechar.',
    itens: [
      { id: 'CRY-06', levId: 'CRY-06', tipo: 'confirmar', grupo: 'terceiros', titulo: 'Fechamento dos tickets de suporte', resumo: 'Os tickets ainda não fecham sozinhos, porque o fornecedor não mandou o aviso de "ticket resolvido". O pedido já foi feito no grupo.', ref: 'Mensagens do Ricardo, 28/10 de madrugada e 30/10.' },
      { id: 'CRY-01', levId: 'CRY-01', tipo: 'longo', obrigatorio: true, titulo: 'O que ainda falta para a Criyotec dar o aceite?', ajuda: 'Pense no que eles reclamaram ou pediram por último.', dica: 'Ex.: querem ver X funcionando, faltam Y e Z…' },
      { id: 'CRY-02q', levId: 'CRY-02', tipo: 'escolha', titulo: 'A Criyotec já disse que o que foi entregue atende ao combinado?', opcoes: [{ v: 'sim', l: 'Sim, já confirmaram' }, { v: 'em_parte', l: 'Em parte' }, { v: 'nao_perguntei', l: 'Ainda não perguntei' }, { v: 'nao', l: 'Disseram que não' }] },
    ],
  },
  {
    id: 'betgo', titulo: 'Betgo', cliente: 'Betgo',
    intro: 'Tudo que a Betgo precisa que o sistema faça, em linguagem simples.',
    itens: [
      { id: 'BET-01', levId: 'BET-01', tipo: 'confirmar', titulo: 'Call para entender a Betgo', resumo: 'A Betgo ainda está em fechamento. Você fará uma call com eles para entender o que precisam e acertar os valores, e depois pede o documento.', ref: 'Seus áudios de 30/10, 07:58 e 08:31.' },
      { id: 'BET-01q', levId: 'BET-01', tipo: 'data', titulo: 'Quando é a call com a Betgo?', ajuda: 'Se ainda não marcou, deixe em branco.' },
      { id: 'BET-04', levId: 'BET-04', tipo: 'multipla', titulo: 'No cartão de cada jogador, o que você quer enxergar?', opcoes: [{ v: 'saldo', l: 'Saldo atual' }, { v: 'depositado', l: 'Quanto já depositou' }, { v: 'sacado', l: 'Quanto já sacou' }, { v: 'historico', l: 'Histórico de depósitos e saques' }, { v: 'primeiro', l: 'Data do primeiro depósito' }, { v: 'ultima', l: 'Última atividade' }, OUTRO] },
      { id: 'BET-05', levId: 'BET-05', tipo: 'multipla', grupo: 'decisao', titulo: 'Em quais momentos o jogador deve receber mensagem?', ajuda: 'O resto só atualiza o cartão, sem enviar nada.', opcoes: [{ v: 'cadastro', l: 'Cadastro novo (boas-vindas)' }, { v: 'primeiro', l: 'Primeiro depósito' }, { v: 'deposito', l: 'Depósito concluído' }, { v: 'deposito_falha', l: 'Depósito com problema' }, { v: 'saque', l: 'Saque pedido ou concluído' }, { v: 'inativo', l: 'Ficou dias sem jogar' }, { v: 'verificacao', l: 'Verificação de identidade' }, { v: 'cupom', l: 'Cupom ou bônus' }, OUTRO] },
      { id: 'BET-06', levId: 'BET-06', tipo: 'longo', grupo: 'decisao', titulo: 'Quantas mensagens por pessoa já são demais? Quando o sistema deve parar de mandar?', dica: 'Ex.: no máximo 1 por dia; parar se a pessoa pedir…' },
      { id: 'BET-07', levId: 'BET-07', tipo: 'escolha', grupo: 'decisao', titulo: 'Quando o jogador pede autoexclusão ou tem o acesso restringido, o que o sistema deve fazer?', opcoes: [{ v: 'parar_tudo', l: 'Parar todas as mensagens' }, { v: 'parar_ofertas', l: 'Parar só as ofertas e manter avisos' }, { v: 'avisar_equipe', l: 'Avisar a equipe e esperar' }, { v: 'depende', l: 'Depende da Betgo' }] },
      { id: 'DOC-01', levId: 'DOC-01', tipo: 'escolha', grupo: 'terceiros', titulo: 'O fornecedor já respondeu se dá para consultar o histórico (jogadores, depósitos, saques, tickets e mensagens)?', opcoes: [{ v: 'sim', l: 'Sim, dá' }, { v: 'nao', l: 'Não dá' }, { v: 'aguardando', l: 'Ainda não respondeu' }] },
    ],
  },
  {
    id: 'crm', titulo: 'CRM da Faxa', cliente: 'Faxa',
    intro: 'Dois pedidos seus que estão com o Ricardo.',
    itens: [
      { id: 'CRM-09', levId: 'CRM-09', tipo: 'confirmar', grupo: 'ricardo', titulo: 'Disparo de e-mail', resumo: 'Você quer disparar e-mail pelo CRM. Esse pedido está com o Ricardo, e ainda não ficou claro se já existe.', ref: 'Conversa de 28/10 e 30/10 (09:54).' },
      { id: 'CRM-10', levId: 'CRM-10', tipo: 'confirmar', grupo: 'ricardo', titulo: 'Painel geral', resumo: 'Você pediu uma visão geral, tipo painel, e o pedido está com o Ricardo.', ref: 'Mensagem de 28/10 às 18:34.' },
      { id: 'CRM-10q', levId: 'CRM-10', tipo: 'multipla', titulo: 'O que você quer ver de uma vez no painel geral?', opcoes: [{ v: 'leads', l: 'Leads novos por dia' }, { v: 'etapas', l: 'Negócios em cada etapa' }, { v: 'vendas', l: 'Vendas fechadas' }, { v: 'gasto', l: 'Gasto com anúncios' }, { v: 'campanha', l: 'Resultado por campanha' }, { v: 'atendimentos', l: 'Atendimentos por pessoa' }, OUTRO] },
    ],
  },
  {
    id: 'ia', titulo: 'Módulo de IA', cliente: 'Faxa',
    intro: 'Este formulário substitui o documento que você ficou de mandar sobre a IA. Responda como falaria no dia a dia.',
    itens: [
      { id: 'IA-09', levId: 'IA-09', tipo: 'longo', obrigatorio: true, titulo: 'Se a IA começasse por uma única tarefa, qual seria? Como você perceberia que deu certo?' },
      { id: 'IA-01', levId: 'IA-01', tipo: 'longo', titulo: 'O que mais toma tempo da equipe no atendimento e na operação?' },
      { id: 'IA-02', levId: 'IA-02', tipo: 'longo', titulo: 'O que você e sua esposa gostariam que o sistema fizesse sozinho?', ajuda: 'Do menor detalhe ao maior: tudo que tira trabalho manual.' },
      { id: 'IA-03', levId: 'IA-03', tipo: 'escolha', titulo: 'A IA pode responder sozinha ou alguém aprova antes de enviar?', opcoes: [{ v: 'sozinha', l: 'Pode responder sozinha' }, { v: 'aprovacao', l: 'Alguém aprova antes de enviar' }, { v: 'depende', l: 'Depende do assunto' }] },
      { id: 'IA-04', levId: 'IA-04', tipo: 'multipla', titulo: 'O que a IA pode fazer sem pedir permissão?', opcoes: [{ v: 'negocio', l: 'Criar um negócio no CRM' }, { v: 'etapa', l: 'Mudar o negócio de etapa' }, { v: 'agendar', l: 'Marcar agendamento' }, { v: 'etiqueta', l: 'Colocar etiqueta' }, { v: 'registrar', l: 'Registrar anotações' }, OUTRO] },
      { id: 'IA-05', levId: 'IA-05', tipo: 'multipla', titulo: 'Que materiais vocês já têm para a IA usar nas respostas?', opcoes: [{ v: 'faq', l: 'Perguntas frequentes' }, { v: 'precos', l: 'Tabela de preços' }, { v: 'apresentacao', l: 'Apresentações dos serviços' }, { v: 'contratos', l: 'Modelos de contrato' }, { v: 'nenhum', l: 'Ainda não temos' }, OUTRO] },
      { id: 'IA-06', levId: 'IA-06', tipo: 'longo', titulo: 'Quando a IA deve chamar uma pessoa? O que ela nunca pode prometer?' },
      { id: 'IA-07', levId: 'IA-07', tipo: 'escolha', titulo: 'A IA deve procurar quem ficou sem responder?', opcoes: [{ v: 'sim', l: 'Sim, retomar o contato' }, { v: 'nao', l: 'Não, só responder' }, { v: 'depende', l: 'Só em alguns casos' }] },
      { id: 'IA-07b', levId: 'IA-07', tipo: 'texto', se: { id: 'IA-07', em: ['sim', 'depende'] }, titulo: 'Depois de quanto tempo, e quantas vezes?', dica: 'Ex.: depois de 2 dias, no máximo 3 vezes' },
      { id: 'IA-08a', levId: 'IA-08', tipo: 'texto', titulo: 'Mais ou menos quantos atendimentos vocês têm por dia?' },
      { id: 'IA-08b', levId: 'IA-08', tipo: 'escolha', titulo: 'A IA precisa atender fora do horário comercial?', opcoes: [{ v: 'comercial', l: 'Não, só no horário comercial' }, { v: 'noite', l: 'Sim, à noite e fins de semana também' }] },
    ],
  },
  {
    id: 'servicos', titulo: 'Serviços da Faxa', cliente: 'Faxa',
    intro: 'Confirme o que a Faxa vende. A lista vem do site e da nossa conversa; corrija ou acrescente.',
    itens: [
      { id: 'SRV-03', levId: 'SRV-03', tipo: 'servicos', obrigatorio: true, titulo: 'Quais serviços a Faxa oferece hoje?', ajuda: 'Escolha uma situação para cada serviço. Os detalhes aparecem em seguida.', campos: CAMPOS_SERVICO, opcoes: [
        { v: 'media-day', l: 'Media Day (combo de conteúdo)', origem: 'site', d: 'No site: 8 vídeos, fotos profissionais, roteiros e 1 dia de gravação na clínica, com direção.' },
        { v: 'trafego', l: 'Gestão de tráfego pago', origem: 'conversa', d: 'Citado na conversa de 30/10.' },
        { v: 'social', l: 'Social media', origem: 'conversa', d: 'Citado na conversa de 30/10.' },
        { v: 'video', l: 'Gravação de vídeo como porta de entrada', origem: 'conversa', d: 'Pode ser o mesmo que o Media Day. Se for, marque "Não oferecemos" aqui.' },
        { v: 'faxacrm', l: 'faxaCRM', origem: 'conversa', d: 'Vendido pontualmente, segundo você.' },
        { v: 'clinicfx', l: 'Clinicfx (sistema para consultório)', origem: 'conversa', d: 'Para consultórios; pensado para vender depois a dentistas.' },
      ] },
      { id: 'SRV-01', levId: 'SRV-01', tipo: 'longo', titulo: 'Por onde o cliente deixa os dados até a conversa chegar ao WhatsApp?', ajuda: 'O site do Media Day não tem formulário: o botão leva direto ao WhatsApp.', dica: 'Ex.: formulário do anúncio, link na bio, botão do site…' },
      { id: 'SRV-02', levId: 'SRV-02', tipo: 'multipla', titulo: 'Que informações vocês querem guardar de cada lead?', opcoes: [{ v: 'nome', l: 'Nome' }, { v: 'telefone', l: 'Telefone' }, { v: 'email', l: 'E-mail' }, { v: 'cpf', l: 'CPF' }, { v: 'servico', l: 'Tipo de serviço' }, { v: 'agendamento', l: 'Data do agendamento' }, { v: 'origem', l: 'De onde veio (anúncio, indicação…)' }, { v: 'orcamento', l: 'Valor do orçamento' }, OUTRO] },
      { id: 'SRV-05', levId: 'SRV-05', tipo: 'escolha', grupo: 'decisao', titulo: 'Quando houver dados suficientes, quer que o sistema aponte quais leads têm mais chance de fechar?', ajuda: 'É uma possibilidade, não algo já pronto.', opcoes: [{ v: 'sim', l: 'Sim, quero ver isso' }, { v: 'depois', l: 'Pode ficar para depois' }, { v: 'nao', l: 'Não, por enquanto' }] },
    ],
  },
  {
    id: 'site', titulo: 'Site e posicionamento', cliente: 'Faxa',
    intro: 'Como a Faxa se apresenta e atrai clientes além das indicações.',
    itens: [
      { id: 'SIT-02', levId: 'SIT-02', tipo: 'confirmar', titulo: 'Quem faz a landing page', resumo: ['O Ricardo se ofereceu para criar a página, mas você disse que o Jalles faria.', 'O Ricardo ficou com a revisão e o SEO.'], ref: 'Conversa de 30/10, 08:40 a 08:57.' },
      { id: 'SIT-02a', levId: 'SIT-02', tipo: 'data', titulo: 'Qual o prazo combinado com o Jalles para a landing page?', ajuda: 'Deixe em branco se não houver prazo.' },
      { id: 'SIT-02b', levId: 'SIT-02', tipo: 'texto', titulo: 'Quem aprova a página antes de publicar?' },
      { id: 'SIT-01', levId: 'SIT-01', tipo: 'multipla', titulo: 'O que não pode faltar no site da Faxa?', opcoes: [{ v: 'videos', l: 'Vídeos cortados do trabalho' }, { v: 'empresas', l: 'Empresas atendidas' }, { v: 'resumo', l: 'Resumo do que a Faxa faz' }, { v: 'depoimentos', l: 'Depoimentos' }, { v: 'whats', l: 'Botão para o WhatsApp' }, { v: 'precos', l: 'Planos e preços' }, { v: 'sobre', l: 'Quem somos / equipe' }, OUTRO] },
      { id: 'SIT-01b', levId: 'SIT-01', tipo: 'texto', titulo: 'Tem um site que você gosta como referência?', dica: 'Cole o endereço' },
      { id: 'SIT-03', levId: 'SIT-03', tipo: 'texto', titulo: 'Qual é o papel do Gabriel na Faxa e no site?' },
      { id: 'POS-01a', levId: 'POS-01', tipo: 'longo', titulo: 'Para quem a Faxa trabalha melhor?', dica: 'Tipo de cliente, segmento, tamanho' },
      { id: 'POS-01b', levId: 'POS-01', tipo: 'longo', titulo: 'O que a Faxa faz de diferente dos concorrentes?' },
      { id: 'POS-02', levId: 'POS-02', tipo: 'multipla', grupo: 'decisao', titulo: 'Além de indicação, que canais vocês querem usar para trazer clientes?', opcoes: [{ v: 'trafego', l: 'Tráfego pago' }, { v: 'instagram', l: 'Instagram' }, { v: 'site_seo', l: 'Site e SEO' }, { v: 'video', l: 'Campanha de gravação (Media Day)' }, { v: 'parcerias', l: 'Parcerias' }, OUTRO] },
      { id: 'POS-03a', levId: 'POS-03', tipo: 'texto', titulo: 'Quem cuida do Instagram da Faxa hoje?' },
      { id: 'POS-03b', levId: 'POS-03', tipo: 'escolha', titulo: 'Com que frequência vocês postam?', opcoes: [{ v: 'diario', l: 'Todo dia' }, { v: 'semana', l: 'Algumas vezes por semana' }, { v: 'raro', l: 'De vez em quando' }, { v: 'parado', l: 'Está parado' }] },
      { id: 'POS-04a', levId: 'POS-04', tipo: 'valor', titulo: 'Quanto vocês podem investir por mês para atrair clientes?' },
      { id: 'POS-04b', levId: 'POS-04', tipo: 'texto', titulo: 'Qual a meta para os próximos meses?', dica: 'Ex.: 5 clientes novos por mês' },
    ],
  },
  {
    id: 'financeiro', titulo: 'Financeiro e custos', cliente: 'Faxa',
    intro: 'Para o Ricardo organizar o caixa e mostrar onde dá para economizar. Tudo é confidencial.',
    itens: [
      { id: 'FIN-01', levId: 'FIN-01', tipo: 'multipla', titulo: 'Onde vocês registram o que entra e o que sai de dinheiro?', opcoes: [{ v: 'planilha', l: 'Planilha' }, { v: 'caderno', l: 'Caderno ou livro-caixa' }, { v: 'sistema', l: 'Sistema financeiro' }, { v: 'contador', l: 'Com o contador' }, { v: 'nenhum', l: 'Ainda não registramos' }, OUTRO] },
      { id: 'FIN-02', levId: 'FIN-02', tipo: 'escolha', titulo: 'Dá para mandar os últimos meses de entradas e saídas?', opcoes: [{ v: 'sim', l: 'Sim, consigo mandar' }, { v: 'parte', l: 'Só uma parte' }, { v: 'nao', l: 'Não tenho organizado' }] },
      { id: 'FIN-03', levId: 'FIN-03', tipo: 'multipla', titulo: 'Onde você sente que a Faxa trava mais?', opcoes: [{ v: 'tempo', l: 'Falta de tempo' }, { v: 'equipe', l: 'Equipe' }, { v: 'dinheiro', l: 'Dinheiro em caixa' }, { v: 'ferramentas', l: 'Ferramentas e sistemas' }, { v: 'clientes', l: 'Poucos clientes novos' }, OUTRO] },
      { id: 'FIN-04', levId: 'FIN-04', tipo: 'lista', titulo: 'Liste cada ferramenta ou serviço que vocês pagam', ajuda: 'Pode listar do jeito que lembrar. O Ricardo completa o resto.', rotuloLinha: 'Ferramenta', rotuloAdicionar: 'Adicionar ferramenta', campos: [
        { id: 'nome', rotulo: 'Nome' },
        { id: 'finalidade', rotulo: 'Para que serve' },
        { id: 'de_quem', rotulo: 'De quem é a despesa', tipo: 'escolha', opcoes: [{ v: 'faxa', l: 'Da Faxa' }, { v: 'cliente', l: 'De um cliente' }, { v: 'paralelo', l: 'De um projeto paralelo' }, { v: 'pessoal', l: 'Pessoal' }] },
        { id: 'plano', rotulo: 'Plano' },
        { id: 'valor', rotulo: 'Valor', tipo: 'valor' },
        { id: 'moeda', rotulo: 'Moeda', tipo: 'escolha', opcoes: [{ v: 'BRL', l: 'Real (R$)' }, { v: 'USD', l: 'Dólar (US$)' }, { v: 'EUR', l: 'Euro' }] },
        { id: 'frequencia', rotulo: 'Cobrança', tipo: 'escolha', opcoes: [{ v: 'mensal', l: 'Mensal' }, { v: 'anual', l: 'Anual' }, { v: 'unica', l: 'Única' }] },
        { id: 'usuarios', rotulo: 'Quantos usuários' },
        { id: 'renovacao', rotulo: 'Renova em', tipo: 'data' },
        { id: 'fidelidade', rotulo: 'Tem fidelidade (prazo mínimo)?', tipo: 'escolha', opcoes: [{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }] },
      ] },
    ],
  },
  {
    id: 'delegacao', titulo: 'Delegação e organização', cliente: 'Faxa',
    intro: 'O que o Ricardo pode assumir para aliviar seu dia.',
    itens: [
      { id: 'DEL-02', levId: 'DEL-02', tipo: 'confirmar', titulo: 'SEO e revisão do site', resumo: 'O Ricardo cuida do SEO e da revisão do site da Faxa, por iniciativa dele.', ref: 'Mensagem do Ricardo, 30/10 às 08:57.' },
      { id: 'DEL-01', levId: 'DEL-01', tipo: 'lista', titulo: 'O que você quer passar para o Ricardo agora?', rotuloLinha: 'Tarefa', rotuloAdicionar: 'Adicionar tarefa', campos: [{ id: 'tarefa', rotulo: 'Tarefa' }, { id: 'prioridade', rotulo: 'Prioridade', tipo: 'escolha', opcoes: [{ v: 'alta', l: 'Alta' }, { v: 'media', l: 'Média' }, { v: 'baixa', l: 'Baixa' }] }, { id: 'acessos', rotulo: 'Acessos de que ele precisa' }] },
      { id: 'DEL-03', levId: 'DEL-03', tipo: 'longo', grupo: 'decisao', titulo: 'O que o Ricardo pode decidir sozinho e o que precisa da sua aprovação?' },
      { id: 'DEL-04', levId: 'DEL-04', tipo: 'texto', titulo: 'Quando você quer o Ricardo presencialmente?', dica: 'Ex.: nas calls com cliente, uma vez por semana…' },
      { id: 'DEL-06', levId: 'DEL-06', tipo: 'escolha', titulo: 'Você topa juntar os pedidos numa lista única por semana, em vez de mandar aos poucos?', ajuda: 'Isso evita subir correção toda hora.', opcoes: [{ v: 'sim', l: 'Topo' }, { v: 'nao', l: 'Prefiro mandar na hora' }] },
      { id: 'BD-01', levId: 'BD-01', tipo: 'confirmar', grupo: 'ricardo', titulo: 'Controle financeiro e painel', resumo: 'O Ricardo propôs montar um controle financeiro com painel. Hoje só foi criada a base vazia; ainda não há nada em uso.', ref: 'Conversa de 30/10, 10:56 a 11:07.' },
      { id: 'BD-03', levId: 'BD-03', tipo: 'longo', titulo: 'Sua esposa disse se esse controle e painel ajudariam? O que ela pediu?' },
      { id: 'PAR-01', levId: 'PAR-01', tipo: 'escolha', titulo: 'No projeto paralelo, arquivos com senhas e chaves ficam fora do GitHub?', opcoes: [{ v: 'sim', l: 'Sim, ficam fora' }, { v: 'nao', l: 'Não, estão no GitHub' }, { v: 'nao_sei', l: 'Não sei verificar' }] },
    ],
  },
];
