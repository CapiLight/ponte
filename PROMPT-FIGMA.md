# Prompt para prototipar a Ponte

Copie o conteúdo entre “Início do prompt” e “Fim do prompt” para a ferramenta de prototipagem do Figma. As referências após o prompt servem à equipe.

## Início do prompt

Crie um protótipo navegável da Ponte, uma aplicação web que ajuda estudantes a organizar a preparação documental de solicitações de assistência estudantil. Priorize os campos, o conteúdo, os estados e as consequências de cada ação. Defina o acabamento visual a partir da direção abaixo.

Entregue telas de aplicação com dados fictícios coerentes, componentes reutilizáveis e transições funcionais. O destino provável é uma implementação em Python com Streamlit. Se sua ferramenta gerar React para apresentar o protótipo, trate esse código apenas como demonstrador: a estrutura precisa continuar simples de reproduzir em Streamlit.

### 1. O que o produto faz

A pessoa conta uma situação ou responde perguntas. Gemma 4 transforma o relato em sugestões de fatos, acompanhadas das frases de origem. A pessoa confere e corrige essas sugestões. Regras revisadas de um edital relacionam os fatos declarados a próximos passos parciais e fontes.

O momento principal da experiência acontece quando a pessoa corrige um fato e entende qual orientação mudou por causa disso. O resumo deve acompanhar a correção. Priorize esse comportamento no protótipo.

A Ponte prepara a pessoa para consultar uma fonte ou um atendimento. A instituição analisa e decide o pedido. Confirmar uma declaração não comprova um acontecimento nem aprova documentos. Use a expressão “preparação documental” ou “conferência preliminar” quando pertinente.

Público inicial: estudantes da UFAC com dúvidas documentais relacionadas ao auxílio emergencial. Devem conseguir usar o serviço sem conhecer números de cláusulas ou termos administrativos.

### 2. Direção visual

Institucional, sóbria e bem acabada, com personalidade de ferramenta de orientação documental. Dê atenção à tipografia, ao alinhamento, à leitura dos formulários e à distinção entre informação declarada, fonte e orientação. A interface deve parecer organizada e confiável, sem sugerir chancela oficial.

Pode explorar azul profundo ou verde escuro como cor de ação, com superfícies claras e neutras. Escolha a paleta e a família tipográfica que funcionarem melhor. Prefira uma família legível, títulos contidos e contraste claro entre ações primárias e secundárias. Reserve cores semânticas para estados que realmente precisem delas.

Organize o conteúdo em seções e listas de revisão. Use painéis delimitados quando ajudarem a perceber uma unidade, como um fato ou uma orientação; evite colocar todo parágrafo dentro de um cartão igual. Fontes e motivos devem ser fáceis de abrir, sem competir com a ação principal.

Evite emojis, mascotes, gradientes decorativos, glassmorphism, estatísticas inventadas, gráficos sem função e telas de marketing. Não reproduza brasão, marca ou cabeçalho oficial da UFAC ou do governo. A referência institucional é de clareza e organização.

### 3. Prioridades e limites

Separe os frames em “MVP” e “Expansão futura”. Conclua primeiro o fluxo MVP e seus estados. O usuário deve conseguir demonstrá-lo em três minutos.

MVP: um edital identificado, duas formas de entrada, revisão dos fatos, plano parcial com fontes, correção e resumo. Sem login, perfil pessoal, CPF, matrícula, endereço completo, banco de dados, upload, OCR, chat contínuo, pagamento ou inscrição automática.

Expansão futura: descobrir editais em fontes oficiais e escolher entre seleções revisadas. Essa área deve ficar em frames separados, sem botões inativos ocupando o fluxo principal. Não construir painel administrativo completo ou um portal de oportunidades como tela inicial do MVP.

### 4. Estrutura geral e navegação

Proponha quatro etapas lógicas:

1. Contexto do edital.
2. Minha situação.
3. Conferir informações.
4. Próximos passos e resumo.

