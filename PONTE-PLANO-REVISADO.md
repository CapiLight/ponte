# Ponte — plano de projeto revisado
Atualização: 24/10/2026. Evento: Hacktoberfest Hack Day LASI/UFAC, 24/10/2026.
Estado verificado nesta revisão: concepção e plano de aceitação. A rodada de expansão incluiu inspeção manual de fontes públicas; não incluiu implementação, inferência com a chave da equipe nem testes da aplicação. Não afirmar funcionalidade ou resultado sem conferir a execução atual.

## 1. Decisão e promessa
Construir um preparador parcial de solicitações de assistência estudantil: a pessoa conta sua situação ou responde perguntas, confirma fatos cotidianos e recebe próximos passos fundamentados em um recorte de um edital, com dúvidas e limites visíveis.

Frase de apresentação: "A Ponte transforma o que você conta em próximos passos documentais que você pode conferir e corrigir, com a fonte ao lado."

Direção de expansão: atender gradualmente um catálogo de editais revisados, com busca de fontes oficiais e conferência preliminar dos requisitos avaliados. O MVP permanece delimitado abaixo; busca aberta, qualquer edital e aprovação automática não são promessas da entrega. A seção 13 define as condições para ampliar o projeto.

Público inicial: estudante da UFAC preparando um contato ou pedido relacionado ao auxílio emergencial. Primeiro caso: saída da residência por alagação/incêndio e perda de documentos pessoais. O problema documental consta do edital; dificuldade de compreensão, preferência por narrativa e redução de esforço são hipóteses ainda não validadas.

Aprovar este plano significa que as críticas receberam decisões e condições verificáveis. Não significa que a implementação está pronta, que usuários aprovaram ou que haverá premiação.

## 2. Pesquisa: evidência e limites
- Guia oficial MLH Hack Days consultado nesta pesquisa sugere implementação técnica, criatividade, aprendizado e ambição, clareza da demonstração e elegibilidade das categorias. A rubrica local deve ser confirmada na abertura; não presumir pesos.
  Fonte: https://github.com/MLH/mlh-hack-days-organizer-guide/blob/main/project-submissions.md
- A busca pública encontrou Breno Campelo como host atual e autor do BioScan AI. Em seu relato, ele descreve premiação Green AI & Edge, Gemma local e confirmação humana. Não encontrei registro verificável de decisões de julgamento anteriores dele que permita identificar projetos que ele aprovou como jurado ou os motivos. Um relato de premiação própria não revela preferência de julgamento.
  Fonte do autor: https://br.linkedin.com/in/brenocampelo
- A UFAC identifica Dayan Freitas Alves como integrante da 3DProsthesis, selecionada para a fase nacional do Desafio Liga Jovem. Isso é participação como competidor, não evidência de atuação como jurado.
  Fonte: https://www.ufac.br/site/noticias/2025/alunos-da-ufac-chegam-a-fase-nacional-do-3o-desafio-liga-jovem
- Paper Trail foi anunciado como vencedor geral do desafio online Hacktoberfest Touch Grass. O relato do autor descreve modelo aberto, verificações, comparação de versões e falhas remanescentes. A premiação está documentada; a página não publica justificativa individual da banca. Minha inferência de projeto: uma entrega pequena, reproduzível e franca sobre seus limites pode ser competitiva. Não é prova de como a banca LASI vai pontuar.
  Resultado oficial: https://dev.to/devteam/congrats-to-the-hacktoberfest-open-source-ai-challenge-touch-grass-winners-152c
  Relato do autor: https://dev.to/mikek/paper-trail-gemma-writes-your-walk-a-field-card-then-the-screen-goes-away-3mf4
- A Proaes já oferece guia de documentos. Portanto, explicar cópias cortadas e resumir documentação não são novidades suficientes.
  Fonte: https://www.ufac.br/site/ufac/proaes/guia-documentos.pdf/view
