# Contrato da IA (Gemma) na Ponte

Este diretório é a fronteira entre a interface e o modelo. A interface só importa de `src/ia` (via `index.ts`) e nunca vê a resposta bruta do modelo: tudo passa por `validar.ts` antes.

| Arquivo | Papel |
| --- | --- |
| `contrato.ts` | Tipos, limites, valores reservados e esquemas JSON (`ESQUEMA_RELATO`, `ESQUEMA_PLANO`) para saída estruturada. |
| `validar.ts` | Confere qualquer resposta (`unknown`) e descarta o que não cumpre o contrato. Não corrige nem inventa. |
| `index.ts` | Gateway usado pela tela: escolhe o `provedor`, aplica tempo limite e cancelamento, valida. Também tem `usePlano`. |
| `simulado.ts` | Provedor atual: respostas determinísticas do protótipo. É a referência de comportamento. |
| `casos.ts` | Casos de conformidade que qualquer provedor precisa passar. |

Estado atual: **nenhum modelo real está conectado.** Não existe endpoint de servidor; se o provedor da Gemma precisar de um, ele será criado como parte desse trabalho.

## Como plugar a Gemma

1. Crie `src/ia/gemma.ts` exportando um objeto que implementa `ProvedorIA`:
   ```ts
   export const provedorGemma: ProvedorIA = {
     nome: 'gemma',
     async analisarRelato(entrada, { sinal }) { /* chama o modelo com ESQUEMA_RELATO */ },
     async gerarPlano(entrada, { sinal }) { /* busca o texto do edital e chama o modelo com ESQUEMA_PLANO */ },
   }
   ```
2. Em `index.ts`, troque `export const provedor = provedorSimulado` pelo novo provedor (por exemplo, escolhendo por `import.meta.env.VITE_IA_PROVEDOR`). **Nenhum arquivo de tela precisa mudar.**
3. Rode `await ponteIA.verificar()` no console do navegador (em desenvolvimento ou com `?demo`). O resultado deve ser `[]`.

Regras para o provedor:
- Pode devolver o JSON do modelo como está (`unknown`); a validação é do gateway.
- Erros devem ser `ErroIA` com `motivo`: `indisponivel`, `tempo_esgotado`, `resposta_invalida` ou `cancelado`. Outros erros viram `indisponivel`.
- Respeite `sinal` (passe para `fetch` etc.). Mesmo que não respeite, o gateway abandona a chamada ao cancelar ou após `LIMITES.tempoMs` (30 s).
- Chaves de API não vão para o navegador. Gemma no próprio navegador ou atrás de um servidor são opções válidas; no segundo caso, o provedor é só o cliente desse servidor.

## Tarefa 1: `analisarRelato` (edital guiado)

Chamada **só** quando a pessoa clica em "Analisar relato". Corrigir um fato depois não chama o modelo.

Entrada (`EntradaRelato`):
```json
{ "versao": 3, "relato": "No dia 10 de outubro de 2026, minha casa foi alagada...", "edital": "<id do edital guiado>",
  "campos": [{ "id": "evento", "pergunta": "...", "tipo": "opcao", "opcoes": ["Alagação", "Incêndio", "Outro evento", "Não sei"] }],
  "dataReferencia": "2026-10-24" }
```
`campos` traz a lista atual de campos (`sujeito`, `evento`, `saida`, `data`, `docs`, `moradia`) com as opções válidas. Monte o prompt a partir dela; não copie a lista para o provedor.

Saída (`RespostaRelato`, esquema `ESQUEMA_RELATO`):
```json
{ "versao": 3,
  "sugestoes": [{ "campo": "evento", "valor": "Alagação", "trecho": "minha casa foi alagada" }],
  "esclarecer": [{ "campo": "evento", "nota": "O relato cita dois acontecimentos.", "trechos": ["incêndio", "alagada"] }] }
```

