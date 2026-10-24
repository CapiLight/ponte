# 1 ENTENDA O PROJETO EM DOIS MINUTOS
A Ponte ajuda estudantes da UFAC a organizar uma dificuldade documental e preparar os próximos passos de um pedido de assistência estudantil. A pessoa conta sua situação ou responde perguntas, confere o que o sistema entendeu e recebe orientações parciais relacionadas a um edital, com a fonte ao lado.
Promessa: “Conte sua situação. Confira o que entendemos. Veja o próximo passo e de onde ele veio.”
O primeiro caso é a preparação relacionada à saída da residência por alagação, incêndio ou outro evento adverso e à perda de documentos pessoais, usando um recorte do Edital Proaes nº 01/2026 da UFAC. A análise e a concessão do auxílio continuam sendo responsabilidade da Proaes.
O diferencial é uma relação que o usuário pode revisar: relato → fatos confirmados → regras do edital → próximos passos. Ao corrigir um fato, a Ponte retira ou modifica as orientações que dependiam dele e atualiza o resumo.
A entrega do hackathon será um fluxo pequeno e demonstrável, com Gemma 4 participando de verdade da interpretação do relato. Não construiremos um sistema completo de assistência estudantil.

# 2 PROBLEMA, PÚBLICO E RESULTADO ESPERADO
Público inicial: estudantes da UFAC preparando um contato ou uma solicitação relacionada ao auxílio emergencial, especialmente quando sua situação documental exige consultar condições específicas do edital.
O edital contém exigências e caminhos documentais condicionais. Nossa hipótese é que algumas pessoas consigam contar o que aconteceu, mas tenham dificuldade para transformar o relato em perguntas, documentos pertinentes e próximos passos. A existência dessas regras está documentada; a frequência da dificuldade e o benefício da Ponte ainda precisam ser observados.
Ao terminar o fluxo, a pessoa deve conseguir explicar sua situação, identificar os passos abordados pelo recorte e reconhecer as questões que ainda precisam de atendimento. A saída é um plano parcial e um resumo copiável, preservando fontes, incertezas e limites.
Não prometer redução de indeferimentos, economia de tempo, adoção institucional ou superioridade sobre um formulário sem medir. A Ponte é um protótipo independente; não apresentar identidade visual ou linguagem que sugira serviço oficial da UFAC.

# 3 JORNADA DO USUÁRIO
Escolher como começar: “Quero contar minha situação” ou “Prefiro responder perguntas”.
Informar a situação. No relato livre, Gemma sugere fatos e mostra a frase de origem. Nas perguntas, a pessoa preenche diretamente os mesmos fatos.
Confirmar, corrigir ou responder “não sei”. A confirmação trata de fatos cotidianos: o que ocorreu, com quem e quando. O estudante não precisa conhecer cláusulas ou validar enquadramentos administrativos.
Consultar os próximos passos do recorte, as fontes que os sustentam e as dúvidas pendentes. Informação geral do edital continua disponível mesmo quando faltam fatos para personalizar.
Editar uma informação. A Ponte recalcula as orientações dependentes e explica a mudança sem precisar chamar o modelo novamente.
Copiar o resumo para uso posterior. A aplicação não envia mensagens, não faz inscrição e não acessa o sistema da Proaes.
3.1 Exemplo fictício de demonstração
Uma pessoa relata que precisou sair de casa após uma alagação e perdeu documentos pessoais. Gemma organiza as afirmações em campos revisáveis. A Ponte pergunta o que ainda não foi informado, como a data do evento, em vez de inventar.
Após confirmação dos fatos mínimos, a tela relaciona a situação ao texto consultado e apresenta próximos passos parciais. O usuário então corrige: “Não precisei sair da própria residência”. A orientação que dependia da saída é retirada, e o resumo acompanha a mudança.
O momento principal da demo é: “Você corrigiu este fato. Esta orientação mudou porque dependia dele.” Não ter correspondência com o ramo demonstrado significa apenas que esse ramo não foi identificado; não significa ausência de direito ou de outra alternativa.