Essas etapas podem ser estados de uma mesma aplicação; não exigem quatro URLs ou páginas técnicas. O indicador representa a posição na tarefa, nunca percentual de aprovação do pedido.

Cabeçalho compacto: nome Ponte e descrição “Preparação documental com fontes”. Mostrar “Protótipo independente” em posição discreta e legível.

Manter o edital selecionado acessível durante o fluxo. Em desktop, um bloco lateral secundário pode reunir contexto, cobertura e fontes; o formulário principal ocupa a maior parte da largura. Em telas pequenas, empilhar as seções e levar o contexto para uma área expansível próxima ao título. Toda ação essencial precisa funcionar fora da barra lateral.

Incluir “Voltar” e preservação dos dados ao navegar. “Começar outro caso” exige confirmação antes de limpar o caso atual. Não oferecer histórico salvo ou prometer recuperação após fechar a sessão.

### 5. Tela de contexto do edital

Título: “Prepare seus próximos passos”. Explicação breve: “Conte sua situação, confira as informações e consulte orientações com a fonte ao lado.”

Mostrar o contexto inicial sem exigir seleção quando há apenas um edital:

- Instituição: Universidade Federal do Acre.
- Órgão: Proaes.
- Edital: 01/2026, Auxílio Emergencial.
- Processo: 23107.000688/2026-82.
- Cobertura: orientações parciais relacionadas à saída da residência por evento adverso e perda de documentos pessoais.
- Fonte consultada em 24/10/2026, como dado do cenário de protótipo, sem afirmar monitoramento automático.
- Situação das inscrições: “Consulte a página oficial”. Não inferir que estejam abertas.

Links: “Abrir página do edital”, “Consultar o edital” e “Consultar anexos”. Exibir abaixo a informação: “Outros requisitos não foram avaliados. A análise do pedido é da Proaes.”

Escolha obrigatória de entrada, em opções de rádio ou dois blocos selecionáveis equivalentes:

- “Quero contar minha situação”: campo de relato com apoio de IA.
- “Prefiro responder perguntas”: preenchimento direto dos mesmos fatos.

Botão “Continuar”. Link secundário “Entender o que este protótipo avalia”, com explicação expansível do recorte. Não exigir aceite genérico de termos para iniciar.

### 6. Tela Minha situação: relato

Campo principal multilinha, com rótulo “O que aconteceu?”. Texto de apoio: “Conte o que ocorreu com você, se precisou sair da própria residência e quando aconteceu. Não inclua CPF, matrícula, endereço completo ou documentos pessoais.”

Placeholder com exemplo breve, sem preencher a resposta automaticamente. Botão secundário “Usar exemplo fictício”; ao acioná-lo, mostrar indicação persistente “Exemplo fictício”.

Exemplo completo para o protótipo: “No dia 10 de outubro de 2026, minha casa foi alagada. Precisei sair da minha residência e perdi meus documentos pessoais.” Data de referência do cenário: 24/10/2026.

Botão principal “Analisar relato”. Não acionar análise enquanto a pessoa digita. Entrada vazia mostra mensagem junto ao campo: “Conte o que aconteceu ou escolha responder perguntas.”

Durante a análise, manter o texto visível e mostrar “Organizando as informações do relato”. Impedir envio duplicado. Não simular pesquisa na internet, porcentagem de precisão ou aprovação. No protótipo, a interação é simulada; não afirmar chamada real ao modelo.

Resultado da análise leva à revisão, ainda sem marcar as sugestões como confirmadas.

Prever falha ou demora: “Não foi possível organizar o relato agora. Você pode responder às perguntas.” Oferecer “Responder perguntas” e “Tentar novamente” por ação explícita, preservando o relato. Não exibir credenciais, stack traces ou mensagens técnicas.

### 7. Tela Minha situação: perguntas diretas

Usar a mesma organização de campos da revisão, sem frases atribuídas ao modelo. Cada resposta deve começar sem seleção. “Não sei” é uma escolha válida e diferente de ainda não responder.

Campos do caso:

