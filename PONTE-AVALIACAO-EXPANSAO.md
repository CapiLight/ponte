# Ponte — avaliação de expansão

Data: 24/10/2026. Base: documento de referência v1.1. Esta análise não altera o MVP aprovado nem o sumário do Google Docs.

## 1. Parecer

Aprovar a expansão gradual para um catálogo de editais revisados. Manter a experiência de relato ou perguntas, confirmação de fatos, orientação com fonte, correção e atualização do resumo. Não adotar a promessa de aprovação automática de documentos nem de interpretação confiável de qualquer edital.

A busca pode encontrar fontes candidatas em vários sites. Uma fonte nova só sustenta orientação personalizada depois de identificada, relacionada à seleção correta e revisada. A confirmação de fatos pelo estudante não substitui a revisão das regras pela equipe.

Separar descoberta de oportunidades e preparação para uma seleção escolhida. Um edital encontrado pode ser relevante para consulta sem estar aberto, admitir aquele perfil ou permitir inscrição direta do estudante.

## 2. Rodada independente

- Helena, produto: há potencial para ampliar a jornada e atender mais estudantes; busca aberta e upload prejudicam a viabilidade da entrega de 4h45. Expandir primeiro para outro edital semelhante da mesma instituição.
- Auditoria: o maior risco é formar um edital inexistente com fragmentos verdadeiros de instituições, edições, papéis e etapas diferentes. Fonte oficial não significa fonte aplicável. Autenticidade, conformidade observável e aprovação administrativa são questões distintas.
- Raul, infraestrutura: separar busca/coleta, extração, curadoria/versionamento e execução das orientações. O custo de revisar regras e atualizações pode dominar o trabalho. Não presumir suporte a Google Search grounding em Gemma por utilizar a Gemini API.

Os pareceres são avaliações de concepção; não são evidência de desempenho do produto.

## 3. Verificações executadas nesta rodada

Método: busca web, abertura de fontes oficiais e confronto manual de trechos. Não houve execução da Ponte, inferência com a chave da equipe, upload de documento pessoal ou teste de carga. Os resultados abaixo descrevem a investigação, não aprovações do software.

| Verificação | Observação real | Consequência para o projeto |
| --- | --- | --- |
| Encontrar uma segunda seleção da UFAC | Localizada a página do Edital Proaes 17/2026 com edital, anexos, chamadas, resultados e adendos. | Descoberta é viável; o resultado deve apontar para o conjunto documental, não apenas para um PDF. |
| Confrontar versão e alteração | O Adendo 02, de 14/10/2026, altera o item 5.3 de julho–outubro, quatro meses, para julho–dezembro, seis meses. | Vigência do benefício não equivale a inscrição aberta. Atualizar somente a regra atingida, preservando histórico e revisão. |
| Identificar o papel do usuário | No FORMEX/UFMG, o item 3.1 limita submissão aos coordenadores indicados; o item 4.4 atribui a seleção dos estudantes aos responsáveis pelas atividades. | Um estudante não deve receber tarefas de proponente só porque o texto menciona bolsas estudantis. |
| Conferir cronograma retificado | A retificação FORMEX de 24/06 muda o resultado preliminar para 30/06, recursos para 30/06–09/07 e resultado final para 17/07. | PDF original isolado pode gerar orientação temporal desatualizada. Não afirmar disponibilidade atual de inscrição. |
| Restringir o alcance de uma alteração | A retificação UFMA 7/2026 modifica o item 3(f) do Edital 03/2026 sobre integralização curricular. | Não transferir a alteração para outra universidade ou outro edital de auxílio emergencial. |
| Observar falha de obtenção | Um PDF da UFRA apareceu na busca, mas a tentativa de abertura pelo mecanismo consultado retornou 502. Um PDF da UFMG falhou na abertura direta e foi acessado posteriormente pelo link da página oficial. | Trecho de busca não substitui documento obtido. Distinguir falha temporária, fonte não conferida e ausência de regra; prever repetição limitada e cópia versionada. Não concluir que o site esteja permanentemente indisponível. |
| Verificar capacidades documentadas | A documentação mostra Gemma hospedado na Gemini API e entrada de imagens. A tabela consultada de Google Search grounding lista Gemini, sem Gemma. | A capacidade de busca integrada em Gemma não está estabelecida por essas páginas. Planejar serviço de busca separado; imagem legível não comprova autenticidade ou aceitação. |

## 4. Testes de produto pendentes