# 4 PAPEL DO GEMMA E PAPEL DAS REGRAS
4.1 Gemma 4: interpretar a entrada
Transformar linguagem cotidiana em fatos sugeridos, com trechos literais do relato que sustentam cada sugestão.
Preservar negação, incerteza, sujeito e referência temporal. “Minha vizinha saiu de casa” não equivale a “eu saí de casa”.
Deixar não informado o que o relato não permite concluir. Não inventar datas, causas, documentos ou circunstâncias.
4.2 Usuário: confirmar fatos
Cada fato começa como sugestão ou informação não verificada. A pessoa confirma, corrige ou mantém como desconhecido. Confirmar uma afirmação pessoal não comprova o evento; apenas registra o que a pessoa informou.
4.3 Regras revisadas: relacionar fatos a orientações
As condições administrativas e os próximos passos vêm de regras curadas contra o edital. O modelo não decide elegibilidade, dispensa documental, autenticidade de comprovante ou aprovação do pedido.
Um trecho existir literalmente no relato ou no edital é uma verificação necessária, mas não suficiente: ele pode ter sido interpretado com sujeito, sentido ou condição errados. Por isso, haverá confirmação factual e casos contrastivos de aceitação.
4.4 Por que também oferecer perguntas diretas
Relato e perguntas usam a mesma tela de fatos, as mesmas regras e o mesmo resultado. Isso evita construir dois produtos. Gemma é uma opção de acesso para quem prefere contar a situação; quem já sabe responder pode usar o formulário.
O formulário é uma referência justa para avaliar esforço e compreensão. Um chat genérico também pode reproduzir parte do fluxo; nossa proposta é entregar a experiência pronta de revisão, fonte e atualização das consequências, sem alegar exclusividade ou inteligência superior.

# 5 ESCOPO FUNCIONAL DO MVP
5.1 O que precisa estar funcionando
Entrada por relato com uma chamada real ao Gemma 4 e alternativa de preenchimento direto dos fatos.
Fatos sugeridos com origem visível, confirmação, correção e estado “não sei”.
Um edital identificado por número, processo, fonte e versão consultada, com regras do recorte separadas da interface.
Próximos passos parciais, fonte por orientação e pergunta específica quando a relação entre regras não estiver esclarecida.
Edição que atualiza orientações, dúvidas e resumo, retirando resultados dependentes de fatos alterados.
Resumo copiável que conserva incertezas e cobertura; uso no celular, por teclado e sem depender apenas de cores.
5.2 Fora do MVP
Leitura de qualquer edital, cobertura de todos os auxílios ou adaptação automática por simples troca de PDF.
Upload de documentos, análise de fotos, OCR, áudio, mapas ou busca na internet.
Login, banco de dados, cadastro, integração institucional, envio de mensagens ou inscrição automática.
Treinamento de modelo, execução local/offline e infraestrutura para múltiplas instituições.
Decisão sobre direito ao auxílio, documento autêntico, exigência dispensada ou inscrição completa.

# 6 RECORTE DO EDITAL E CONDIÇÕES DAS ORIENTAÇÕES
Fonte principal: Edital Proaes nº 01/2026, processo 23107.000688/2026-82. Conferir página oficial, retificações e situação do edital antes de construir o demonstrador. O guia geral da Proaes é contexto; não importar suas regras automaticamente para uma seleção específica.
O recorte aborda a relação entre os itens 2.2(b), 2.2.2 e 6.9. O item 6.8 será uma referência conexa para perda, roubo ou extravio; a alternativa do item 6.10 ficará identificada como não avaliada quando pertinente. Não implementar o edital inteiro.
O texto do item 6.9 menciona documentos disponíveis, Anexo VI, comprovantes da situação emergencial e Anexo VII. Não tratar essa enumeração como lista suficiente para toda a inscrição. A relação com outros requisitos, como os de moradia, não deve ser resolvida por uma dispensa ou uma exigência adicional inventada.
6.1 Condições mínimas do demonstrador
Situação de saída: perguntar se a pessoa precisou sair da própria residência. Alagação na cidade, por si, não confirma esse fato.
Janela temporal: usar data do evento e data de referência confirmadas. O recorte considera a condição de 90 dias do item 2.2.2; data ausente permanece desconhecida. Expressões como “semana passada” precisam de confirmação antes de cálculo exato.
Próximos passos de 6.9: personalizar somente com os fatos mínimos confirmados e a condição temporal confirmada como atendida. Se faltar informação, mostrar o texto geral e a pergunta pendente, sem concluir que a pessoa está apta ou sem alternativa.
Dificuldade com moradia ou contrato: quando a interação entre 6.9 e 8.4 não estiver esclarecida, oferecer uma pergunta objetiva para a Proaes, com as duas fontes. Não impor toda a lista geral nem declarar sua dispensa automaticamente.
Outras situações: referência a 6.8 e sinalização de 6.10 ajudam a evitar que um caso fora do ramo principal vire uma negativa universal. A indicação de fonte não equivale a avaliação completa dessas alternativas.
Não acrescentar nexo causal entre o evento e a perda de documentos como requisito se o texto consultado não o esclarecer. Dúvidas normativas devem aparecer como dúvidas; a pessoa confirma acontecimentos, não interpretações administrativas.
Aviso junto ao plano e no resumo: “Este plano consulta apenas orientações sobre saída da residência por alagação, incêndio ou outro evento adverso e perda de documentos pessoais. Outros requisitos do edital não foram avaliados. A análise do pedido é da Proaes.”