| Campo | Controle e opções | Comportamento |
| --- | --- | --- |
| “A situação relatada aconteceu com você?” | Escolha única: Sim; Não, aconteceu com outra pessoa; Não sei | Não atribuir fatos de terceiros ao estudante. |
| “Qual acontecimento você quer analisar?” | Seleção: Alagação; Incêndio; Outro evento; Não sei | Um acontecimento selecionado por caso. “Outro” abre descrição curta; não atribuir enquadramento administrativo automaticamente. |
| “Você precisou sair da sua própria residência por causa desse acontecimento?” | Sim; Não; Não sei | Distinguir alagação na cidade de saída da própria residência. |
| “Você sabe a data desse acontecimento?” | Sim; Não sei | Se Sim, abrir campo de data inicialmente vazio. Não assumir a data de hoje. |
| “Data do acontecimento” | Data em DD/MM/AAAA | Data futura em relação à referência pede correção; manter opção de desconhecimento. |
| “Data de referência para esta consulta” | Data em DD/MM/AAAA | No exemplo, 24/10/2026, visível e editável. Pedir conferência explícita se foi preenchida automaticamente. Não presumir data oficial de protocolo. |
| “Você perdeu documentos pessoais?” | Sim; Não; Não sei | Não supor que a perda foi causada pelo evento nem exigir esse nexo sem regra revisada. |
| “Você tem dificuldade para apresentar comprovante de moradia ou contrato?” | Sim; Não; Não sei; Não quero informar | Campo opcional para preparar pergunta ao atendimento. |

Não coletar renda, composição familiar, dados bancários ou número de documento neste recorte. Se faltar informação, permitir continuar com as dúvidas e o conteúdo geral disponíveis.

Botão “Revisar informações”. Respostas fornecidas diretamente são declarações do usuário; não pedir a confirmação repetida de cada campo na etapa seguinte.

### 8. Tela Conferir informações

Título: “Confira o que será usado na orientação”. Organizar por “Acontecimento”, “Saída da residência”, “Datas” e “Documentos”. Apresentar rótulo, valor, origem e estado de cada fato.

Para sugestões do relato, mostrar a frase literal de origem ao lado ou logo abaixo do campo. Por exemplo, a saída sugerida se vincula a “Precisei sair da minha residência”. Não inventar trecho que não esteja no relato.

Estados legíveis: “A conferir”, “Confirmado por você”, “Informado por você”, “Não sei” e “Precisa esclarecer”. Esses estados podem ser condensados visualmente quando necessário, preservando seu significado.

Interações por sugestão: “Confirmar”, “Corrigir” e “Não sei”. Correção abre o controle adequado em linha. “Aplicar correção” já registra a declaração atual, sem exigir outro aceite do mesmo valor. Não incluir “Confirmar tudo” como atalho que dispense a leitura.

Mostrar contagem de sugestões ainda não conferidas, se útil, com rótulo “Informações a conferir”. Isso não representa progresso de aprovação ou completude documental.

Se o relato citar um incêndio antigo e uma alagação recente, mostrar pergunta sobre qual acontecimento será analisado. Depois de escolher, revisar a data e a saída associadas. Não combinar fatos de eventos diferentes. Se não houver um evento definido, manter as orientações dependentes sem personalização.

Botão principal “Ver próximos passos”. Pode funcionar com fatos desconhecidos ou pendentes: os passos dependentes ficam limitados e a tela explica o que falta. Oferecer “Voltar ao relato” sem apagar respostas por simples navegação.

### 9. Tela Próximos passos

Título: “Próximos passos para preparar seu atendimento”. Contexto breve com o edital e os fatos usados. Ação secundária “Editar informações”.

Organizar o conteúdo em três grupos distinguíveis:

- Passos relacionados às informações confirmadas.
- Informações que você ainda pode esclarecer.
- Perguntas para a Proaes sobre o edital ou os anexos.

Cada orientação precisa de: título com verbo de ação; instrução concreta; motivo em linguagem simples; fatos dos quais depende; fonte com edital e item; pendência ou limite, se houver. “Ver fonte e motivo” abre conteúdo em linha, sem exigir modal.