- Fonte do recorte: edital 01/2026, processo 23107.000688/2026-82. Antes de usar no sábado, conferir página oficial, retificações e situação das inscrições; esta pesquisa não certifica disponibilidade atual do auxílio.
  PDF: https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26/sei_1956124_edital_01.pdf
  Página: https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26
- Gemma 4 pode ser acessado pela Gemini API. Acesso da equipe, desempenho e custo não foram medidos.
  Fonte: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api

## 3. O produto mínimo
Uma interface com duas entradas equivalentes: "Quero contar minha situação" e "Prefiro responder perguntas". Não gerar dois produtos: perguntas diretas reutilizam a própria tela de edição dos fatos; ambas alimentam os mesmos fatos e regras.

Fluxo:
1. Escolher entrada. Exemplo disponível é fictício e rotulado.
2. Relato livre: Gemma sugere fatos e exibe a frase de origem. Perguntas diretas: usuário informa os mesmos fatos sem modelo. Nenhuma opção recebe tratamento de segunda classe.
3. Confirmar, corrigir ou responder "não sei". Perguntar o que ocorreu, com quem e quando; nunca pedir que a pessoa valide enquadramento administrativo.
4. Apresentar plano parcial: passos explícitos sustentados pelo recorte, questões pendentes e fonte de cada orientação.
5. Editar fato: recalcular localmente todas as orientações e o resumo; indicar de modo textual qual alteração motivou a retirada ou mudança. A interface continua mostrando resultados atuais, sem manter instruções revogadas como ativas.
6. Copiar resumo para uso posterior, incluindo incertezas, fonte e cobertura parcial. Não enviar mensagem ou inscrição.

Quando faltar um fato necessário, permitir continuar. Não bloquear tudo: mostrar o que já pode ser informado, qual orientação depende da resposta ausente e uma pergunta concreta para esclarecê-la. Um dado desconhecido não equivale a resposta negativa.

A extração deve preservar afirmação/negação, incerteza e sujeito. Não inventar data, causa ou identidade. Contradição exige confirmação específica. Resposta inválida, falha ou demora da API deixa os fatos afetados não verificados e oferece preenchimento manual; bloquear apenas orientações dependentes. Uma extração por versão do relato, sem conversa iterativa ou tentativas automáticas sofisticadas. Descartar respostas tardias se o relato mudou ou se houve edição manual dos fatos desde o início da requisição; elas não podem restaurar confirmações ou orientações antigas. Novo relato invalida confirmações e orientações derivadas da versão anterior; edição manual prevalece até o usuário solicitar nova análise, que volta a exigir confirmação.

## 4. Conteúdo e limites do recorte
Cobrir a relação de 2.2(b), 2.2.2 e 6.9 como preparação parcial. Incluir 6.8 como referência conexa para perdas/roubo/extravio. Identificar 6.10 como alternativa não avaliada quando pertinente; não implementar o edital inteiro.

Antes de programar no sábado, registrar para cada orientação: cláusula e versão; fatos necessários; resposta quando algum fato é desconhecido; ação explícita permitida; dúvida que o texto não resolve; fatos dos quais a orientação depende.

Estados distintos:
- Informação descrita no edital: pode ser consultada mesmo sem perfil confirmado.
- Orientação relacionada aos fatos confirmados: só apresentada como personalizada quando os fatos mínimos forem conhecidos.
- Informação insuficiente: pergunta factual concreta, sem conclusão negativa.
- Interação de regras não esclarecida: dúvida de atendimento, sem inventar dispensa ou exigência adicional.
- Fora do recorte: não avaliado; nunca "sem direito" ou "sem alternativa".

O item 6.9 enumera documentos disponíveis, Anexo VI, comprovantes da situação e Anexo VII. Não transformar essa enumeração em checklist suficiente de toda a inscrição. Não impor automaticamente todos os requisitos gerais como cumulativos, nem declarar sua dispensa. Não acrescentar nexo causal entre evento e perda como requisito se o texto consultado não o esclarecer.