# 7 ESTADOS, CORREÇÕES E FALHAS
Sugerido: fato proposto pelo modelo, ainda sem confirmação.
Confirmado: fato informado ou confirmado pela pessoa; não é comprovação externa.
Desconhecido ou conflitante: exige esclarecimento; nunca converter silenciosamente em “não”.
Informação geral: texto consultável do edital, independente de personalização.
Orientação personalizada: depende de fatos mínimos confirmados e de uma regra revisada.
Dúvida de atendimento ou fora do recorte: limite explícito, sem inferir ausência de caminho.
Responder “não sei” permite continuar. Bloquear apenas a orientação dependente, mostrar a informação já consultável e fazer uma pergunta concreta para esclarecer o dado ausente.
Uma nova versão do relato invalida as confirmações e orientações derivadas da versão anterior. Edição manual prevalece; solicitar nova análise exige nova confirmação. Uma resposta atrasada não pode restaurar fatos ou instruções depois de mudança no relato ou edição manual.
Falha, demora ou resposta inválida da API oferece preenchimento direto dos fatos, sem afirmar que houve extração. Planejar uma extração por versão do relato, sem conversa iterativa ou tentativas automáticas sofisticadas.
Se um ramo continuar gerando erro crítico, retirar sua personalização e apresentar apenas informação consultável e pendência explícita. Se a falha atingir o núcleo, demonstrar o protótipo como incompleto e descrever a falha.

# 8 ORGANIZAÇÃO TÉCNICA E TRABALHO DOS AGENTES
Arquitetura planejada: uma aplicação simples, um endpoint de inferência com a chave protegida, estado de sessão sem cadastro, regras e fontes separadas da interface. A escolha de linguagem e framework fica para o início autorizado; priorizar ferramentas que a equipe domina.
Separação de responsabilidades: interface coleta e apresenta; inferência sugere fatos; estado conserva confirmação e versão; regras relacionam fatos a orientações; resumo reflete apenas o estado atual. Uma alteração deve atingir todas as saídas dependentes.
8.1 Orientações para agentes que receberem este documento
Tratar este documento como especificação de concepção. Conferir o repositório e o estado atual antes de afirmar que uma funcionalidade existe.
Respeitar o início autorizado do desenvolvimento. Antes do sábado, trabalhar em ideias e documentação; não produzir código de produto, prompts executáveis ou fixtures de execução.
Preservar fonte, confirmação, desconhecimento, atualização de dependências e limites. Não ampliar escopo para tornar o projeto mais vistoso.
Separar conteúdo do usuário de instruções do sistema. Um relato que manda ignorar regras deve ser tratado como dado, não como autorização para alterar o fluxo.
Não criar regras administrativas por inferência. Divergência ou ambiguidade precisa de fonte e de registro explícito da questão.
Não declarar testes, adoção, desempenho, economia de tempo ou uso ao vivo sem evidência. Dados da demo e dos testes devem ser fictícios e rotulados.
Ao concluir uma tarefa, registrar o que mudou, como foi verificado, o que falhou e o que permanece pendente. Alterações de escopo devem aparecer neste documento.
8.2 Divisão de trabalho sugerida
Interface e experiência: entrada, fatos, fontes, edição, resumo e acessibilidade.
Inferência e estado: Gemma, extração, validação de resposta e descarte de resultados desatualizados.
Conteúdo e verificação: edital, condições, casos esperados e revisão das orientações.
Integração e entrega: fluxo completo, README, licença, submissão e ensaio. Uma pessoa pode acumular funções; o plano deve continuar viável com equipe pequena.

