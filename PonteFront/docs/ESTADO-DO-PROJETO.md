# Ponte: estado do projeto

A Ponte ajuda estudantes a encontrar editais de bolsas e auxílios das universidades da Região Norte e a se preparar para a inscrição: o que o edital pede, quais documentos separar e o que confirmar com a instituição.

Este documento registra **o que já foi feito**, **como foi feito** e **o que falta**, separando o trabalho de infraestrutura do trabalho da Gemma.

Resumo: hoje a Ponte é um **protótipo só de frontend**. As telas e a fronteira com a IA estão prontas. Os dados de editais são escritos à mão (um real e 17 fictícios), e a IA é simulada. Ainda não existe coleta nos sites das universidades, leitura de PDF nem backend.

---

## 1. O que foi feito

### 1.1 Telas

| Tela | Endereço | O que faz |
| --- | --- | --- |
| Busca de editais | `#/editais` | Busca por texto e filtros (UF, cidade, área, centro, situação, público, "só com orientação guiada"). Ordena por recentes, prazo, área, centro, instituição, valor, vagas ou distância. A distância usa o GPS (com permissão) ou a cidade escolhida. |
| Detalhe do edital | `#/editais/<id>` | Resumo, cronograma, localização, o que costuma ser pedido, link para a fonte oficial e outros editais da região. |
| Preparar edital (fluxo genérico) | `#/preparar/<id>/<etapa>` | Qualquer edital: perguntas sobre a situação da pessoa. Gera as listas de documentos, passos e confirmações, e um resumo para imprimir ou salvar em PDF. |
| Fluxo guiado | `#/preparar/<id do edital guiado>/<etapa>` | Só o Edital 01/2026 da Proaes/UFAC (auxílio emergencial). A pessoa escreve um relato, a IA sugere as respostas com o trecho de origem, a pessoa confere e corrige, e recebe orientações e um resumo. |
| Sobre | `#/sobre` | De onde vêm os dados, como a IA é usada e a política de privacidade. |

### 1.2 Como foi feito

**Stack:** React 19, Vite 8, TypeScript, Tailwind CSS v4, gerenciado com `pnpm`. Não há backend.

**Dados (tópico 1):**
- `src/editais.ts` é a fonte única do catálogo: 9 instituições (10 campi) e 18 editais.
- Só o Edital 01/2026 da Proaes/UFAC é real. Ele tem `fontes` (página, PDF, anexos, nº do processo e data de consulta), digitadas à mão a partir da página oficial. Os outros são fictícios, e a tela avisa isso (`ficticio(e)` é verdadeiro quando não há `fontes`).
- A data de "hoje" é fixa no cenário (`HOJE = '2026-10-24'`), para a demonstração ser reproduzível. Por isso o edital real avisa que o cronograma exibido não é o oficial.

**Navegação e memória (tópico 2):**
- Rotas com hash (`src/rota.ts`) fazem o botão voltar do navegador e os links diretos funcionarem. Rotas inválidas ou etapas ainda não liberadas são corrigidas sem criar entrada no histórico.
- O progresso, os filtros e o relato ficam em `sessionStorage` (`src/persistencia.ts`), só com chaves `ponte:`: sobrevivem a recarregar a página e somem ao fechar a aba. Há "Apagar meus dados", com confirmação em dois passos.
- O fluxo guiado separa três origens de informação: o que veio do relato (a conferir), o que a pessoa confirmou ou informou, e o que vem do cenário. Orientações e resumo são funções puras desses fatos.
- Em desenvolvimento ou com `?demo` aparecem controles de demonstração, como simular uma falha da IA.

**Fronteira com a IA (tópico 3):** detalhada em `src/ia/CONTRATO.md`.
- `src/ia/contrato.ts`: tipos, limites e esquemas JSON das duas tarefas de IA já previstas (organizar o relato e gerar o plano do edital).
- `src/ia/validar.ts`: toda resposta do modelo é conferida antes de chegar à tela. Citações precisam ser literais, valores precisam estar entre as opções, e o que não confere é descartado, nunca corrigido.
- `src/ia/index.ts`: um único ponto de troca do provedor, com tempo limite de 30 s, cancelamento e rejeição de respostas atrasadas.
- `src/ia/simulado.ts`: o provedor atual, determinístico.
- `src/ia/casos.ts`: casos de conformidade. Em desenvolvimento, `await ponteIA.verificar()` no console testa o provedor atual.
- `src/preparo.ts`: o plano de cada edital é um conjunto de perguntas e de itens condicionados às respostas. Mudar uma resposta recalcula a lista na hora, sem chamar o modelo. Hoje o plano vem de regras gerais por tipo de edital (`planoRegras`); a Gemma vai substituí-lo pelo plano específico de cada edital.

**Verificação feita:** `tsc --noEmit` e `vite build` passam. Testes temporários confirmaram:
- o simulador passa nos casos de conformidade;
- os validadores rejeitam respostas malformadas;
- tempo esgotado e cancelamento são tratados corretamente;
- a nova lista de preparação é idêntica à antiga em 5.400 combinações de respostas.

