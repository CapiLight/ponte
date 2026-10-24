import { CAMPOS_DA_PESSOA, ErroIA, LIMITES, OUTRA_PESSOA, VALORES_SO_DO_USUARIO, type Condicao, type EntradaPlano, type EntradaRelato, type Fonte, type ItemPlano, type PendenciaRelato, type PerguntaPlano, type PlanoEdital, type RespostaRelato, type SugestaoRelato } from './contrato'

/* Toda resposta de provedor passa por aqui. Regra geral: o que não puder ser verificado é descartado
   (com registro em `descartes`), nunca corrigido por adivinhação. Formato irrecuperável gera ErroIA('resposta_invalida'). */
export type Validado<T> = { valor: T; descartes: string[] }

const obj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const limpa = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim()
/* Texto curto opcional: vazio vira '', acima do limite é rejeitado (null). */
const texto = (x: unknown, max: number): string | null => { if (typeof x !== 'string') return null; const t = limpa(x); return t && t.length <= max ? t : null }
const ID = /^[A-Za-z][\w-]{0,39}$/

/* Citação literal: o trecho precisa aparecer no texto de origem, ignorando só diferenças de espaços. */
export function literal(trecho: string, origem: string) {
  const t = limpa(trecho)
  return t.length > 0 && t.length <= LIMITES.trechoMax && limpa(origem).includes(t)
}

export function dataValida(v: string) {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (!m) return false
  const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1
}

export function validarRelato(e: EntradaRelato, bruto: unknown): Validado<RespostaRelato> {
  if (!obj(bruto) || !Array.isArray(bruto.sugestoes) || (bruto.esclarecer !== undefined && !Array.isArray(bruto.esclarecer))) throw new ErroIA('resposta_invalida', 'Formato de resposta inesperado.')
  if (bruto.versao !== e.versao) throw new ErroIA('resposta_invalida', `Resposta da versão ${String(bruto.versao)}; esperada ${e.versao}.`)
  const campos = new Map(e.campos.map(c => [c.id, c])), descartes: string[] = []

  const esclarecer: PendenciaRelato[] = []
  for (const p of (bruto.esclarecer ?? []) as unknown[]) {
    const c = obj(p) && typeof p.campo === 'string' ? campos.get(p.campo) : undefined
    if (!obj(p) || !c) { descartes.push('pendência com campo desconhecido'); continue }
    if (esclarecer.some(x => x.campo === c.id)) { descartes.push(`${c.id}: pendência repetida`); continue }
    const nota = texto(p.nota, LIMITES.notaMax); if (!nota) { descartes.push(`${c.id}: pendência sem nota válida`); continue }
    const trechos = (Array.isArray(p.trechos) ? p.trechos : []).filter((t): t is string => typeof t === 'string')
    const literais = trechos.filter(t => literal(t, e.relato)).map(limpa)
    if (literais.length < trechos.length) descartes.push(`${c.id}: trecho da pendência não está no relato`)
    esclarecer.push({ campo: c.id, nota, trechos: literais })
  }

  let sugestoes: SugestaoRelato[] = []; const conflito = new Set<string>()
  for (const s of bruto.sugestoes as unknown[]) {
    const c = obj(s) && typeof s.campo === 'string' ? campos.get(s.campo) : undefined
    if (!obj(s) || !c) { descartes.push('sugestão com campo desconhecido'); continue }
    if (esclarecer.some(p => p.campo === c.id)) { descartes.push(`${c.id}: sugestão em conflito com pendência`); continue }
    const valor = typeof s.valor === 'string' ? s.valor : ''
    const outra = sugestoes.find(x => x.campo === c.id)
    if (outra) { if (outra.valor !== valor) conflito.add(c.id); descartes.push(`${c.id}: sugestão repetida`); continue }
    if (!valor || VALORES_SO_DO_USUARIO.includes(valor)) { descartes.push(`${c.id}: valor que só a pessoa pode declarar`); continue }
    if (c.tipo === 'opcao' ? !c.opcoes?.includes(valor) : !dataValida(valor)) { descartes.push(`${c.id}: valor fora das opções ("${valor}")`); continue }
    if (typeof s.trecho !== 'string' || !literal(s.trecho, e.relato)) { descartes.push(`${c.id}: trecho não está no relato`); continue }
    const nota = s.nota === undefined ? undefined : texto(s.nota, LIMITES.notaMax) ?? undefined
    sugestoes.push({ campo: c.id, valor, trecho: limpa(s.trecho), ...(nota ? { nota } : {}) })
  }
  // Valores diferentes para o mesmo campo: o modelo não decide, a pessoa preenche.
  if (conflito.size) { sugestoes = sugestoes.filter(s => !conflito.has(s.campo)); descartes.push(`valores conflitantes descartados: ${[...conflito].join(', ')}`) }
  // Fatos de outra pessoa não são atribuídos a quem usa a Ponte.
  if (sugestoes.some(s => s.campo === 'sujeito' && s.valor === OUTRA_PESSOA)) {
    const antes = sugestoes.length; sugestoes = sugestoes.filter(s => !CAMPOS_DA_PESSOA.includes(s.campo))
    if (sugestoes.length < antes) descartes.push('fatos de outra pessoa não atribuídos a você')
  }
  return { valor: { versao: e.versao, sugestoes, esclarecer }, descartes }
}

/* `aceitaRegras`: só a lista geral local (provedor simulado) pode se declarar 'regras' e dispensar a conferência
   das citações. Para qualquer outro provedor, o plano é tratado como do modelo. */