A validação descarta, item a item:
- campo desconhecido, ou valor fora de `opcoes`;
- `Não sei` e `Não quero informar` (`VALORES_SO_DO_USUARIO`): só a pessoa declara;
- data que não seja `DD/MM/AAAA` válida;
- `trecho` que não seja **cópia literal** do relato. Diferenças de espaço e quebra de linha são ignoradas; acento, pontuação, maiúsculas e palavras não. Máximo de 300 caracteres;
- sugestão repetida para o mesmo campo (fica a primeira); se os valores forem diferentes, todas as sugestões daquele campo são descartadas e a pessoa preenche;
- sugestão para um campo que também está em `esclarecer` (o esclarecimento vence);
- `saida`, `docs` e `moradia` quando `sujeito` é `Não, aconteceu com outra pessoa`: o fato não é atribuído a quem usa a Ponte.

A resposta inteira é rejeitada (`resposta_invalida`) se o formato não bater ou se `versao` for diferente da entrada. A tela também ignora respostas cuja versão já não é a atual (a pessoa editou, voltou ou recomeçou).

O que sai daqui entra na tela como "a conferir", nunca como confirmado, e com o trecho do relato ao lado. A data de referência (`ref`) vem do cenário, não do modelo.

## Tarefa 2: `gerarPlano` (fluxo genérico, qualquer edital)

Entrada: `{ edital }`, o registro do catálogo (`src/editais.ts`), com links da fonte oficial. O provedor busca e lê o texto do edital.

Saída (`RespostaPlano`, esquema `ESQUEMA_PLANO`): perguntas específicas do edital e itens (documentos, passos, confirmações) condicionados às respostas.
```json
{ "edital": "<id>", "origem": "modelo", "textoEdital": "<texto usado>",
  "perguntas": [{ "id": "vinculo", "grupo": "Sua situação", "texto": "Você tem matrícula ativa?", "opcoes": ["Sim", "Não", "Não sei"],
                  "fonte": { "trecho": "estar regularmente matriculado", "local": "item 3.1" } }],
  "itens": [{ "id": "comprovante", "tipo": "documento", "titulo": "Comprovante de matrícula", "detalhe": "...", "motivo": "...",
              "fonte": { "trecho": "...", "local": "item 5.2" }, "quando": { "pergunta": "vinculo", "respostas": ["Sim"] } }] }
```

- `textoEdital` é obrigatório na prática: toda `fonte.trecho` precisa aparecer literalmente nele (mesma regra de espaços da Tarefa 1). Pergunta ou item com fonte que não confere é **descartado inteiro**, porque afirmaria uma citação que não existe. Sem fonte, o item é aceito, mas a tela não mostra trecho. O texto não é guardado nem exibido.
- Links só são mantidos se forem `https` e aparecerem no `textoEdital`.
- `quando` precisa citar uma pergunta do próprio plano e respostas que estão em `opcoes`.
- Itens com o mesmo `id` são variantes (mesmo `tipo`); vale a primeira, na ordem, cuja condição for satisfeita. Veja `planoRegras` em `src/preparo.ts`.
- Documentos e passos exigem `detalhe` e `motivo`; confirmações só `titulo`.
- Limites: até 15 perguntas, 40 itens, 2 a 6 opções por pergunta, textos de até 200 caracteres, notas de até 300.
- `origem: 'regras'` só é aceita do provedor simulado. Para qualquer outro, o plano é tratado como `modelo`.
- Plano vazio depois da validação, ou de outro edital, é rejeitado.

O modelo é chamado uma vez por edital (cache em memória). Trocar uma resposta só recalcula a lista localmente (`derivarPreparo`). Se o modelo falhar, a tela usa a lista geral (`planoRegras`) e avisa a pessoa.

## Casos de conformidade

`casos.ts` exporta os relatos de exemplo da tela e o que se espera deles:

| Relato | Esperado |
| --- | --- |
| `EXEMPLO` | evento Alagação, sujeito Sim, saída Sim, data 10/10/2026, documentos Sim; nada sobre moradia |
| `EXEMPLO_DOIS` | pedir esclarecimento de `evento`; saída Sim, data 10/10/2026; nada sobre documentos |
| `EXEMPLO_OUTRA` | sujeito "Não, aconteceu com outra pessoa", evento Alagação; nada sobre saída, documentos ou moradia |

`verificarConformidade(provedor, campos)` também gera o plano de cada edital do catálogo e reporta qualquer descarte. Os descartes também aparecem como `console.warn` em desenvolvimento.