Exemplos de conteúdo para o cenário positivo:

1. “Separe os documentos que você já possui”. Referência ao item 6.9. Deixar claro que isso organiza a preparação, sem garantir documentação suficiente para toda a inscrição.
2. “Consulte os Anexos VI e VII e os comprovantes mencionados no edital”. Links para o pacote oficial, com indicação das páginas 6 e 7. Oferecer consulta, sem preenchimento automático.
3. “Prepare uma pergunta para a Proaes”. Quando houver dificuldade com moradia: “Considerando a situação descrita no item 6.9, como devo apresentar a documentação de moradia mencionada no item 8.4?”.

Há uma pendência concreta nos anexos: o Anexo VI do pacote consultado menciona 2025/Edital 02/2025 no cabeçalho e 2026 na assinatura; o Anexo VII inclui declaração de benefício anterior que pode não corresponder ao caso. Mostrar uma pergunta sobre qual versão utilizar e como proceder nessa situação. Não declarar os anexos inválidos, adaptar anos ou orientar a marcar opção inexata.

As dúvidas podem ser priorizadas por pertinência ao caso. Não acumular todas como avisos alarmantes; as pendências efetivamente aplicáveis permanecem no resumo. A dúvida em um passo não elimina os demais passos independentes.

Se a data for desconhecida, explicar que a condição temporal do recorte ainda não foi conferida e oferecer “Informar data”. Manter o texto geral acessível. Se o caso não corresponder ao ramo principal, mostrar “Este recorte não cobre essa combinação de informações” e referências conexas quando pertinentes: 6.8 para perda, roubo ou extravio; 6.10 como alternativa não avaliada. Nunca converter isso em “Sem direito ao auxílio”.

Não incluir score, semáforo global de elegibilidade, “documentos aprovados” ou botão “Enviar solicitação”. Não inventar uma lista universal de documentos obrigatórios.

### 10. Correção com efeito visível

No cenário principal, permitir mudar “Precisei sair da própria residência: Sim” para “Não”. Aplicar por botão “Aplicar correção”.

Enquanto houver edição não aplicada, indicar “Alteração ainda não aplicada” e não oferecer o resumo antigo como atualizado. Após aplicar:

- Retirar a orientação personalizada que dependia da saída.
- Manter informações gerais e passos independentes.
- Atualizar o resumo.
- Mostrar mensagem junto ao resultado: “Os próximos passos foram atualizados porque você informou que não precisou sair da própria residência.”
- Se mostrar o que mudou, separar o registro histórico das instruções atuais; não deixar uma instrução retirada parecendo ativa.

Essa correção não exige nova chamada ao modelo. Novo relato exige nova revisão dos fatos derivados. Uma resposta atrasada da análise anterior não pode sobrescrever a edição atual. Essas regras devem aparecer nas anotações técnicas dos frames.

### 11. Resumo e fontes

Resumo ao final do plano ou em seção própria acessível sem perder contexto. Deve conter: edital e versão consultada; data de referência; fatos declarados; fatos desconhecidos; próximos passos atuais; perguntas pendentes; links; limite de cobertura e responsabilidade da Proaes.

Exibir texto selecionável e mecanismo de cópia. O botão “Copiar resumo” só informa sucesso após cópia real; a implementação nativa do Streamlit pode exigir componente adicional. Prever alternativa simples e funcional: área de texto selecionável com instrução “Selecione o texto e copie”. Não assumir API nativa de clipboard. PDF elaborado não faz parte do MVP.

Se houver alterações não aplicadas, primeiro pedir para aplicá-las ou descartá-las. Não deixar cópia de estado antigo parecer atual. Um texto já copiado externamente não pode ser atualizado pela aplicação; apenas a versão atual exibida acompanha as correções.

Fontes como lista expansível com: órgão; número/ano; tipo do documento; data de consulta; item ou página; link. Não inventar transcrições literais do edital. Onde o trecho não for fornecido, usar referência ao item e link, sem aspas simulando citação oficial. A aplicação real receberá os trechos revisados pela equipe.