A janela de 90 dias é tratada com base em data informada e data de referência explícita. Sem data, perguntar; nenhuma foto prova data/local por si. Mesmo um fato incompatível com o ramo demonstrado não autoriza concluir ausência de outra via.

Limite visível junto ao plano e preservado no resumo: "Este plano consulta apenas orientações sobre saída da residência por alagação, incêndio ou outro evento adverso e perda de documentos pessoais. Outros requisitos do edital não foram avaliados. A análise do pedido é da Proaes."


### Tabela de condições do demonstrador
Estas condições descrevem o comportamento planejado da interface, não certificam enquadramento administrativo. Toda informação geral continua consultável independentemente do perfil.

| Saída planejada | Fatos mínimos para personalizar | Se faltar ou houver conflito | Conteúdo que pode aparecer |
|---|---|---|---|
| Pergunta sobre a situação de saída da residência | O usuário relata evento ou perda documental, mas a saída ainda não foi confirmada | Perguntar se precisou sair da própria residência; não assumir que alagação na cidade o obrigou a sair | Pergunta cotidiana e fonte 2.2(b) |
| Observação sobre a janela temporal do recorte | Data do evento e data de referência explicitamente confirmadas | Perguntar a data ou deixar condição não verificada; expressões relativas como "semana passada" precisam de confirmação antes de cálculo exato | Condição de 2.2.2, sem resultado de elegibilidade |
| Próximos passos parciais relacionados a 6.9 | Saída forçada da própria residência pelo evento descrito, perda de documentos pessoais e condição temporal do recorte confirmada como atendida | Mostrar texto geral de 6.9 e o fato ainda não esclarecido, sem apresentar o caminho como orientação personalizada | Conferir documentos disponíveis, Anexos VI/VII e comprovantes mencionados, com limites; não declarar suficiência ou dispensa |
| Dúvida sobre comprovante de moradia ou contrato | Usuário informou dificuldade com esse documento e pediu orientação dentro do cenário | A relação entre 6.9 e 8.4 permanece dúvida, mesmo com fatos confirmados | Uma pergunta precisa à Proaes, citando as duas cláusulas; sem inventar cumulação ou substituição |
| Indicação conexa de 6.8 | Perda, roubo ou extravio informado pelo próprio usuário | Se o fato não é conhecido, manter referência como informação geral | Informar que existe outra cláusula a consultar; não emitir parecer sobre substituição documental |
| Sinalização de alternativa 6.10 não avaliada | Histórico de benefício é mencionado; não é necessário coletá-lo para todos | Não inferir ausência ou existência de benefício | Mostrar que o recorte não avalia essa alternativa; não definir direito |
| Mudança ou retirada de orientação anterior | Edição de fato confirmado do qual a saída dependia | Estado desconhecido é tratado como desconhecido; não reusar valor anterior | Atualizar plano, dúvida e resumo, com explicação textual e sem nova inferência |

A informação sobre fatos vem da pessoa, não é comprovada por sua confirmação. As ações continuam parciais. Campos de confirmação nunca pedem que o usuário escolha "sou elegível" ou "6.9 aplica-se a mim".

Complementos das rodadas de revisão: trabalhar com um acontecimento selecionado por caso; manter sujeito, origem, versão e vínculo temporal dos fatos, sem combinar saída causada por evento antigo com data de outro recente. Correção ou preenchimento manual registra diretamente a declaração atual, sem confirmação redundante; alterar evento exige rever os fatos associados. O modelo sugere apenas campos previstos e não modifica regras, fontes ou confirmações.

Anexos oficiais consultados: na página 6 do pacote, o Anexo VI menciona 2025/Edital 02/2025 no cabeçalho e 2026 na assinatura; na página 7, o Anexo VII inclui declaração de benefício anterior nos últimos três anos. Isso exige esclarecer qual versão usar e como proceder se a declaração não corresponder ao caso; não permite concluir invalidade. Mostrar consulta e pergunta à Proaes, sem preencher ou adaptar formulário. Preservar a pendência no resumo e manter os demais passos independentes disponíveis.
Fonte: https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26/anexos-auxilio-emergencial-2026.pdf