# 9 CRITÉRIOS DE ACEITAÇÃO E VALIDAÇÃO
Os cenários abaixo são um plano de aceitação. Os exemplos executáveis, resultados esperados e medições serão produzidos no período autorizado. Nenhum teste foi executado nesta etapa.
Caso claro: saída da residência, evento recente e perda documental informados. Mostrar os próximos passos do recorte sem declarar elegibilidade.
Alagação na cidade sem saída da própria residência. Não inferir saída nem personalizar o ramo por esse fato.
Data ou saída desconhecida. Perguntar apenas o necessário e manter informação geral acessível.
Negação, outro sujeito ou datas contraditórias. Não transformar dúvida ou fala sobre terceiro em afirmação positiva sobre o estudante.
Correção de fato após confirmação. Retirar todas as orientações dependentes e atualizar o resumo copiado.
Roubo sem saída da residência. Indicar a referência conexa pertinente, sem afirmar ausência de alternativas.
Extração sem trecho válido ou com sentido errado. Manter não verificado e permitir correção; sem considerar palavras parecidas como prova de sentido.
Novo relato com requisição anterior pendente. Invalidar confirmações antigas e descartar a resposta atrasada.
Datas na fronteira dos 90 dias e fora dela. Conferir o cálculo com referência explícita, sem converter condição temporal em conclusão sobre o auxílio.
Saída da residência sem perda de documentos pessoais. Não inventar perda nem personalizar 6.9 por suposição.
Indisponibilidade ou resposta inválida do modelo. Oferecer entrada manual e identificar qualquer demonstração gravada como tal.
Critério de integridade: nenhum erro crítico nos cenários executados. Erros críticos incluem fato inventado, personalização dependente de dado desconhecido, fonte ou regra errada, orientação antiga ainda ativa e sugestão indevida de dispensa, elegibilidade ou completude. Publicar a quantidade real de casos, repetições e falhas; poucos casos sem falha não demonstram confiabilidade geral.
9.1 Comparação justa e observação de uso
Separar duas avaliações: o plano corresponde ao resultado esperado revisado contra a fonte? A pessoa consegue usar a entrada e compreender o próximo passo? Relato e perguntas recebem os mesmos fatos, regras e fontes.
Se houver três voluntários no evento, propor casos fictícios, participação voluntária e ordem alternada das entradas. Registrar correções, pedidos de ajuda e compreensão. Essa observação é exploratória; não comprova superioridade, adoção ou impacto. Sem voluntários, declarar que houve apenas avaliação sintética.

# 10 PLANO DE EXECUÇÃO E MARCOS
Hackathon: sábado, 24/10/2026, UFAC, Rio Branco. Horários locais de Rio Branco. Pelo aviso mais recente: desenvolvimento às 9h, entrega até 13h45 e demos às 14h. Confirmar regras e rubrica na abertura. O aviso recente permite 1 a 4 integrantes; a página inicial informava 2 a 4.
A equipe deve chegar para o check-in das 8h. Levar notebook, carregador, extensão, contas GitHub e DEV e chave de API, se usada. O aviso recente menciona sala em frente ao teatro e localização exata a confirmar.
Quadro 1 – Cronograma de execução
Horário
 | Foco
 | Entrega esperada

09:00–09:25
 | Regras e acesso
 | Conferir rubrica, edital e chamada real ao Gemma.

09:25–10:20
 | Fluxo comum
 | Fatos, regras, fontes e plano parcial.

10:20–11:00
 | Integração
 | Relato, confirmação, edição e resumo atualizados.

11:00–11:40
 | Integridade
 | Executar casos contrastivos e corrigir falhas críticas.

11:40–12:10
 | Uso e clareza
 | Celular, teclado, “não sei” e cópia do resumo.

12:10–12:35
 | Observação
 | Tarefa com voluntários, se possível; declarar limites.

12:35–13:00
 | Entrega aberta
 | README, licença, resultados e ensaio.

13:00–13:15
 | Submissão
 | Enviar e conferir todas as categorias elegíveis.

13:15–13:45
 | Margem
 | Corrigir problemas e verificar a entrega.

Marco das 11h: relato → chamada real ao Gemma → fatos confirmados → plano com fontes → edição que atualiza orientações e resumo. Uma chamada isolada ou um motor estático não satisfazem o marco.
Cortes de prioridade: retirar primeiro comparação visual lado a lado, acabamento supérfluo, exportação elaborada e referências além das mínimas. Preservar fonte, estados, confirmação, edição, limites, referência conexa 6.8 e sinalização de 6.10.
Se o núcleo falhar, diagnosticar e reduzir a extração ao mínimo útil sem esconder incertezas. Fluxo manual ou gravação obtida durante o evento são contingências explícitas, não evidência de Gemma funcionando ao vivo nem garantia de elegibilidade à categoria.

