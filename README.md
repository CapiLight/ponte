# Ponte

A Ponte é um projeto para ajudar estudantes a preparar solicitações de assistência estudantil. A proposta é transformar um relato em fatos que a pessoa pode conferir e corrigir, relacioná-los às regras de um edital e apresentar próximos passos com a fonte ao lado.

Projeto para o [Hacktoberfest Hack Day LASI/UFAC](https://events.mlh.com/events/15506), em Rio Branco, em 24 de outubro de 2026.

## Estado do projeto

Este repositório contém o planejamento e a documentação inicial. A aplicação, a integração com Gemma e os testes de software ainda não foram implementados.

Houve pesquisa e conferência manual de fontes públicas. Essas verificações orientam o desenvolvimento e não demonstram o funcionamento ou a precisão do produto.

As decisões de escopo e os cenários de aceitação estão no [plano revisado](PONTE-PLANO-REVISADO.md).

## Problema e primeiro caso

Uma pessoa pode saber contar o que aconteceu e ainda ter dúvidas sobre quais documentos separar ou o que perguntar ao atendimento. Editais distribuem essas orientações entre requisitos, exceções e anexos, que também podem receber alterações.

O primeiro caso da Ponte é a preparação parcial de um pedido relacionado à saída da residência por alagação, incêndio ou outro evento adverso e à perda de documentos pessoais. A referência é um recorte do Edital Proaes nº 01/2026 da UFAC, processo 23107.000688/2026-82.

A utilidade dessa abordagem e o benefício do relato livre em comparação com perguntas diretas ainda precisam ser avaliados com usuários.

## Fluxo previsto

1. A pessoa conta sua situação ou escolhe responder perguntas sobre os mesmos fatos.
2. No relato livre, Gemma sugere informações e mostra os trechos de origem.
3. A pessoa confirma, corrige ou mantém uma informação como desconhecida.
4. Regras revisadas contra o edital apresentam orientações parciais, fontes e perguntas pendentes.
5. Ao editar um fato, as orientações que dependem dele são recalculadas e o resumo é atualizado.
6. A pessoa copia o resumo para preparar um atendimento ou uma solicitação.

Um exemplo fictício é o relato de alguém que saiu da própria residência após uma alagação e perdeu documentos pessoais. Se depois corrigir que não precisou sair de casa, a orientação dependente desse fato deve ser retirada. Isso não permite concluir que a pessoa não tenha outra alternativa no edital.

## Papel do Gemma

A integração planejada usa Gemma 4 pela Gemini API para extrair fatos do relato. O identificador exato do modelo e a configuração serão registrados quando a integração for executada.

O modelo sugere fatos. As regras administrativas vêm de fontes revisadas pela equipe, e a pessoa confirma apenas o que informou sobre sua situação. A confirmação não comprova o acontecimento nem determina o enquadramento no edital.

As perguntas diretas usam os mesmos campos e regras. Se a inferência falhar, o preenchimento manual deve continuar disponível e ser identificado como tal.

## Cobertura e limites

O MVP aborda a relação entre os itens 2.2(b), 2.2.2 e 6.9 do edital, com referência conexa ao item 6.8 e indicação de que a alternativa do item 6.10 não foi avaliada. Os próximos passos incluem separar documentos disponíveis, consultar os anexos citados e preparar perguntas específicas para a Proaes.

O plano é parcial. A Ponte não determina direito ao auxílio, autenticidade de documentos, dispensa de exigências ou inscrição completa. A análise e a aprovação pertencem à instituição. O projeto é independente e não representa um serviço oficial da UFAC.

Dados desconhecidos e conflitos entre fontes devem permanecer visíveis. Uma orientação precisa indicar o requisito consultado e a versão da fonte. A disponibilidade atual das inscrições precisa ser conferida na página oficial.

Upload de documentos, OCR, áudio, busca aberta na internet, cadastro e inscrição automática ficam fora do MVP.

## Expansão prevista

A evolução planejada é um catálogo de editais revisados, começando por seleções semelhantes da UFAC. A experiência de confirmação e correção permanece a mesma.

A busca na internet poderá descobrir fontes candidatas. Antes de uma nova fonte sustentar orientações, será necessário identificar a seleção, conferir anexos e alterações e revisar as regras aplicáveis. Cada edital terá sua própria cobertura documentada.

Uma futura conferência documental deverá apontar aspectos avaliados e pendências. Aceitação institucional e autenticidade exigem verificações próprias. A expansão ainda não foi implementada.

## Execução

Ainda não há aplicação ou comandos de instalação e execução disponíveis. Para consultar a documentação localmente:

```bash
git clone https://github.com/CapiLight/ponte.git
cd ponte
```

Quando houver uma versão executável, esta seção deverá informar os pré-requisitos, a instalação, as variáveis de ambiente e os comandos de inicialização. A chave da API deverá permanecer no servidor, fora do código e do controle de versão.

## Validação

Nenhum teste de software foi executado até esta versão da documentação. Os primeiros cenários planejados são:

- Relato claro, confirmação dos fatos e orientação com fonte.
- Negação, referência a outra pessoa ou data desconhecida.
- Dois acontecimentos no mesmo relato, sem combinar seus fatos.
- Correção de informação, novo relato e descarte de respostas atrasadas.
- Instrução maliciosa no relato sem poder alterar regras ou confirmações.
- Falha ou resposta inválida da API com preenchimento manual disponível.

Os resultados deverão registrar casos executados, comportamento observado e falhas. A demonstração prevista usa um caso fictício, uma chamada real ao modelo e uma correção que modifica o plano e o resumo.

## Uso de IA no desenvolvimento

Até esta versão, o Codex foi usado para pesquisar referências, discutir o escopo, realizar revisões por agentes e redigir o plano e este README. A equipe permanece responsável por conferir o conteúdo e as decisões adotadas.

Ainda não há código de aplicação neste repositório. Conforme o desenvolvimento avançar, esta seção deverá registrar como a IA participou da programação e como o código gerado foi revisado e verificado.

O uso de IA para desenvolver o projeto é distinto da integração prevista de Gemma no produto.

## Entrega no hackathon

A entrega deve incluir repositório público, instruções de execução verificadas, modelo utilizado, casos reproduzíveis e resultados reais. A declaração de uso de IA deve acompanhar o que tiver sido efetivamente feito.

A organização informou submissão em Challenges → Add Submission, pela conta usada na inscrição, até 13h45, e demonstração de três minutos. A equipe deverá conferir os requisitos das categorias Best Open-Source AI Project e Best Use of Gemma 4 antes de selecioná-las. A presença deste README não comprova a conclusão da submissão ou a elegibilidade.

## Referências

- [Página oficial do Edital Proaes nº 01/2026](https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26)
- [Texto do edital](https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26/sei_1956124_edital_01.pdf)
- [Anexos oficiais](https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26/anexos-auxilio-emergencial-2026.pdf)
- [Gemma pela Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)

## Licença

O código e a documentação produzidos pelos contribuidores deste repositório são disponibilizados sob a [licença MIT](LICENSE). Modelos, dependências e documentos institucionais citados mantêm seus próprios termos e direitos.