## 5. O que a IA acrescenta
Gemma converte linguagem cotidiana variada em fatos sugeridos, revisáveis e ligados à origem. Ações e condições administrativas vêm de regras revisadas, não de geração livre.

Não alegar que Gemma é intelectualmente superior a um chat ou formulário. O diferencial de produto é a experiência pronta e persistente de relato, confirmação, fonte e correção de dependências.

Se o formulário entregar a mesma orientação com menos esforço para um usuário, ele pode usá-lo. Essa possibilidade não é escondida. O prêmio Gemma exige evidência de participação real do modelo no produto apresentado; um fluxo manual isolado não sustenta essa alegação.

Trecho literal existente é necessário, mas não prova interpretação semântica correta. Conferência humana de negação, sujeito e sentido continua necessária. Falhas de correspondência ficam não verificadas; não usar autoconfiança numérica do modelo como garantia.

## 6. Critérios criticados e decisões de fechamento
Status "melhorado no desenho" não significa "validado no mundo real".

| ID | Crítica original | Decisão de melhoria ou corte | Evidência necessária no sábado |
|---|---|---|---|
| C01 | IA pode acrescentar trabalho diante de formulário | Duas entradas equivalentes, mesmo motor; IA como opção | Comparar esforço de entrada e compreensão com casos fictícios |
| C02 | Necessidade/adoção e ganho social não comprovados | Tratar como hipóteses; promessa restrita a organizar preparação | Observação de uso se houver voluntários; sem inventar impacto |
| C03 | Genérico como chat com edital | Demonstrar cadeia fato/frase/regra/ação e sua revisão | Correção ao vivo que retira orientação dependente |
| C04 | IA decorativa | Gemma executa extração real; decisões administrativas separadas | Chamada real, modelo identificado, entrada e extração inspecionáveis |
| C05 | Negação/incerteza/contradição produzem caminho indevido | Estados próprios; confirmar fatos cotidianos | Casos positivos, negativos e ambíguos sem erros críticos |
| C06 | Correção deixa orientação antiga ativa | Recalcular ações, perguntas e resumo; invalidar versão de relato | Nenhum resultado ativo dependente do valor antigo |
| C07 | Citação pode existir e orientar errado | Fonte curada e revisão de sentido; não vender substring como prova | Revisar ações esperadas contra cláusulas e relato |
| C08 | Plano parcial parece suficiente | Limite junto ao resultado e no resumo; sem porcentagem ou "pronto" | Usuário consegue dizer o que não foi avaliado |
| C09 | Cobertura estreita vira negativa universal | Fora do recorte diferente de ausência de alternativa; 6.8/6.10 visíveis | Caso fora do ramo não produz negação de direito/caminho |
| C10 | Foto cortada pouco original | Retirada do MVP e da justificativa competitiva | Não consumir tempo com upload/OCR |
| C11 | Competitividade global/adaptação não demonstradas | Separar regras/fontes do fluxo; demonstrar um caso local | Outra pessoa consegue localizar onde alterar regra; sem alegar escala |
| C12 | OSS apenas licença/README | Casos sintéticos, resultados esperados, execução e limites reproduzíveis | Instruções usadas por outra pessoa sem segredos |
| C13 | Prazo curto e execução inexistente | Plano solo com marco das 11h e corte por prioridade | Ciclo real antes do acabamento; submissão adiantada |
| C14 | Demo pouco memorável | Edição causal visível e pergunta ao vivo limitada ao escopo | Roteiro de 3 minutos com chamada real |
| C15 | Usabilidade/acessibilidade/compreensão incertas | Mobile, teclado, rótulos, linguagem simples, fonte progressiva | Checagem de tarefa e compreensão; estado não depende só de cor |
| C16 | Privacidade/chave/API/latência | Demo sintética, chave no servidor, conteúdo mínimo; sem prometer offline | Checar chamada e falha, não registrar relatos pessoais em logs |
| C17 | Banca pesa construção/aprendizado, não só propósito | Relatar uma escolha técnica e falha corrigida efetivamente ocorridas | Nenhum aprendizado ou resultado fabricado |
| C18 | Alegações sobre julgadores e vitória sem base | Pesquisa separa participação/julgamento e fato/inferência | Pitch não atribui preferências nem promete pódio |