URLs do caso inicial:

- Página: https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26
- Edital: https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26/sei_1956124_edital_01.pdf
- Anexos: https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26/anexos-auxilio-emergencial-2026.pdf

### 12. Estados e validações a desenhar

Criar variantes que possam ser demonstradas sem depender de backend real:

- Entrada inicial vazia e erro de relato vazio.
- Análise em andamento, sem envio duplicado.
- Sugestões aguardando revisão.
- Resposta não fornecida, “Não sei” e negativa explícita, com significados distintos.
- Data inválida ou posterior à data de referência.
- Relato sobre outra pessoa e relato com dois acontecimentos.
- API indisponível com transição para perguntas, preservando o texto.
- Plano personalizado parcial e plano com informação geral por falta de fatos.
- Pendência normativa junto à orientação afetada.
- Edição não aplicada e resultado após correção.
- Resumo atualizado e alternativa de cópia manual.
- Confirmação em linha antes de limpar o caso.

Erros de preenchimento: resumo breve no topo da seção e mensagem ao lado do campo afetado, preservando o que já foi escrito. “Não sei” não é erro. Evitar notificação temporária como único lugar de uma informação necessária.

### 13. Expansão futura, em fluxo separado

Projetar uma visão compacta de catálogo com campos “Instituição”, “Tipo de oportunidade” e “Palavras-chave”. Não exigir dados pessoais para buscar. Oferecer “Buscar fontes oficiais”, com estado de carregamento e falha.

Cada resultado mostra instituição, órgão, edital/ano, objeto, público ou papel, etapa quando conhecida, situação do prazo com origem, última conferência e status da revisão. Separar “Fonte encontrada, ainda não revisada” de “Seleção com regras revisadas”.

Fonte encontrada pode abrir a página oficial, mas não gerar orientação personalizada antes da revisão. Seleção revisada oferece “Preparar minha situação” e entra no mesmo fluxo principal. Alteração detectada oferece “Revisão necessária”, suspendendo apenas a orientação afetada.

Não misturar instituição, ano, chamada ou papel. No exemplo de bolsas, diferenciar estudante candidato e coordenador que submete proposta. Vigência de pagamento não significa inscrição aberta. Ausência de resultado significa somente que a busca não encontrou algo com os filtros usados.

Uploads, OCR, análise de assinatura e portal de curadoria são evolução posterior; não criar essas telas neste protótipo. A arquitetura futura pode ser anotada: descoberta → coleta → extração → revisão de versões/regras → catálogo → orientação. Os detalhes técnicos ficam nas anotações, não no formulário do estudante.

### 14. Compatibilidade com Streamlit

Projetar a partir de controles convencionais: área de texto, rádio, select, data, botão, link, aviso, lista de revisão, seção expansível e contêiner. Evitar drag-and-drop, painéis redimensionáveis, edição em hover, menus complexos, canvas ou navegação que dependa de animações.

Mapeamento para orientar a equipe, sem obrigar a implementação a uma versão específica:

| Elemento | Possível componente |
| --- | --- |
| Relato | st.text_area |
| Respostas de escolha única | st.radio ou st.selectbox |
| Datas sem valor presumido | st.date_input com valor inicial vazio, conforme versão adotada |
| Envio de grupo estável de campos | st.form e st.form_submit_button |
| Ação que revela campo condicional | Widget fora de st.form ou formulário em etapas |
| Grupo de fato, fonte ou orientação | st.container |
| Fonte e motivo em linha | st.expander |
| Informação, pendência ou falha | st.info, st.warning, st.error e texto contextual |
| Análise em andamento | st.status ou st.spinner |
| Links oficiais | st.link_button ou links textuais |
| Resumo selecionável | Área de texto, com cópia manual como alternativa |

Streamlit reexecuta o script em interações. A chamada ao modelo deve acontecer apenas após uma ação explícita, com controle da versão do relato e estado do caso independente dos widgets. Voltar entre etapas deve preservar o que foi informado. Não disparar inferência por abrir fonte, trocar etapa ou editar um fato.

