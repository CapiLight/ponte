# Ponte

A Ponte é um projeto para ajudar estudantes a preparar solicitações de assistência estudantil. A proposta é transformar um relato em fatos que a pessoa pode conferir e corrigir, relacioná-los às regras de um edital e apresentar próximos passos com a fonte ao lado.

Projeto para o [Hacktoberfest Hack Day LASI/UFAC](https://events.mlh.com/events/15506), em Rio Branco, em 24 de outubro de 2026.

## Estado do projeto

O núcleo em Python está implementado e testado: fichas de edital, motor de orientações, extração de fatos com Gemma, análise automática de editais com Gemma e catálogo em SQLite. A interface visual está sendo feita em separado (um protótipo em React está em `PonteFront/`, ainda com análise simulada) e ainda não chama o núcleo.

A utilidade para estudantes não foi avaliada com usuários.

As decisões de escopo e os cenários de aceitação estão no [plano revisado](PONTE-PLANO-REVISADO.md).

## Problema e primeiro caso

Uma pessoa pode saber contar o que aconteceu e ainda ter dúvidas sobre quais documentos separar ou o que perguntar ao atendimento. Editais distribuem essas orientações entre requisitos, exceções e anexos, que também podem receber alterações.

O primeiro caso da Ponte é a preparação parcial de um pedido relacionado à saída da residência por alagação, incêndio ou outro evento adverso e à perda de documentos pessoais. A referência é um recorte do Edital Proaes nº 01/2026 da UFAC, processo 23107.000688/2026-82.

A utilidade dessa abordagem e o benefício do relato livre em comparação com perguntas diretas ainda precisam ser avaliados com usuários.

## Fluxo previsto

1. A pessoa conta sua situação ou escolhe responder perguntas sobre os mesmos fatos.
2. No relato livre, Gemma sugere informações e mostra os trechos de origem.
3. A pessoa confirma, corrige ou mantém uma informação como desconhecida.
4. A ficha do edital relaciona os fatos a orientações parciais, fontes e perguntas pendentes.
5. Ao editar um fato, as orientações que dependem dele são recalculadas e o resumo é atualizado.
6. A pessoa copia o resumo para preparar um atendimento ou uma solicitação.

Um exemplo fictício é o relato de alguém que saiu da própria residência após uma alagação e perdeu documentos pessoais. Se depois corrigir que não precisou sair de casa, a orientação dependente desse fato deve ser retirada. Isso não permite concluir que a pessoa não tenha outra alternativa no edital.

## Papel do Gemma

A Ponte usa `gemma-4-26b-a4b-it` pela Gemini API em dois momentos:

1. **Análise do edital, uma vez por versão** (`ponte/analise.py`). O Gemma lê o PDF e monta a ficha do edital: trechos literais com página, campos que precisam ser perguntados, situações aceitas com requisitos e prazos, e orientações com fonte. A ficha é usada sem revisão humana, por isso passa por conferência mecânica: trecho que não aparece na página indicada é descartado, assim como campo, requisito ou orientação com referência inválida ou com linguagem de elegibilidade, dispensa ou aprovação. A ficha leva a marca de geração automática, que aparece no resumo entregue ao estudante.
2. **Extração de fatos do relato, a cada uso** (`ponte/extracao.py`). O Gemma recebe só a lista de campos da ficha, não o edital, e sugere valores com o trecho literal do relato que os sustenta. A pessoa confirma ou corrige cada sugestão.

Perguntas diretas, perguntas sobre o que falta, regras, correções e resumo não chamam o modelo. Confirmar um fato não comprova o acontecimento nem determina o enquadramento no edital. Se a chamada falhar, o preenchimento manual continua disponível.

## Cobertura e limites

O MVP aborda a relação entre os itens 2.2(b), 2.2.2 e 6.9 do edital, com referência conexa ao item 6.8 e indicação de que a alternativa do item 6.10 não foi avaliada. Os próximos passos incluem separar documentos disponíveis, consultar os anexos citados e preparar perguntas específicas para a Proaes.

O plano é parcial. A Ponte não determina direito ao auxílio, autenticidade de documentos, dispensa de exigências ou inscrição completa. A análise e a aprovação pertencem à instituição. O projeto é independente e não representa um serviço oficial da UFAC.

Dados desconhecidos e conflitos entre fontes devem permanecer visíveis. Uma orientação precisa indicar o requisito consultado e a versão da fonte. A disponibilidade atual das inscrições precisa ser conferida na página oficial.

Upload de documentos, OCR, áudio, busca aberta na internet, cadastro e inscrição automática ficam fora do MVP.

## Expansão prevista

O catálogo de editais já existe: cada edital tem uma ficha, e uma ficha nova pode ser gerada pelo Gemma a partir dos PDFs oficiais com `scripts/analisar_edital.py`. Por decisão da equipe, fichas geradas são usadas sem revisão humana; a conferência mecânica descarta o que não tem fonte literal ou referência válida, e o resumo avisa o estudante sobre a origem automática.

Ainda não implementados: busca automática de editais na internet, detecção de adendos e retificações publicados depois da análise, e conferência de documentos enviados pelo estudante. Aceitação institucional e autenticidade exigem verificações próprias.

## Execução

Requer Python 3.12 ou mais recente.

```bash
git clone https://github.com/CapiLight/ponte.git
cd ponte
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest
```

Para usar o Gemma, copie `.streamlit/secrets.toml.example` para `.streamlit/secrets.toml` e preencha `GEMINI_API_KEY`, ou exporte a variável. O arquivo de segredos é ignorado pelo git.

```bash
# confere acesso, modelos disponíveis e latência
.venv/bin/python scripts/checar_gemma.py

# gera a ficha de um edital e atualiza o catálogo (catalogo.db)
.venv/bin/python scripts/analisar_edital.py --chave ufac-proaes-17-2026 \
    --pagina <página oficial> --pdf edital=<URL do PDF> --pdf anexos=<URL do PDF>

# compara uma ficha gerada com uma de referência
.venv/bin/python scripts/comparar_fichas.py ufac-proaes-01-2026 ufac-proaes-01-2026-gemma --com-relatos
```

## Como o núcleo funciona

| Módulo | Responsabilidade |
|---|---|
| `fichas/*.json` | Fichas dos editais, uma por arquivo. `ufac-proaes-01-2026.json` foi montada à mão; as demais podem ser geradas pelo Gemma |
| `ponte/ficha.py` | Formato da ficha, leitura e validação de todas as referências |
| `ponte/catalogo.py` | Catálogo SQLite montado a partir das fichas, para consulta rápida |
| `ponte/fatos.py` | Caso do estudante: fatos com estado, origem, trecho e revisão |
| `ponte/extracao.py` | Sugestão de fatos a partir do relato, com Gemma e validação local |
| `ponte/motor.py` | Aplica a ficha aos fatos e gera o plano com fontes |
| `ponte/mudancas.py` | Explica o que mudou no plano após uma correção |
| `ponte/resumo.py` | Resumo copiável do estado atual |
| `ponte/analise.py` | Gera a ficha de um edital com Gemma |

Sequência para uma interface:

```python
from datetime import date
from ponte.catalogo import carregar_do_catalogo, listar_editais
from ponte.extracao import FalhaNaExtracao, extrair
from ponte.fatos import Caso, resultado_ainda_vale, versao_do_relato
from ponte.motor import gerar_plano
from ponte.mudancas import comparar, descrever
from ponte.resumo import gerar_resumo

ficha = carregar_do_catalogo("ufac-proaes-01-2026")   # listar_editais() mostra as opções
caso = Caso.novo(ficha.campos, date.today())             # guardar na sessão

# relato livre
revisao, relato_enviado = caso.revisao, relato
try:
    extracao = extrair(ficha, relato, chave_da_api)
except FalhaNaExtracao:
    ...  # oferecer as perguntas diretas, mantendo o relato
if resultado_ainda_vale(caso, revisao, relato_enviado, relato_atual):
    indice = 0 if len(extracao.eventos) == 1 else escolha_da_pessoa  # None se não houver eventos
    caso = caso.aplicar_sugestoes(extracao.sugestoes(indice), versao_do_relato(relato_enviado))

# conferência e perguntas diretas
caso = caso.confirmar("saiu_da_residencia")
caso = caso.informar("data_evento", date(2026, 10, 10))

# plano, correção e resumo
plano = gerar_plano(ficha, caso)
novo_caso = caso.informar("saiu_da_residencia", "nao")
novo_plano = gerar_plano(ficha, novo_caso)
mensagens = [descrever(m, caso, novo_caso) for m in comparar(caso, plano, novo_caso, novo_plano)]
texto = gerar_resumo(ficha, novo_caso, novo_plano)
```

As perguntas da tela vêm de `ficha.campos` (pergunta, tipo e opções). O plano é sempre recalculado a partir do caso; a interface não deve guardar orientações antigas como atuais.

## Validação

Resultados medidos em 24/10/2026. São poucos casos; não demonstram confiabilidade geral.

**Testes automatizados:** 136 testes passam (`pytest`). Cobrem os cenários A a K do plano na parte determinística, a conferência de cada trecho transcrito contra a página do PDF oficial, a validação das fichas, a extração com respostas preparadas (negação, outra pessoa, datas relativas, trecho inventado, instrução maliciosa, falhas da API) e o analisador com um Gemma simulado sobre os PDFs reais.

**Motor declarativo:** em 11.520 combinações de respostas, o motor com a ficha do Edital 01/2026 produziu exatamente as mesmas orientações das regras escritas antes em código.

**Gemma pela Gemini API** (`gemma-4-26b-a4b-it`), com a chave da equipe:

| Medição | Resultado |
|---|---|
| Disponibilidade, sondagem de 8 rodadas | 26b: 7 de 8 respostas; 31b: 1 de 8 |
| Extração de 5 relatos fictícios, 1ª rodada | 3 falhas (tempo esgotado e erros 500) |
| Extração, rodadas seguintes | 5 de 5 e depois 4 de 5 (um erro 504) |
| Latência das extrações que responderam | 1,3 s a 45 s; nas últimas rodadas, 4 s a 7 s |
| Qualidade observada nas extrações | negação preservada; fato de vizinha atribuído a outra pessoa; relato com instrução maliciosa sem fatos extraídos; um erro de sentido (alagação da casa da avó atribuída a outra pessoa, embora o relato diga "tivemos que sair") |
| Análise automática do edital inteiro | **não concluída**. Numa chamada única (12,8 mil tokens), recebeu erro 429 de limite de uso e, isolada, passou de 4 minutos sem resposta. A versão dividida por página foi interrompida após 14 minutos sem terminar, por falta de tempo no evento |

Por isso, a única ficha do catálogo hoje é a do Edital 01/2026 montada à mão. O analisador está implementado e testado com respostas simuladas, mas ainda não gerou uma ficha real. Próximo passo: rodar `scripts/analisar_edital.py` fora do horário de pico e comparar com `scripts/comparar_fichas.py`.

## Uso de IA no desenvolvimento

O Codex foi usado para pesquisar referências, discutir o escopo, realizar revisões por agentes e redigir o plano. O Claude Code foi usado para transcrever as cláusulas do edital, escrever o núcleo em Python e seus testes, medir o acesso ao Gemma e atualizar este README. A equipe acompanhou as decisões de escopo e é responsável pelo conteúdo.

O código gerado foi verificado com a suíte de testes (`pytest`), com a conferência de cada trecho transcrito contra a página do PDF oficial e com chamadas reais ao Gemma registradas na seção de validação.

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