## 7. Aceitação e observação: execução ainda não verificada
No período autorizado, produzir exemplos sintéticos e resultados esperados. O marco das 11h verifica integração mínima, não aprovação da integridade. Entre 11h e 11h40, priorizar seis verificações: ciclo positivo com chamada real; terceiro/negação/data desconhecida; acontecimentos diferentes sem mistura; edição/novo relato/resposta atrasada; instrução maliciosa sem alterar controles; API inválida ou indisponível com entrada manual. Os cenários abaixo ampliam a regressão conforme o tempo disponível.
- A: saída da residência, evento com data recente e perda de documentos declarados. Mostrar informação pertinente do recorte, sem elegibilidade.
- B: houve alagação na cidade, mas a pessoa não saiu da própria casa. Não inferir saída; não personalizar 6.9 por esse fato.
- C: relato incompleto, data ou saída desconhecida. Perguntar o dado necessário; manter outros passos consultáveis.
- D: relato com negação, outro sujeito ou datas contraditórias. Não colapsar em afirmação positiva.
- E: depois da confirmação, corrigir fato relevante e copiar resumo. Nenhuma orientação anterior dependente permanece ativa; fonte e limite são preservados.
- F: roubo sem saída da residência. Não afirmar inexistência de alternativas; indicar referência conexa 6.8 dentro dos limites declarados.
- G: afirmação extraída sem trecho válido ou com sentido errado. Não verificável, requer correção; o mesmo trecho conter palavras semelhantes não basta.
- H: mudar por completo o relato. Confirmações antigas não são reutilizadas silenciosamente; uma resposta atrasada da versão anterior é descartada.
- I: evento na data-limite de 90 dias e fora dela, calculados a partir de referência explícita. Não inferir elegibilidade; verificar apenas a condição temporal do recorte. Data ausente continua desconhecida.
- J: saída da residência sem perda de documentos pessoais. Não inferir perda nem apresentar o caminho 6.9 como personalizado.
- K: falha, demora ou resposta inválida da API. Oferecer entrada manual sem afirmar inferência concluída, preservar apenas fatos confirmados atuais e identificar demonstração gravada como tal.

Critério de integridade: nenhum erro crítico nos cenários executados. Erro crítico: fato inventado, personalização com dado desconhecido, fonte/regra errada, orientação revogada ativa, dispensa/elegibilidade ou completude sugerida sem base. Um conjunto pequeno sem falhas não demonstra confiabilidade geral; publicar quantidade de casos, repetições e falhas reais.

Comparar orientações com resultados esperados revisados manualmente, independentemente da entrada. Separadamente, comparar relato e perguntas quanto a esforço, pedidos de ajuda, correções e capacidade de explicar o próximo passo. Formulário recebe os mesmos fatos, regras e fontes; não fabricar concorrente ruim.

Entre 12h10 e 12h35, reservar 2 minutos de apresentação, até três sessões voluntárias de 6 minutos e 5 minutos de consolidação. Cada participante usa uma entrada, na ordem relato, perguntas, relato, com o mesmo caso fictício. Observar pedidos de ajuda, correções e compreensão do próximo passo e das pendências. Essa observação não permite comparação causal entre entradas nem comprova superioridade, adoção ou impacto. Não esperar voluntários nem atrasar a entrega; sem participantes, declarar apenas avaliação sintética.