export function validarPlano(e: EntradaPlano, bruto: unknown, aceitaRegras = false): Validado<PlanoEdital> {
  if (!obj(bruto) || !Array.isArray(bruto.perguntas) || !Array.isArray(bruto.itens)) throw new ErroIA('resposta_invalida', 'Formato de plano inesperado.')
  if (bruto.edital !== e.edital.id) throw new ErroIA('resposta_invalida', `Plano do edital ${String(bruto.edital)}; esperado ${e.edital.id}.`)
  const origem = aceitaRegras && bruto.origem === 'regras' ? 'regras' : 'modelo', textoEdital = typeof bruto.textoEdital === 'string' ? bruto.textoEdital : ''
  const descartes: string[] = []

  /* undefined: sem fonte; null: fonte inválida (o item é descartado, pois afirmaria uma citação que não existe). */
  const fonte = (f: unknown, onde: string): Fonte | undefined | null => {
    if (f === undefined) return undefined
    if (!obj(f) || typeof f.trecho !== 'string') { descartes.push(`${onde}: fonte mal formada`); return null }
    if (origem === 'modelo' && !literal(f.trecho, textoEdital)) { descartes.push(`${onde}: trecho não encontrado no texto do edital`); return null }
    const local = texto(f.local, 60)
    return { trecho: limpa(f.trecho), ...(local ? { local } : {}) }
  }

  const perguntas: PerguntaPlano[] = []
  for (const q of (bruto.perguntas as unknown[]).slice(0, LIMITES.perguntasMax)) {
    const id = obj(q) && typeof q.id === 'string' && ID.test(q.id) ? q.id : ''
    if (!obj(q) || !id || perguntas.some(x => x.id === id)) { descartes.push(`pergunta sem id válido ou repetida (${id || '?'})`); continue }
    const grupo = texto(q.grupo, 60), txt = texto(q.texto, LIMITES.textoMax), ajuda = q.ajuda === undefined ? '' : texto(q.ajuda, LIMITES.notaMax)
    const opcoes = Array.isArray(q.opcoes) ? q.opcoes.map(o => texto(o, 60)) : []
    if (!grupo || !txt || ajuda === null) { descartes.push(`${id}: texto ausente ou longo demais`); continue }
    if (opcoes.some(o => !o) || new Set(opcoes).size !== opcoes.length || opcoes.length < LIMITES.opcoesMin || opcoes.length > LIMITES.opcoesMax) { descartes.push(`${id}: opções inválidas`); continue }
    const f = fonte(q.fonte, id); if (f === null) continue
    perguntas.push({ id, grupo, texto: txt, ...(ajuda ? { ajuda } : {}), opcoes: opcoes as string[], ...(f ? { fonte: f } : {}) })
  }

  const itens: ItemPlano[] = []
  for (const x of (bruto.itens as unknown[]).slice(0, LIMITES.itensMax)) {
    const id = obj(x) && typeof x.id === 'string' && ID.test(x.id) ? x.id : ''
    if (!obj(x) || !id) { descartes.push('item sem id válido'); continue }
    const tipo = x.tipo === 'documento' || x.tipo === 'passo' || x.tipo === 'confirmar' ? x.tipo : null
    if (!tipo || itens.some(i => i.id === id && i.tipo !== tipo)) { descartes.push(`${id}: tipo inválido ou diferente entre variantes`); continue }
    const titulo = texto(x.titulo, LIMITES.textoMax), detalhe = x.detalhe === undefined ? '' : texto(x.detalhe, LIMITES.notaMax), motivo = x.motivo === undefined ? '' : texto(x.motivo, LIMITES.notaMax)
    if (!titulo || detalhe === null || motivo === null || (tipo !== 'confirmar' && (!detalhe || !motivo))) { descartes.push(`${id}: título, detalhe ou motivo ausente ou longo demais`); continue }
    let quando: Condicao | undefined
    if (x.quando !== undefined) {
      const q = obj(x.quando) ? perguntas.find(p => p.id === (x.quando as Record<string, unknown>).pergunta) : undefined
      const resp = q && obj(x.quando) && Array.isArray(x.quando.respostas) ? x.quando.respostas : []
      if (!q || !resp.length || resp.some(r => typeof r !== 'string' || !q.opcoes.includes(r))) { descartes.push(`${id}: condição se refere a pergunta ou resposta inexistente`); continue }
      quando = { pergunta: q.id, respostas: resp as string[] }
    }
    // Links só se forem https e, no plano do modelo, aparecerem no próprio texto do edital.
    let link: ItemPlano['link']
    if (x.link !== undefined) {
      const l = obj(x.link) ? x.link : {}, rotulo = texto(l.rotulo, 60), url = typeof l.url === 'string' ? l.url.trim() : ''
      if (rotulo && /^https:\/\/[^\s]+$/.test(url) && (origem === 'regras' || textoEdital.includes(url))) link = { rotulo, url }
      else descartes.push(`${id}: link não verificável removido`)
    }
    const f = fonte(x.fonte, id); if (f === null) continue
    itens.push({ id, tipo, titulo, ...(detalhe ? { detalhe } : {}), ...(motivo ? { motivo } : {}), ...(f ? { fonte: f } : {}), ...(quando ? { quando } : {}), ...(link ? { link } : {}) })
  }

  if (!perguntas.length && !itens.length) throw new ErroIA('resposta_invalida', 'Plano vazio depois da validação.')
  return { valor: { edital: e.edital.id, origem, perguntas, itens }, descartes }
}