| Cenário controlado | Resultado esperado | Situação |
| --- | --- | --- |
| Original + retificação + edição anterior | Aplicar apenas a alteração pertinente, com fonte e versão; manter conflito não resolvido como pendência. | Não executado |
| Dois editais com mesmo número/ano | Separar instituição, órgão, processo, objeto, edição e etapa. Não unir regras. | Não executado |
| Estudante diante de edital para coordenadores | Esclarecer papel e indicar a etapa pertinente sem presumir elegibilidade. | Não executado |
| Alteração do edital durante um caso | Suspender orientações afetadas até revisão; informar versão alterada, sem manter resumo antigo como atual. | Não executado |
| Correção de fato pelo usuário | Retirar orientações e resumo dependentes, sem reutilizar resposta atrasada. | Não executado |
| PDF escaneado ou tabela ilegível | Identificar trechos não conferidos; não completar requisito por palpite. | Não executado |
| Texto malicioso em PDF ou página | Tratar conteúdo como dado; não alterar controles, executar instruções ou expor segredos. | Não executado |
| Rede/modelo indisponível ou resposta inválida | Manter informação geral versionada e permitir preenchimento manual; não simular extração. | Não executado |
| Documento legível com assinatura aparente | Descrever somente os aspectos conferidos, sem certificar autenticidade, autoridade do signatário ou aceitação. | Não executado |
| Upload com dados pessoais | Isolar do acervo público, limitar acesso e retenção, permitir descarte e impedir envio dos dados a consultas web. | Não executado |

Gate proposto para ampliar o piloto: executar esses casos, confrontar resultados com uma referência revisada, registrar falhas e impedir publicação de regras ainda pendentes. Publicar cobertura por requisito e fonte, sem percentual de aprovação do pedido. Zero falhas nos casos executados não comprova confiabilidade geral.

## 5. Infraestrutura proposta

Fluxo das fontes: busca em domínios oficiais → coleta limitada de HTML/PDF → cópia com URL, data e hash → extração por página e trecho → identificação de edital/anexo/retificação/resultado/FAQ → revisão → catálogo versionado → regras publicadas.

Fluxo da pessoa: escolher edital e etapa → relatar ou preencher fatos → confirmar/corrigir → consultar requisitos cobertos e pendências → copiar resumo atualizado. Documentos pessoais, se futuramente recebidos, ficam fora do catálogo público.

Começar com busca textual e catálogo pequeno. Índice vetorial não é requisito inicial. Documento novo pode ser descoberto automaticamente e permanecer aguardando revisão. Mudança material deve invalidar as orientações afetadas até conferência; conservar a versão anterior para auditoria.

Coleta precisa de limites de destino, redirecionamento, tamanho, tipo de arquivo e tempo. Consultas web devem conter termos do edital, sem CPF, relatos ou documentos pessoais. Conteúdo coletado não recebe permissão para executar ações.

Usar texto nativo primeiro; OCR somente quando necessário. Manter página e trecho para conferência. Recuperar fragmentos semelhantes não assegura que exceções, anexos e retificações foram considerados. A curadoria precisa verificar essas relações.

Medir separadamente tempo de revisão por edital, páginas extraídas, falhas de coleta/OCR, buscas, chamadas e tokens de inferência, armazenamento e latência. Não foi medido custo, capacidade simultânea, p95 ou precisão nesta rodada. Latência de descoberta não deve travar a consulta ao catálogo já revisado.

## 6. Expansão e julgamento final

1. Hackathon: entregar um edital revisado, uma chamada real, confirmação e correção com efeito visível. Se houver tempo depois da verificação do núcleo, experimentar um segundo edital já revisado, sem substituí-lo por busca aberta.
2. Piloto: dois ou três editais semelhantes da UFAC, selecionados após conferir vigência, anexos e condições. Busca restrita às páginas oficiais para descoberta; orientação somente para seleções revisadas.
3. Produto: ampliar famílias de editais e instituições com revisão responsável, monitoramento de versões e avaliação de recuperação e regras. Conferência de arquivos pessoais é uma expansão adicional, com testes e proteção próprios.

Parecer final: aprovar catálogo revisado e busca de fontes como evolução; condicionar a inclusão no hackathon ao núcleo funcionando e ao tempo disponível. Não aprovar promessa de qualquer edital ou aprovação automática. O mérito competitivo está em tornar a preparação verificável e corrigível; amplitude sem controle de versões enfraquece esse mérito.

## 7. Fontes consultadas em 24/10/2026

- UFAC, página do Edital 17/2026: https://www3.ufac.br/proaes/2026/edital-proaes-no-17-2026-edital-de-selecao-do-programa-de-auxilio-primeira-infancia-e-auxilio-moradia-e-17-2026
- UFAC, edital original: https://www3.ufac.br/proaes/2026/edital-proaes-no-17-2026-edital-de-selecao-do-programa-de-auxilio-primeira-infancia-e-auxilio-moradia-e-17-2026/sei_2118765_edital_17.pdf
- UFAC, Adendo 02: https://www3.ufac.br/proaes/2026/edital-proaes-no-17-2026-edital-de-selecao-do-programa-de-auxilio-primeira-infancia-e-auxilio-moradia-e-17-2026/edital-17-2026-moradia.pdf
- UFMG, FORMEX: https://www.ufmg.br/proex/formex/
- UFMG, edital: https://www.ufmg.br/proex/wp-content/uploads/2026/05/EDITAL-PROEX-02_2026-FORMEX.pdf
- UFMG, retificação: https://www.ufmg.br/proex/wp-content/uploads/2026/06/Aviso-de-Retificacao-1-FORMEX.pdf
- UFMA, retificação: https://portalpadrao.ufma.br/proaes/bolsas-e-auxilios/edital-proaes-no-x_2026-retificacao-emergencial-1.pdf
- Gemma via Gemini API: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- Google Search grounding: https://ai.google.dev/gemini-api/docs/google-search