## 8. Execução de 4h45 e cortes
Equipe desconhecida: assumir viabilidade solo. Divisão adicional ajuda, mas não é pré-condição.
- 09:00–09:25: confirmar rubrica/regras locais, versão do edital e acesso real ao Gemma.
- 09:25–10:20: fluxo comum, fatos, regras do recorte, fontes e resultado parcial.
- 10:20–11:00: integrar extração, confirmação, edição e invalidação. Marco: uma chamada real e uma correção atualizando orientações e resumo.
- 11:00–11:40: executar casos contrastivos, corrigir erros críticos.
- 11:40–12:10: legibilidade, celular, teclado, estado desconhecido e cópia do resumo.
- 12:10–12:35: observação de tarefa com voluntários se disponível; caso contrário repetir casos novos e declarar limite.
- 12:35–13:00: README, licença, casos/resultados e ensaio.
- 13:00–13:15: submeter e conferir projeto nas duas categorias elegíveis.
- 13:15–13:45: margem para correções e verificação da entrega. Demos a partir das 14h segundo aviso organizacional.

Até 9h25, definir stack dominada, responsável pela integração e forma de execução conforme os requisitos de entrega; limitar exploração de ferramentas a 20 minutos. Iniciar com orçamento de espera de 15 segundos para inferência, ajustado após medir e incluindo repetições do SDK. Depois das 11h, congelar arquitetura, provedor e escopo. Alteração de fonte não esclarecida em 20 minutos retira apenas a personalização afetada.

Cortar nesta ordem: comparação visual lado a lado, estilo supérfluo, exportação elaborada, referências adicionais além de 6.8 e da sinalização de 6.10. Preservar: fonte, estados, confirmação, edição, limites e chamada real. Já estão fora: foto/OCR, áudio, login, banco, mapas, busca web, inscrição automática, framework para múltiplos editais, treinamento de modelo e execução offline.

Se um ramo continuar produzindo erro crítico após correção, retirar sua personalização: exibir apenas o texto consultável e a pendência explícita, sem sugerir orientação validada. Se o erro atingir o núcleo, apresentar o protótipo como incompleto e descrever a falha; não publicar um selo de aprovação. Essa contingência não conta como cumprimento do ciclo completo planejado.

Se API ou extração falhar no marco, diagnosticar e reduzir volume de extração ao mínimo útil, com nova verificação; não remover incerteza para parecer funcional. Se ainda falhar, apresentar honestamente o fluxo manual e eventual gravação/resultados obtidos no próprio evento, explicitamente rotulados. Isso é contingência de demonstração, não prova de modelo funcionando ao vivo, nem aprovação automática para prêmio Gemma.

## 9. Entrega aberta e arquitetura delimitada
No sábado: uma aplicação simples, endpoint de inferência com chave protegida, estado de sessão sem cadastro, regras/fontes separadas da interface. Evitar infraestrutura desnecessária. Sem documentos reais ou histórias pessoais na demonstração; não anunciar inferência local, privacidade absoluta ou ausência de tratamento pelo provedor. Antes de aceitar dados reais após o evento, revisar práticas e condições de tratamento de dados.

Repositório público com MIT ou Apache 2.0 para nosso código; documentar separadamente modelo e termos, dependências, fontes e o uso de IA na construção. Licença do código não relicencia modelo nem edital.

README com instalação, configuração sem chave exposta, modelo utilizado, execução pela API, fluxo demonstrado, limites e instruções dos casos. Incluir resultados realmente medidos e falhas. Outra pessoa deve conseguir reproduzir o exemplo e identificar onde adaptar regras; não prometer que apenas trocar o PDF adapta outro edital.

## 10. Demo de 3 minutos
00:00–00:25: dificuldade concreta e promessa restrita. "A Ponte ajuda a organizar uma situação e seus próximos passos, com a fonte ao lado."
00:25–01:10: relato sintético, chamada real ao Gemma, fatos e frases de origem; usuário confirma.
01:10–01:50: mostrar passos concretos, abrir a fonte e explicar a pendência para a Proaes.
01:50–02:25: corrigir um fato e mostrar a retirada da orientação dependente e a atualização do resumo, sem nova chamada.
02:25–02:40: papel do Gemma, regras revisadas, contribuição aberta e o que foi efetivamente testado.
02:40–03:00: limites e próximo passo de validação real. Sem números de impacto não medidos.