### 1.3 Limitações conhecidas do protótipo

- Só um edital é real, as datas são de cenário e a IA é simulada.
- O fluxo guiado foi construído à mão para um único edital: campos, regras e textos estão em `src/App.tsx`.
- Não há testes automatizados no repositório: os testes acima foram temporários.
- O `oxfmt` não foi aplicado, porque o código existente não segue esse formatador.
- O build avisa que o pacote passa de 500 kB. O aviso não impede o build.
- Nada foi commitado.

---

## 2. Para onde vamos

O objetivo tem duas partes:
1. o catálogo vem dos **sites reais das universidades**, coletados automaticamente;
2. a **Gemma lê o PDF de cada edital** e gera um **formulário personalizado**: perguntas específicas daquele edital, e documentos e passos que dependem das respostas, cada um com a citação do item do edital.

```
 Sites das universidades
        │  (A) coleta periódica
        ▼
 Páginas e PDFs baixados ──(B) extração de texto / OCR──▶ Texto do edital
                                                             │
                                  (G1) é um edital? é retificação?
                                  (G2) metadados do catálogo
                                  (G3) formulário personalizado
                                  (G5) o que mudou na retificação
                                                             │
                                                             ▼
                                  (C) validação + revisão humana
                                                             │
                                                             ▼
                                  (D) banco / API do catálogo ──▶ Ponte (navegador)
                                                                    │
                                              (G4) organizar o relato da pessoa
                                              derivarPreparo: local, sem modelo
```

Decisão importante: **o formulário é gerado uma vez por versão do edital, na coleta, e não a cada pessoa que abre a página.** Isso dá revisão humana antes de publicar, custo previsível, respostas iguais para todos e nenhum dado pessoal enviado ao modelo nessa etapa. Só a tarefa G4, a do relato, roda por pessoa.

---

## 3. O que falta: infraestrutura (sem Gemma)

### A. Coleta nos sites das universidades
- [ ] **Levantamento das fontes:** para cada instituição e campus, listar as páginas onde os editais são publicados (Proaes/Prae, pró-reitorias de pesquisa, extensão e graduação, fundações), o formato (HTML, lista de PDFs, portal, SEI) e a frequência de publicação.
- [ ] **Regras de coleta:** respeitar `robots.txt` e os termos de uso, limitar a taxa de requisições, usar um User-Agent identificado e um contato.
- [ ] **Um coletor por site, com interface comum:** cada coletor devolve `{ url, título, data, links de PDF }`. Os sites são muito diferentes, então mudanças de layout precisam ser detectadas e alertadas, não ignoradas em silêncio.
- [ ] **Execução agendada:** por exemplo, uma vez por dia, mais vezes em períodos de inscrição. Com repetição em caso de falha e registro do que mudou.
- [ ] **Deduplicação e versão:** hash do PDF, para que o mesmo edital republicado não vire um edital novo e para que uma retificação fique ligada ao edital original.
- [ ] **Arquivamento:** guardar o PDF original e a data da coleta. A Ponte sempre cita e linka a fonte oficial.

### B. Extração de texto dos PDFs
- [ ] Extrair o texto com paginação preservada, porque as citações precisam dizer onde estão ("item 4.2", "p. 7").
- [ ] OCR para PDFs digitalizados, marcando quando o texto veio de OCR, já que a confiança é menor.
- [ ] Separar o edital dos anexos (formulários, declarações, cronograma).
- [ ] Guardar o texto extraído: é ele que a validação usa para conferir as citações da Gemma.

### C. Validação e revisão humana
- [ ] Usar os validadores de `src/ia/validar.ts` também no backend, num pacote compartilhado.
- [ ] Painel de revisão: a pessoa revisora vê os metadados e o formulário gerados ao lado do PDF, com as citações destacadas, e aprova, corrige ou rejeita.
- [ ] Regra de publicação: prazos e valores só aparecem depois de revisados, ou aparecem marcados como "não revisado".

### D. Backend e catálogo
- [ ] Banco de dados com instituições, editais, versões, PDFs, textos, formulários gerados e o estado da revisão.
- [ ] API de leitura para o frontend (lista, detalhe, formulário). Ela substitui `src/editais.ts`, e o tipo `Edital` passa a ser o contrato da API.
- [ ] O frontend passa a buscar o plano pronto da API, em vez de gerar no navegador (`usePlano`). O fallback para `planoRegras` continua.
- [ ] Trocar a data de cenário (`HOJE`) pela data real e calcular a situação das inscrições a partir do cronograma revisado.

### E. Produto, privacidade e qualidade
- [ ] Generalizar o fluxo guiado: hoje ele é feito à mão para um edital. O caminho é o formulário gerado pela Gemma (G3) servir também aos editais que pedem relato.
- [ ] Privacidade (LGPD): o relato pode conter dados sensíveis, como moradia, renda e situação de desastre. Falta definir onde a G4 roda, o que é registrado em log (de preferência nada do conteúdo) e por quanto tempo se guarda algo.
- [ ] Testes automatizados no repositório: rotas, validadores, `derivarPreparo` e casos de conformidade.
- [ ] Hospedagem, monitoramento da coleta e alertas para site fora do ar, layout mudado ou PDF ilegível.
- [ ] Revisão de acessibilidade e testes com estudantes reais.