Campos dentro de st.form só chegam ao backend no envio. Portanto, não desenhar uma resposta dentro do formulário que revele imediatamente outro campo sem envio. Para perguntas condicionais, considerar controles fora do formulário, etapas menores ou exibição do campo com instrução clara. O efeito visual esperado deve ter um equivalente simples e documentado.

Priorizar uma coluna no celular e no máximo duas no desktop. Fontes podem expandir em linha em vez de exigir drawer ou modal. Navegação multipágina é opcional; não confundir quantidade de frames com quantidade de módulos ou rotas necessárias.

### 15. Acessibilidade e texto

Português brasileiro, títulos em caixa normal e rótulos completos. Campos têm labels visíveis e ajuda curta, nunca apenas placeholder. Texto corrido alinhado à esquerda. Usar contraste adequado, foco perceptível, navegação por teclado e alvos de toque confortáveis. Estados precisam de texto além da cor.

Quando houver atualização, manter a pessoa na tarefa e indicar a mudança perto da orientação afetada. Não depender de hover para ler fonte ou usar ação essencial. Em telas estreitas, reduzir colunas e preservar o conteúdo, sem tabelas largas como principal formulário.

Não usar linguagem de julgamento sobre a pessoa. Prefira “Falta informar a data para conferir esta condição” a “Dados insuficientes para aprovação”. Os avisos devem orientar uma ação possível, sem repetir o mesmo texto em toda seção.

### 16. Entrega do protótipo e handoff

Entregar:

1. Fluxo MVP conectado, com as duas entradas convergindo na mesma revisão e no mesmo plano.
2. Desktop de referência em 1440 px e versão mobile em 390 px para entrada, revisão e plano, com comportamento previsto também em 360 px.
3. Componentes reutilizáveis para campo com origem, fato revisável, orientação com fonte, pendência, indicador de etapa e resumo.
4. Variantes suficientes para demonstrar carregamento, desconhecimento, falha da API e correção com retirada de orientação.
5. Fluxo futuro de catálogo separado e identificado como expansão.
6. Anotações por frame com origem dos dados, ação do usuário, mudança de estado e componente provável do Streamlit.

Nas anotações técnicas, distinguir: contexto do edital; texto e versão do relato; evento selecionado; fatos com origem, sujeito, estado e versão; regras e fontes revisadas; orientações e suas dependências; dúvidas; resumo derivado do estado atual. Isso é contrato de dados conceitual, sem criar banco de dados ou expor JSON na tela do estudante.

Não construir backend, credenciais, busca real ou integração institucional para simular sucesso. Apresente dados de exemplo como fictícios e interações de IA como simulações do protótipo.

Critério principal de qualidade: alguém deve conseguir percorrer o fluxo, corrigir um fato e explicar quais próximos passos mudaram, de onde vieram e o que ainda precisa esclarecer.

## Fim do prompt

## Referências de pesquisa para a equipe

Consultadas em 24/10/2026. Inspiram o comportamento; não implicam adoção da identidade visual dos serviços.

- [Streamlit: formulários e envio agrupado](https://docs.streamlit.io/develop/concepts/architecture/forms)
- [Streamlit: comportamento e estado dos widgets](https://docs.streamlit.io/develop/concepts/architecture/widget-behavior)
- [Streamlit: navegação](https://docs.streamlit.io/develop/api-reference/navigation/st.navigation)
- [Streamlit: contêineres](https://docs.streamlit.io/develop/api-reference/layout/st.container)
- [GOV.UK: revisão das respostas](https://design-system.service.gov.uk/patterns/check-answers/)
- [GOV.UK: resumo de erros e mensagens junto aos campos](https://design-system.service.gov.uk/components/error-summary/)

As restrições de Streamlit orientam o protótipo, mas os componentes e parâmetros precisam ser conferidos na versão adotada pela equipe. Esta etapa entrega especificação e prompt; não comprova implementação ou execução dos fluxos.