Usar um único caso e uma chamada real; ensaiar a espera da API dentro dos três minutos.

## 11. Auditoria de aprovação
- Hoje: cobertura das críticas e coerência do desenho podem ser aprovadas após revisão independente.
- Sábado: execução, acesso ao modelo, latência, integridade dos casos e submissão exigem evidência real.
- Após teste com usuários: utilidade comparada, adoção e efeito no atendimento continuam perguntas empíricas.
- Não usar aumento de nota de agente como prova de aceitação da banca. Este plano melhora uma aposta, não certifica perfeição.

## 12. Revisão do planejamento em 23/10/2026
Igor e Helena leram o documento completo e aprovaram a concepção, distinguindo-a da execução futura. Um leitor independente sem o histórico do debate identificou corretamente público, promessa, escopo, papel do formulário e diferencial; aprovou a cobertura de C01–C18. Foram incorporados seus ajustes de preservação das referências mínimas e contingência para ramo com erro crítico, além da explicação concreta de cobertura sugerida por Helena. Essas revisões são avaliações por agentes, não validação da Proaes ou da banca. Não executar nem publicar alegação de teste ou adoção com base nesta aprovação.

## 13. Expansão gradual para outros editais — decisão de 24/10/2026

### 13.1 Produto e limites
Aprovar a expansão para um catálogo de editais revisados, preservando as duas entradas, confirmação de fatos, fontes, correção e resumo atualizado. Separar duas tarefas: descobrir oportunidades possivelmente pertinentes e preparar documentação para uma seleção escolhida. Edital encontrado não significa inscrição aberta, elegibilidade ou possibilidade de inscrição direta daquele usuário.

Conferência documental significa descrever os aspectos efetivamente avaliados e apontar pendências fundamentadas. Existência de arquivo, legibilidade, correspondência com requisito, autenticidade e aceitação administrativa são questões distintas. A decisão formal continua com a instituição; não usar selo de documento aprovado, porcentagem de aprovação ou checklist apresentado como suficiente para toda a inscrição.

### 13.2 Arquitetura de expansão
Busca em fontes oficiais → coleta limitada de HTML/PDF → registro de URL, data, hash e cópia da versão → extração com página e trecho → identificação de edital, anexo, alteração e etapa → revisão das regras → catálogo publicado → orientação baseada nos fatos confirmados.

A busca pode descobrir novas fontes automaticamente. Publicar regras para personalização exige revisão: confirmação factual do usuário não substitui curadoria normativa. Identificar instituição, órgão, processo, objeto, edição, chamada e etapa. Registrar quais cláusulas uma alteração modifica; não substituir todo o edital pela data do arquivo mais recente. FAQ ou notícia não resolve silenciosamente conflito com a fonte aplicável.

Começar com catálogo pequeno e busca textual. Adotar índice vetorial somente se houver necessidade demonstrada. Extrair texto nativo primeiro e usar OCR quando necessário, mantendo trechos duvidosos não conferidos. Mudança material suspende orientações afetadas até revisão e exige atualizar o resumo do caso.

Separar busca/coleta da inferência. A documentação consultada confirma Gemma pela Gemini API, mas não estabelece suporte a Google Search grounding em Gemma. Não presumir compatibilidade por compartilhar a API. Acesso a imagens também não demonstra autenticação ou aceitação documental.

Aplicar limites de destinos, redirecionamento, tamanho e tempo na coleta. Conteúdo externo é dado, sem autoridade para executar instruções. Eventuais documentos pessoais ficam separados do acervo público, com acesso e retenção definidos; não incluir dados pessoais em consultas web ou logs.

