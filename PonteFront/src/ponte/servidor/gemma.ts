import { CAMPOS_DA_PESSOA, ESQUEMA_RELATO, LIMITES, OUTRA_PESSOA, VALORES_SO_DO_USUARIO, type EntradaRelato } from '../ia/contrato'

/* Chamada à Gemma 4 pela Gemini API. A chave fica só no servidor (APP_GEMINI_API_KEY). */
export const MODELO = process.env.APP_GEMMA_MODELO || 'gemma-4-26b-a4b-it'
const URL_API = (m: string) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`

export class FalhaGemma extends Error {
  constructor(readonly status: number, mensagem: string) { super(mensagem) }
}

const INSTRUCOES = `Você organiza o relato de um(a) estudante que vai se inscrever num edital de auxílio emergencial.
Sua tarefa é só ler o relato e sugerir valores para os campos de um formulário. A pessoa vai conferir tudo depois.

Regras:
1. Sugira um campo só se o relato disser aquilo de forma explícita. Na dúvida, não sugira.
2. "valor" precisa ser exatamente uma das opções do campo. Datas no formato DD/MM/AAAA.
3. "trecho" precisa ser uma cópia literal e contínua do relato (mesmas palavras, acentos, maiúsculas e pontuação), curta, que justifique o valor.
4. Nunca use ${VALORES_SO_DO_USUARIO.map(v => `"${v}"`).join(' ou ')}: só a pessoa pode declarar isso.
5. Se o relato citar mais de um acontecimento (por exemplo, um incêndio e uma alagação), não sugira "evento": coloque-o em "esclarecer" com uma nota curta e os trechos literais de cada acontecimento. Sugira a data e os demais campos só se forem do acontecimento atual (o mais recente).
6. Se o fato aconteceu com outra pessoa (avó, tia, vizinho), sugira sujeito = "${OUTRA_PESSOA}" e não sugira ${CAMPOS_DA_PESSOA.join(', ')}.
7. "nota" é opcional e curta, em português simples.
8. Devolva "versao" igual à recebida. Responda apenas com o JSON.`

function prompt(e: EntradaRelato) {
  const campos = e.campos.map(c => ({ id: c.id, pergunta: c.pergunta, tipo: c.tipo, ...(c.opcoes ? { opcoes: c.opcoes } : {}) }))
  return `versao: ${e.versao}\ndata de referência da consulta: ${e.dataReferencia}\n\nCampos:\n${JSON.stringify(campos, null, 1)}\n\nRelato (entre as marcas):\n<<<\n${e.relato}\n>>>`
}

/* Valida só o formato da entrada; o conteúdo da resposta é validado no navegador (src/ponte/ia/validar.ts). */
export function lerEntrada(x: unknown): EntradaRelato | null {
  if (typeof x !== 'object' || x === null) return null
  const e = x as Record<string, unknown>
  if (typeof e.versao !== 'number' || typeof e.relato !== 'string' || typeof e.edital !== 'string' || typeof e.dataReferencia !== 'string' || !Array.isArray(e.campos)) return null
  if (!e.relato.trim() || e.relato.length > LIMITES.relatoMax || e.campos.length > 20) return null
  const ok = e.campos.every(c => typeof c === 'object' && c && typeof c.id === 'string' && typeof c.pergunta === 'string' && (c.tipo === 'opcao' || c.tipo === 'data') && (c.opcoes === undefined || (Array.isArray(c.opcoes) && c.opcoes.every((o: unknown) => typeof o === 'string'))))
  return ok ? (e as unknown as EntradaRelato) : null
}

function extrairJSON(texto: string): unknown {
  const t = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try { return JSON.parse(t) } catch { const i = t.indexOf('{'), j = t.lastIndexOf('}'); if (i >= 0 && j > i) return JSON.parse(t.slice(i, j + 1)); throw new FalhaGemma(502, 'Resposta do modelo não é JSON.') }
}

export async function analisarComGemma(e: EntradaRelato, sinal: AbortSignal): Promise<unknown> {
  const chave = process.env.APP_GEMINI_API_KEY || process.env.API_KEY || process.env.api_key
  if (!chave) throw new FalhaGemma(503, 'APP_GEMINI_API_KEY não configurada.')
  const corpo = (comEsquema: boolean) => JSON.stringify({
    systemInstruction: { parts: [{ text: INSTRUCOES }] },
    contents: [{ role: 'user', parts: [{ text: prompt(e) }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json', ...(comEsquema ? { responseJsonSchema: ESQUEMA_RELATO } : {}) },
  })
  const chamar = (comEsquema: boolean) => fetch(URL_API(MODELO), { method: 'POST', signal: sinal, headers: { 'content-type': 'application/json', 'x-goog-api-key': chave }, body: corpo(comEsquema) })
  let r = await chamar(true)
  if (r.status === 400) r = await chamar(false) // alguns modelos não aceitam esquema; a validação continua garantindo o formato
  if (!r.ok) {
    const detalhe = await r.text().catch(() => '')
    console.error(`[gemma] HTTP ${r.status}`, detalhe.slice(0, 500))
    throw new FalhaGemma(r.status === 429 ? 429 : 502, `Gemma respondeu HTTP ${r.status}.`)
  }
  const d = (await r.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] }
  const texto = d.candidates?.[0]?.content?.parts?.filter(p => !p.thought && p.text).map(p => p.text).join('') ?? ''
  if (!texto) throw new FalhaGemma(502, 'Resposta vazia do modelo.')
  return extrairJSON(texto)
}