---

## 4. O que a Gemma faria

A Gemma só **lê, extrai e organiza**. Ela não decide elegibilidade, não preenche nada como confirmado e não inventa dados: toda afirmação precisa citar o texto do edital ou do relato, e o que não puder ser conferido é descartado.

| # | Tarefa | Quando roda | Entrada | Saída | Estado |
| --- | --- | --- | --- | --- | --- |
| G1 | Classificar documento | Coleta | Título, URL e primeiras páginas | É edital? Resultado? Retificação? Qual edital retifica? | Falta definir o contrato |
| G2 | Metadados do catálogo | Coleta | Texto do edital | Número, título, área, público, valor, vagas, cronograma, cada um com citação | Falta definir o contrato |
| G3 | **Formulário personalizado** | Coleta, uma vez por versão | Texto do edital (e dos anexos) | Perguntas, documentos, passos e confirmações condicionados, com citação | **Contrato pronto** (`gerarPlano`) |
| G4 | Organizar o relato | Por pessoa, ao clicar | Relato + campos do formulário | Sugestões com trecho literal e pedidos de esclarecimento | **Contrato pronto** (`analisarRelato`) |
| G5 | O que mudou | Coleta, em retificações | Texto anterior + texto novo | Lista de mudanças (prazo, documento, requisito) com citação | Falta definir o contrato |
| G6 | Resumo em linguagem simples | Coleta | Texto do edital | 3 a 5 frases sem juridiquês, com citação | Opcional |

### G3 em detalhe: do PDF ao formulário personalizado

É a tarefa central. O contrato está em `src/ia/contrato.ts` (`PlanoEdital`, `ESQUEMA_PLANO`).

1. A Gemma recebe o texto extraído do edital e dos anexos, com marcas de página ou de item.
2. Ela identifica os requisitos e documentos e transforma cada um num item do tipo `documento`, `passo` ou `confirmar`, com `titulo`, `detalhe`, `motivo` e `fonte` (trecho literal e local).
3. Quando um documento só vale para parte das pessoas, ela cria a **pergunta** que separa os casos, com opções fechadas (`Sim`, `Não`, `Não sei`…), e liga o item a ela por `quando`. Por exemplo: "Você mora com a família?" decide se é preciso comprovante de renda de todos os moradores.
4. Ela não pergunta o que não muda o resultado nem o que o edital não pede.
5. Os validadores descartam itens com citação que não aparece no texto, links que não estão no edital, condições que apontam para perguntas inexistentes e textos longos demais.
6. A pessoa revisora aprova. Depois disso, cada estudante responde às perguntas e a lista de preparação é recalculada no navegador (`derivarPreparo`), sem chamar o modelo de novo.

Para ligar o contrato à coleta, falta uma mudança: hoje `EntradaPlano` é `{ edital }`, e o provedor teria de buscar o texto sozinho. Com a coleta, a entrada passa a trazer o texto já extraído, algo como `{ edital, texto, paginas }`, e o `textoEdital` da resposta deixa de ser necessário.

### O que precisa ser decidido sobre a Gemma

- [ ] **Variante e tamanho do modelo:** testar com editais reais. Editais costumam ter dezenas de páginas mais os anexos, então é preciso medir o contexto necessário e a qualidade das citações em cada tamanho.
- [ ] **Onde roda:** na coleta, num servidor próprio (é processamento em lote e não envolve dados pessoais). Para a G4, a escolha fica entre servidor próprio e o navegador da pessoa: rodar no navegador preserva mais a privacidade, mas exige um modelo menor e um aparelho capaz.
- [ ] **Saída estruturada:** usar os esquemas JSON do contrato com decodificação restrita, se o servidor de inferência permitir. Caso contrário, validar e tentar de novo.
- [ ] **Conjunto de avaliação:** de 10 a 20 editais reais com o formulário esperado, feito à mão. Medir citações corretas, documentos esquecidos e documentos inventados. Os casos de `src/ia/casos.ts` cobrem só a G4.
- [ ] **Prompts versionados:** guardar junto de cada formulário a versão do prompt e do modelo que o gerou.

---

## 5. Ordem sugerida

1. **Gemma, já em paralelo:** implementar G3 e G4 contra o contrato atual. Testar a G3 com o PDF real da UFAC, colando o texto à mão, e comparar o resultado com o fluxo guiado feito à mão.
2. **Coleta mínima:** escolher de 2 a 3 instituições, escrever os coletores, extrair o texto e guardar tudo. Ainda sem painel: revisão por arquivo.
3. **Backend e API:** substituir `src/editais.ts` e passar a servir os formulários já gerados.
4. **Painel de revisão** e regra de publicação.
5. **Tarefas G1, G2 e G5**, que automatizam o catálogo.
6. **Expansão** para as outras instituições, monitoramento, testes com estudantes e ajustes de privacidade.