# 11 DEMONSTRAÇÃO E ESTRATÉGIA COMPETITIVA
00:00–00:25 — apresentar a dificuldade e a promessa restrita da Ponte.
00:25–01:10 — usar relato fictício, chamada real ao Gemma e confirmação de fatos com frases de origem.
01:10–01:45 — abrir uma fonte, corrigir um fato e mostrar a orientação e o resumo mudando.
01:45–02:15 — mostrar uma ambiguidade ou variação dentro do escopo e a pergunta em vez de um palpite.
02:15–02:40 — explicar o papel do modelo, as regras revisadas, a contribuição aberta e a verificação realmente feita.
02:40–03:00 — reconhecer limites e apresentar o próximo passo de validação.
Best Use of Gemma 4: demonstrar o modelo dentro do produto. Best Open-Source AI Project: tornar a participação da IA aberta central e a entrega reproduzível. Confirmar os requisitos específicos na abertura e selecionar todas as categorias elegíveis ao submeter.
O guia dos Hack Days da MLH sugere implementação, criatividade, aprendizado e ambição, clareza da demo e elegibilidade. A rubrica local pode diferir; não assumir pesos. O projeto deve mostrar escolhas técnicas e aprendizado realmente ocorridos, além da relevância do problema.
Não prometer originalidade mundial ou pódio. A hipótese competitiva é uma entrega local, pequena e verificável, com um momento de revisão que a banca consegue acompanhar.

# 12 ENTREGA ABERTA, PRIVACIDADE E SUBMISSÃO
Repositório público com MIT ou Apache 2.0 para o código produzido pela equipe. Documentar separadamente modelo, termos, dependências e fontes.
README com instalação, configuração sem segredos, modelo e modo de execução, fluxo coberto, limites, casos reproduzíveis, resultados medidos e declaração de uso de IA na construção.
Casos sintéticos e resultados esperados que outra pessoa consiga executar. Explicar onde ficam as regras; adaptar outro edital exige revisão, não apenas trocar o arquivo.
Chave protegida no servidor; evitar dados pessoais e documentos reais na demo. Não anunciar inferência local ou privacidade absoluta quando há envio à API.
Uma pessoa submete pela conta da inscrição: Challenges → Add Submission, preenchendo os campos exigidos e selecionando as duas categorias quando elegíveis.
Meta interna: submeter entre 13h e 13h15 e conferir o registro. Prazo informado pela organização: 13h45, sem reabertura.

# 13 DECISÕES CONSOLIDADAS E QUESTÕES ABERTAS
Decisões: duas entradas equivalentes; um edital; confirmação factual; orientações por regras curadas; correção com atualização de dependências; plano parcial; fotografia fora do MVP; fontes e limites preservados; desenvolvimento de produto apenas no período autorizado.
As críticas à utilidade da IA, diferenciação, erro de interpretação, falsa completude, prazo, acessibilidade e contribuição aberta receberam melhorias e critérios de verificação. A revisão por agentes aprovou a coerência do desenho, não a implementação ou a interpretação administrativa.
Pendências para o evento: confirmar composição e habilidades da equipe, rubrica local, versão do edital, disponibilidade de modelo e chave, latência, execução dos cenários, clareza da interface, reprodução do projeto e submissão. Registrar fatos observados à medida que o trabalho avançar.
Hipóteses posteriores: benefício comparado do relato livre, preferência dos estudantes, adoção e redução de retrabalho. Continuam abertas mesmo que os casos sintéticos passem.

# REFERÊNCIAS E MATERIAIS DE CONSULTA
Página do evento e recursos
Categorias e submissão
Edital Proaes nº 01/2026 — página oficial
Edital Proaes nº 01/2026 — PDF
Guia geral de documentos da Proaes
Gemma pela Gemini API — documentação oficial
Introdução aos modelos Gemma
Central Gemma da MLH
Gemma Cookbook
Guia MLH Hack Days — submissão e julgamento
Artigos indicados pela organização
Agent Skills Explained
Integração de LLMs de pesos abertos por API
Gemma 4 local com Ollama
Hermes Agent — guia prático
Estes artigos são referências complementares. Para capacidades, nomes de modelos e integração, conferir a documentação oficial vigente. Ler um recurso não obriga a incorporar sua ferramenta ao projeto.
Referência de projeto premiado
Paper Trail — relato técnico do autor
Hacktoberfest Touch Grass — anúncio oficial dos vencedores
Paper Trail é uma referência de entrega e avaliação em outro desafio, não prova de como a banca do LASI julgará a Ponte. Não foi encontrado histórico verificável de decisões anteriores dos organizadores atuais que autorize inferir preferências de julgamento.