### 13.3 Evidências da rodada
- UFAC 17/2026: localizada seleção adicional com anexos, chamadas e adendos. O Adendo 02, de 14/10, muda o item 5.3 de quatro para seis meses. Vigência do auxílio não equivale a prazo de inscrição.
- UFMG FORMEX 02/2026: coordenadores indicados submetem propostas; a seleção de estudantes ocorre em outra etapa. A retificação de 24/06 altera o cronograma. Busca por bolsas não deve atribuir ao estudante tarefas de coordenador.
- UFMA: a retificação 7/2026 modifica um requisito do Edital 03/2026; não se aplica a outro auxílio emergencial só por semelhança de nome.
- Houve falhas de abertura durante a consulta. Fonte não obtida permanece não conferida; fragmento de busca não basta para publicar regra.

Esses resultados vêm de inspeção manual de fontes públicas, não de testes da Ponte. Produto, auditoria e infraestrutura recomendaram expansão controlada e preservação do núcleo do hackathon. Custos, latência, precisão e capacidade simultânea continuam sem medição.

### 13.4 Critérios para ampliar o piloto
Antes de liberar novos editais, executar e registrar: original com alteração e edição alheia; editais de mesmo número em instituições diferentes; papel e etapa desconhecidos; atualização normativa durante um caso; correção com retirada de dependências; PDF ilegível; instrução maliciosa em fonte; indisponibilidade de rede/modelo; documento aparentemente correto sem autenticidade verificada; isolamento e descarte de arquivos pessoais, se houver upload.

Exigir fontes aplicáveis e regras revisadas, cobertura explícita por requisito, falhas registradas e nenhuma orientação crítica incorreta nos casos executados. Medir tempo de curadoria por edital, falhas de extração, chamadas, tokens, buscas, armazenamento e latência. Não converter poucos casos sem falha em alegação de confiabilidade geral.

### 13.5 Ordem de expansão e julgamento
1. Hackathon: preservar um edital revisado e o ciclo completo. Um segundo edital revisado só entra se o núcleo passar pelas verificações e houver tempo sem comprometer submissão. Busca aberta e upload permanecem fora da entrega planejada.
2. Piloto: dois ou três editais semelhantes da UFAC, com descoberta restrita a páginas oficiais e orientação apenas para fontes e regras revisadas.
3. Produto: ampliar famílias de editais e instituições com revisão responsável, monitoramento de versões e avaliações de recuperação e regras. Recebimento de documentos pessoais constitui uma expansão adicional.

Julgamento final: expansão gradual aprovada como direção de produto; ampliação no hackathon condicionada à execução do núcleo. Não aprovar promessa de qualquer edital ou aprovação automática. A experiência pode continuar simples; a confiabilidade depende de uma camada de fontes e versões que ainda precisa ser implementada e avaliada.

### 13.6 Material de referência da expansão
Parecer completo e matriz de verificações: [PONTE-AVALIACAO-EXPANSAO.md](PONTE-AVALIACAO-EXPANSAO.md).

- UFAC 17/2026: https://www3.ufac.br/proaes/2026/edital-proaes-no-17-2026-edital-de-selecao-do-programa-de-auxilio-primeira-infancia-e-auxilio-moradia-e-17-2026
- Adendo 02: https://www3.ufac.br/proaes/2026/edital-proaes-no-17-2026-edital-de-selecao-do-programa-de-auxilio-primeira-infancia-e-auxilio-moradia-e-17-2026/edital-17-2026-moradia.pdf
- UFMG FORMEX: https://www.ufmg.br/proex/formex/
- Edital UFMG: https://www.ufmg.br/proex/wp-content/uploads/2026/05/EDITAL-PROEX-02_2026-FORMEX.pdf
- Retificação UFMG: https://www.ufmg.br/proex/wp-content/uploads/2026/06/Aviso-de-Retificacao-1-FORMEX.pdf
- Retificação UFMA: https://portalpadrao.ufma.br/proaes/bolsas-e-auxilios/edital-proaes-no-x_2026-retificacao-emergencial-1.pdf
- Gemma via API: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- Google Search grounding: https://ai.google.dev/gemini-api/docs/google-search

