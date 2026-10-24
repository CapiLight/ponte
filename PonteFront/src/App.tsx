import { useMemo, useRef, useState } from 'react'

/* Contrato conceitual (anotação técnica):
   caso = { modo, relato:{texto, versao}, fatos:{[id]:{valor, origem, trecho, estado, versao}}, ultimaMudanca }
   Fatos derivam do relato apenas por ação explícita "Analisar relato". Corrigir um fato NÃO chama o modelo.
   Resposta de análise com versao != relato.versao atual é descartada (não sobrescreve edição).
   Orientações e resumo são funções puras do estado atual dos fatos. Streamlit: st.session_state["caso"]. */

const URL_PAG = 'https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26'
const URL_ED = URL_PAG + '/sei_1956124_edital_01.pdf'
const URL_AN = URL_PAG + '/anexos-auxilio-emergencial-2026.pdf'
const EXEMPLO = 'No dia 10 de outubro de 2026, minha casa foi alagada. Precisei sair da minha residência e perdi meus documentos pessoais.'
const EXEMPLO_DOIS = 'Em 2023 houve um incêndio na casa da minha avó. No dia 10 de outubro de 2026, minha casa foi alagada e precisei sair da minha residência.'

type Estado = 'a_conferir' | 'confirmado' | 'informado' | 'nao_sei' | 'esclarecer'
/* origem: relato (sugestão com trecho literal), usuario (declaração direta) ou cenario (valor do protótipo a conferir). nota: explicação que não é citação. */
type Fato = { valor: string; origem: 'relato' | 'usuario' | 'cenario'; trecho?: string; nota?: string; estado: Estado }
type Fatos = Record<string, Fato | undefined>

const CAMPOS: { id: string; grupo: string; label: string; opts?: string[]; data?: boolean; opcional?: boolean }[] = [
  { id: 'sujeito', grupo: 'Acontecimento', label: 'A situação relatada aconteceu com você?', opts: ['Sim', 'Não, aconteceu com outra pessoa', 'Não sei'] },
  { id: 'evento', grupo: 'Acontecimento', label: 'Qual acontecimento você quer analisar?', opts: ['Alagação', 'Incêndio', 'Outro evento', 'Não sei'] },
  { id: 'saida', grupo: 'Saída da residência', label: 'Você precisou sair da sua própria residência por causa desse acontecimento?', opts: ['Sim', 'Não', 'Não sei'] },
  { id: 'data', grupo: 'Datas', label: 'Data do acontecimento', data: true },
  { id: 'ref', grupo: 'Datas', label: 'Data de referência para esta consulta', data: true },
  { id: 'docs', grupo: 'Documentos', label: 'Você perdeu documentos pessoais?', opts: ['Sim', 'Não', 'Não sei'] },
  { id: 'moradia', grupo: 'Documentos', label: 'Você tem dificuldade para apresentar comprovante de moradia ou contrato?', opts: ['Sim', 'Não', 'Não sei', 'Não quero informar'], opcional: true },
]
const ROT: Record<Estado, string> = { a_conferir: 'A conferir', confirmado: 'Confirmado por você', informado: 'Informado por você', nao_sei: 'Não sei', esclarecer: 'Precisa esclarecer' }
const COR: Record<Estado, string> = { a_conferir: 'text-amber-800', confirmado: 'text-emerald-800', informado: 'text-slate-600', nao_sei: 'text-slate-600', esclarecer: 'text-orange-800' }

const EXEMPLO_OUTRA = 'No dia 10 de outubro de 2026, a casa da minha tia foi alagada e ela precisou sair da residência dela.'
const REF_CENARIO: Fato = { valor: '24/10/2026', origem: 'cenario', nota: 'Preenchida com a data do cenário do protótipo.', estado: 'a_conferir' }
const CURTO: Record<string, string> = { sujeito: 'Aconteceu com você', evento: 'Acontecimento', saida: 'Saída da própria residência', data: 'Data do acontecimento', ref: 'Data de referência', docs: 'Perda de documentos pessoais', moradia: 'Dificuldade com comprovante de moradia' }

function parseData(s?: string) { const m = s?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (!m) return null; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? d : null }
function erroData(id: string, v: string, f: Fatos) {
  if (!v || v === 'Não sei') return ''
  const d = parseData(v); if (!d) return 'Use o formato DD/MM/AAAA, por exemplo 10/10/2026.'
  if (id === 'data') { const r = parseData(f.ref?.valor); if (r && d > r) return 'A data está depois da data de referência. Confira a data ou marque "Não sei".' }
  return ''
}

/* Simulação da análise (no produto: Gemma 4). Só retorna trechos literais do relato; explicações vão em "nota". */
function simularAnalise(t: string): Fatos {
  const f: Fatos = {}
  const trecho = (re: RegExp) => t.match(re)?.[0].trim()
  const sug = (id: string, valor: string, re: RegExp) => { const tr = trecho(re); if (tr) f[id] = { valor, origem: 'relato', trecho: tr, estado: 'a_conferir' } }
  const alag = /alagad/i.test(t), inc = /inc[eê]ndio/i.test(t)
  if (alag && inc) f.evento = { valor: '', origem: 'relato', nota: 'O relato menciona um incêndio e uma alagação. Escolha qual acontecimento será analisado.', estado: 'esclarecer' }
  else if (alag) sug('evento', 'Alagação', /[^.,]*foi alagad[ao]/i)
  else if (inc) sug('evento', 'Incêndio', /[^.,]*inc[eê]ndio[^.,]*/i)
  const outra = trecho(/(meu|minha) (pai|mãe|avó|avô|irmã|irmão|tia|tio|amiga|amigo)/i)
  if (outra && !/minha casa|minha residência|precisei/i.test(t)) f.sujeito = { valor: 'Não, aconteceu com outra pessoa', origem: 'relato', trecho: outra, estado: 'a_conferir' }
  else sug('sujeito', 'Sim', /minha casa|precisei|perdi/i)
  sug('saida', 'Sim', /precisei sair da minha residência/i)
  const m = t.match(/dia (\d{1,2}) de outubro de (\d{4})/i)
  if (m) f.data = { valor: `${m[1].padStart(2, '0')}/10/${m[2]}`, origem: 'relato', trecho: m[0], estado: 'a_conferir' }
  sug('docs', 'Sim', /perdi meus documentos pessoais/i)
  if (alag && inc) for (const k of ['data', 'saida']) { const x = f[k]; if (x) f[k] = { ...x, nota: 'No relato, esta informação aparece junto da alagação.' } }
  f.ref = { ...REF_CENARIO }
  return f
}

/* Frase natural para cada correção, mostrada junto ao resultado. */
function motivoCorrecao(id: string, v: string) {
  if (id === 'saida') return v === 'Não' ? 'você informou que não precisou sair da própria residência' : v === 'Sim' ? 'você informou que precisou sair da própria residência' : 'você indicou que não sabe se precisou sair da própria residência'
  const m: Record<string, string> = { sujeito: 'você corrigiu com quem a situação aconteceu', evento: 'você corrigiu qual acontecimento será analisado', data: 'você corrigiu a data do acontecimento', ref: 'você corrigiu a data de referência da consulta', docs: 'você corrigiu a informação sobre documentos perdidos', moradia: 'você corrigiu a informação sobre comprovante de moradia' }
  return m[id] ?? 'você corrigiu uma informação'
}
type Passo = { id: string; titulo: string; instrucao: string; motivo: string; depende: string[]; fonte: string; links?: [string, string][]; limite?: string; geral?: boolean }
type Pendencia = { t: string; acao?: string; campo?: string; editar?: boolean }
function derivar(f: Fatos) {
  const v = (id: string) => { const x = f[id]; return x && x.estado !== 'a_conferir' && x.estado !== 'esclarecer' ? x.valor : '' }
  const passos: Passo[] = [], esclarecer: Pendencia[] = [], perguntas: Passo[] = []
  const dataV = v('data'); const dataErro = dataV && dataV !== 'Não sei' ? erroData('data', dataV, f) : ''
  const dataOk = !!parseData(dataV) && !dataErro
  const ramo = v('sujeito') === 'Sim' && ['Alagação', 'Incêndio'].includes(v('evento')) && v('saida') === 'Sim'
  const fora = v('saida') === 'Não' || v('sujeito') === 'Não, aconteceu com outra pessoa' || v('evento') === 'Outro evento'
  const cobertura = fora ? { refs: [...(v('docs') === 'Sim' ? ['Item 6.8: trata de perda, roubo ou extravio de documentos.'] : []), 'Item 6.10: alternativa prevista no edital, não avaliada neste protótipo.'] } : null
  if (ramo && dataOk) passos.push({ id: 'separar', titulo: 'Separe os documentos que você já possui', instrucao: 'Reúna os documentos que ainda estão com você e anote quais foram perdidos, para levar ao atendimento.', motivo: 'O item 6.9 trata da situação de quem precisou sair da própria residência por evento adverso. Separar o que você tem organiza a preparação; não garante que a documentação seja suficiente para toda a inscrição.', depende: ['sujeito', 'evento', 'saida', 'data'], fonte: 'Edital Proaes 01/2026, item 6.9', links: [['Consultar o edital', URL_ED]] })
  passos.push({ id: 'anexos', titulo: 'Consulte os Anexos VI e VII e os comprovantes mencionados no edital', instrucao: 'Abra o pacote de anexos e leia as páginas 6 e 7. A Ponte não preenche os anexos.', motivo: 'Os anexos indicam declarações que podem ser pedidas. Esta orientação vale independentemente das informações declaradas.', depende: [], fonte: 'Anexos do Edital Proaes 01/2026, páginas 6 e 7', links: [['Consultar anexos', URL_AN]], geral: true })
  const dataPendente = ramo && f.data?.estado !== 'a_conferir' && !dataOk
  if (dataPendente) esclarecer.push(dataErro
    ? { t: 'A data do acontecimento está depois da data de referência. Confira as duas datas para que a condição de tempo deste recorte possa ser verificada.', acao: 'Conferir datas', campo: 'data', editar: true }
    : { t: 'Falta informar a data do acontecimento para conferir a condição de tempo deste recorte.', acao: 'Informar data', campo: 'data', editar: true })
  for (const c of CAMPOS) { const x = f[c.id]; if (c.opcional || (c.id === 'data' && dataPendente)) continue
    if (!x || (!x.valor && x.estado !== 'esclarecer')) esclarecer.push({ t: `Ainda não respondido: ${c.label}`, acao: 'Responder', campo: c.id, editar: true })
    else if (x.estado === 'a_conferir') esclarecer.push({ t: `Sugestão ainda não conferida: ${c.label}`, acao: 'Conferir', campo: c.id })
    else if (x.estado === 'esclarecer') esclarecer.push({ t: 'O relato menciona mais de um acontecimento. Escolha qual será analisado.', acao: 'Escolher', campo: c.id, editar: true })
    else if (x.valor === 'Não sei') esclarecer.push({ t: `Você respondeu "Não sei" para: ${c.label.replace(/\?$/, '')}. As orientações que dependem disso ficam gerais.`, acao: 'Responder', campo: c.id, editar: true }) }
  if (v('moradia') === 'Sim') perguntas.push({ id: 'q-moradia', titulo: 'Prepare uma pergunta para a Proaes sobre moradia', instrucao: 'Considerando a situação descrita no item 6.9, como devo apresentar a documentação de moradia mencionada no item 8.4?', motivo: 'Você informou dificuldade para apresentar comprovante de moradia ou contrato.', depende: ['moradia'], fonte: 'Edital Proaes 01/2026, itens 6.9 e 8.4', links: [['Consultar o edital', URL_ED]] })
  perguntas.push({ id: 'q-anexos', titulo: 'Pergunte qual versão dos anexos utilizar', instrucao: 'O Anexo VI menciona 2025/Edital 02/2025 no cabeçalho e 2026 na assinatura, e o Anexo VII inclui declaração de benefício anterior. Qual versão devo utilizar e como proceder se a declaração não corresponder ao meu caso?', motivo: 'Há uma diferença no pacote consultado. A Ponte não considera os anexos inválidos nem adapta datas.', depende: [], fonte: 'Anexos do Edital Proaes 01/2026, páginas 6 e 7', links: [['Consultar anexos', URL_AN]], limite: 'Pendência normativa: afeta a orientação dos anexos, não os demais passos.' })
  return { passos, esclarecer, perguntas, cobertura }
}

function resumoTexto(f: Fatos) {
  const d = derivar(f); const L: string[] = []
  L.push('Ponte: conferência preliminar (protótipo independente)', 'Edital: UFAC / Proaes, Edital 01/2026 – Auxílio Emergencial. Processo 23107.000688/2026-82. Fonte consultada em 24/10/2026.', `Data de referência: ${f.ref?.valor || 'não informada'}`, '', 'Fatos declarados:')
  CAMPOS.forEach(c => { const x = f[c.id]; if (x && x.valor && x.valor !== 'Não sei' && x.estado !== 'a_conferir' && x.estado !== 'nao_sei') L.push(`- ${c.label} ${x.valor} (${ROT[x.estado]})`) })
  L.push('', 'Fatos desconhecidos ou pendentes:'); CAMPOS.forEach(c => { const x = f[c.id]; if (!x || !x.valor || x.valor === 'Não sei' || x.estado === 'a_conferir' || x.estado === 'nao_sei' || x.estado === 'esclarecer') L.push(`- ${c.label} ${!x ? 'Não respondido' : x.estado === 'a_conferir' ? 'A conferir' : 'Não sei'}`) })
  L.push('', 'Próximos passos atuais:'); d.passos.forEach(p => L.push(`- ${p.titulo} (${p.fonte})`))
  L.push('', 'Perguntas para a Proaes:'); d.perguntas.forEach(p => L.push(`- ${p.instrucao}`))
  if (d.cobertura) L.push('', 'Este recorte não cobre essa combinação de informações. Referências conexas:', ...d.cobertura.refs.map(r => `- ${r}`))
  L.push('', `Página: ${URL_PAG}`, `Edital: ${URL_ED}`, `Anexos: ${URL_AN}`, '', 'Outros requisitos não foram avaliados. A análise e a decisão do pedido são da Proaes. Confirmar uma declaração não comprova o acontecimento nem aprova documentos.')
  return L.join('\n')
}

/* ---------- Componentes reutilizáveis ---------- */
const btnP = 'inline-flex items-center justify-center h-11 px-5 rounded-lg bg-[#1f5b47] text-white text-[15px] font-medium hover:bg-[#174636] transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
const btnS = 'inline-flex items-center justify-center h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-800 text-[15px] font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors'
const btnSm = 'inline-flex items-center h-9 px-3.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors'
const btnSmP = 'inline-flex items-center h-9 px-3.5 rounded-lg bg-[#1f5b47] text-sm font-medium text-white hover:bg-[#174636] transition-colors'
const LISTA = 'rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
const lnk = 'text-[#1f5b47] underline underline-offset-2 hover:text-[#174636]'
/* Links soltos e ações em lista: sublinhado só no hover. Links dentro de frases usam lnk (sempre sublinhado). */
const lnkAcao = 'font-medium text-[#1f5b47] no-underline hover:underline underline-offset-2 hover:text-[#174636] rounded-sm'

/* Etapas já visitadas podem ser reabertas; as seguintes ficam bloqueadas até o fluxo chegar nelas. */
function Etapas({ e, max, ir }: { e: number; max: number; ir: (n: number) => void }) {
  const n = ['Contexto do edital', 'Minha situação', 'Conferir informações', 'Próximos passos e resumo']
  return <nav aria-label="Etapas da tarefa">
    <div className="sm:hidden pb-3 flex items-center gap-2 text-sm"><label htmlFor="etapa-sel" className="shrink-0 text-slate-500">Etapa {e + 1} de 4:</label>
      <select id="etapa-sel" value={e} onChange={ev => ir(Number(ev.target.value))} className="min-h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 font-medium text-[#1f5b47]">{n.map((t, i) => <option key={t} value={i} disabled={i > max}>{t}</option>)}</select></div>
    <ol className="hidden sm:grid grid-cols-4 gap-4 text-sm">{n.map((t, i) => { const atual = i === e, livre = i <= max
      const cls = `block w-full text-left pb-2.5 pt-1 border-b-2 transition-colors ${atual ? 'border-[#1f5b47] text-[#1f5b47] font-medium' : i < e ? 'border-[#1f5b47]/25 text-slate-700' : livre ? 'border-slate-200 text-slate-700' : 'border-transparent text-slate-400'}`
      return <li key={t}>{livre && !atual
        ? <button type="button" onClick={() => ir(i)} className={`${cls} cursor-pointer hover:text-[#1f5b47] hover:border-[#1f5b47]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f5b47] rounded-sm`}>{t}</button>
        : <span aria-current={atual ? 'step' : undefined} aria-disabled={!livre || undefined} className={cls}>{t}</span>}</li> })}</ol>
  </nav>
}
function Selo({ s }: { s: Estado }) { return <span className={`text-sm ${COR[s]}`}>{ROT[s]}</span> }
/* Aviso único: informação, atenção e erro. Streamlit: st.info / st.warning / st.error */
const AVISO = { info: 'bg-[#e8f1ec] text-[#16392d]', atencao: 'bg-amber-50 text-amber-950', erro: 'bg-red-50 text-red-950' }
function Aviso({ tipo, titulo, children, className = '' }: { tipo: keyof typeof AVISO; titulo?: string; children?: React.ReactNode; className?: string }) {
  return <div role={tipo === 'erro' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-[15px] leading-relaxed ${AVISO[tipo]} ${className}`}>{titulo && <p className="font-medium">{titulo}</p>}{children && <div className={titulo ? 'mt-0.5' : ''}>{children}</div>}</div>
}
function Expansivel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <details className="group mt-3"><summary className="inline-flex items-center gap-1.5 cursor-pointer text-sm font-medium text-[#1f5b47] hover:underline underline-offset-2 list-none [&::-webkit-details-marker]:hidden"><span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>{titulo}</summary><div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 space-y-1.5">{children}</div></details>
}
function Opcoes({ nome, rotulo, opts, valor, onChange }: { nome: string; rotulo?: string; opts: string[]; valor?: string; onChange: (v: string) => void }) {
  return <div className="mt-2 flex flex-col" role="radiogroup" aria-label={rotulo}>{opts.map(o => <label key={o} className={`flex items-center gap-3 min-h-11 -mx-2 px-2 rounded-md cursor-pointer text-[15px] transition-colors hover:bg-slate-100/70 ${valor === o ? 'text-slate-900 font-medium' : 'text-slate-700'}`}><input type="radio" name={nome} checked={valor === o} onChange={() => onChange(o)} className="size-[18px] shrink-0 accent-[#1f5b47] cursor-pointer" />{o}</label>)}</div>
}
function CampoData({ id, valor, onChange, erro }: { id: string; valor: string; onChange: (v: string) => void; erro: string }) {
  return <div className="mt-2"><input id={id} inputMode="numeric" placeholder="DD/MM/AAAA" value={valor === 'Não sei' ? '' : valor} onChange={e => onChange(e.target.value)} aria-invalid={!!erro} className={`w-44 min-h-11 px-3 rounded-md border bg-white ${erro ? 'border-red-700' : 'border-slate-300'}`} />{erro && <p className="mt-1 text-sm text-red-800">{erro}</p>}</div>
}
function Orientacao({ p, f, destaque }: { p: Passo; f: Fatos; destaque?: boolean }) {
  return <article className={`rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${destaque ? 'border-[#1f5b47]/40' : 'border-slate-200'}`}>
    <h4 className="font-semibold">{p.titulo}</h4><p className="mt-1 text-slate-800">{p.instrucao}</p>
    {p.limite && <Aviso tipo="atencao" className="mt-3">{p.limite}</Aviso>}
    <Expansivel titulo="Ver fonte e motivo"><p><b>Motivo:</b> {p.motivo}</p><p><b>Depende de:</b> {p.depende.length ? p.depende.map(id => `${CURTO[id]}: ${f[id]?.valor || 'não respondido'}`).join('; ') : 'nenhuma informação específica; vale para qualquer caso deste edital.'}</p><p><b>Fonte:</b> {p.fonte}</p>{p.links?.map(([t, u]) => <p key={u}><a className={lnkAcao} href={u} target="_blank" rel="noreferrer">{t}<span className="sr-only"> (abre em nova aba)</span></a></p>)}</Expansivel>
  </article>
}

/* ---------- App ---------- */
export default function App() {
  const [etapa, setEtapa] = useState(0)
  const [modo, setModo] = useState<'' | 'relato' | 'perguntas'>('')
  const [erroModo, setErroModo] = useState(false)
  const [relato, setRelato] = useState(''); const [exemplo, setExemplo] = useState(false)
  const [analise, setAnalise] = useState<'idle' | 'carregando' | 'falha'>('idle'); const [erroRelato, setErroRelato] = useState('')
  const [simFalha, setSimFalha] = useState(false)
  const versao = useRef(0)
  const [relatoAnalisado, setRelatoAnalisado] = useState(''); const [confirmaReanalise, setConfirmaReanalise] = useState(false); const [sabeData, setSabeData] = useState('')
  const [fatos, setFatos] = useState<Fatos>({})
  const [editando, setEditando] = useState<Record<string, string>>({})
  const [mudanca, setMudanca] = useState<{ msg: string; retiradas: string[]; novas: string[] } | null>(null)
  const [limpar, setLimpar] = useState(false); const [copiado, setCopiado] = useState(''); const [copiadoDe, setCopiadoDe] = useState('')
  const pend = Object.keys(editando).length > 0
  const plano = useMemo(() => derivar(fatos), [fatos])
  const resumo = useMemo(() => resumoTexto(fatos), [fatos])
  const aConferir = CAMPOS.filter(c => fatos[c.id]?.estado === 'a_conferir' || fatos[c.id]?.estado === 'esclarecer').length
  const errosPerg = CAMPOS.filter(c => c.data).map(c => ({ c, msg: erroData(c.id, fatos[c.id]?.valor ?? '', fatos) })).filter(x => x.msg)
  const [mostrarErros, setMostrarErros] = useState(false)
  const [alcancada, setAlcancada] = useState(0)
  const ir = (n: number) => { setEtapa(n); setAlcancada(a => Math.max(a, n)); window.scrollTo(0, 0) }
  const sabeDataV = sabeData || (fatos.data?.valor === 'Não sei' ? 'Não sei' : fatos.data?.valor ? 'Sim' : '')
  const relatoMudou = modo === 'relato' && !!relatoAnalisado && relato !== relatoAnalisado
  const prefillRef = () => setFatos(f => f.ref ? f : { ...f, ref: { ...REF_CENARIO } })
  /* Leva ao fato na tela de conferência e, se pedido, já abre o controle de correção. */
  function irPara(campo?: string, editar?: boolean) {
    if (editar && campo && editando[campo] === undefined) setEditando(e => ({ ...e, [campo]: fatos[campo]?.valor === 'Não sei' ? '' : fatos[campo]?.valor ?? '' }))
    setEtapa(2); setAlcancada(a => Math.max(a, 2))
    setTimeout(() => { const el = campo ? document.getElementById('fato-' + campo) : null; if (el) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }) } else window.scrollTo(0, 0) }, 50)
  }

  function analisar(forcar = false) {
    if (analise === 'carregando') return
    if (!relato.trim()) { setErroRelato('Conte o que aconteceu ou escolha responder perguntas.'); return }
    const temRespostas = Object.values(fatos).some(x => x && x.origem !== 'cenario' && x.estado !== 'a_conferir' && x.estado !== 'esclarecer')
    if (temRespostas && !forcar) { setConfirmaReanalise(true); return }
    setConfirmaReanalise(false); setErroRelato(''); setAnalise('carregando'); const v = ++versao.current; const texto = relato
    setTimeout(() => { if (v !== versao.current) return // resposta atrasada descartada
      if (simFalha) { setAnalise('falha'); return }
      setFatos(simularAnalise(texto)); setRelatoAnalisado(texto); setAnalise('idle'); setEditando({}); setMudanca(null); ir(2) }, 1400)
  }
  function declarar(id: string, valor: string) { setFatos(f => { const n = { ...f }; if (!valor.trim()) delete n[id]; else n[id] = { valor, origem: 'usuario', estado: valor === 'Não sei' ? 'nao_sei' : 'informado' }; return n }) }
  function aplicar(id: string) {
    const novo = editando[id]; const base = fatos[id]
    const titulos = (x: Fatos) => { const d = derivar(x); return [...d.passos, ...d.perguntas].map(p => p.titulo) }
    const nf: Fatos = { ...fatos, [id]: { valor: novo, origem: base?.origem === 'relato' ? 'relato' : 'usuario', trecho: base?.trecho, estado: novo === 'Não sei' ? 'nao_sei' : base?.origem === 'relato' ? 'confirmado' : 'informado' } }
    // Relato com dois acontecimentos: data e saída do relato pertencem à alagação; não combinar com outro evento.
    if (id === 'evento' && base?.estado === 'esclarecer') for (const k of ['data', 'saida']) { const x = nf[k]; if (x?.origem !== 'relato') continue
      nf[k] = novo === 'Alagação' ? { ...x, estado: 'a_conferir', nota: 'No relato, esta informação aparece junto da alagação. Confira.' } : { valor: '', origem: 'usuario', nota: 'O valor do relato se referia à alagação. Informe o valor referente ao incêndio.', estado: 'a_conferir' } }
    setFatos(nf); setEditando(e => { const { [id]: _, ...r } = e; return r })
    const antes = titulos(fatos), depois = titulos(nf)
    setMudanca({ msg: `Os próximos passos foram atualizados porque ${motivoCorrecao(id, novo)}.`, retiradas: antes.filter(t => !depois.includes(t)), novas: depois.filter(t => !antes.includes(t)) })
  }
  function reset() { versao.current++; setEtapa(0); setAlcancada(0); setModo(''); setRelato(''); setExemplo(false); setFatos({}); setEditando({}); setMudanca(null); setAnalise('idle'); setLimpar(false); setCopiado(''); setCopiadoDe(''); setRelatoAnalisado(''); setConfirmaReanalise(false); setSabeData(''); setMostrarErros(false); setErroRelato('') }
  async function copiar() { try { await navigator.clipboard.writeText(resumo); setCopiado('ok'); setCopiadoDe(resumo) } catch { setCopiado('falha') } }

  /* Fato revisável: usado em Conferir e no plano. Chamado como função (não como componente) para o campo não perder o foco ao digitar. */
  function fatoRevisavel(c: typeof CAMPOS[number]) {
    const x = fatos[c.id]; const ed = editando[c.id] !== undefined; const err = c.data && ed ? erroData(c.id, editando[c.id], fatos) : ''
    return <div key={c.id} id={'fato-' + c.id} tabIndex={-1} className={`p-5 ${x?.estado === 'a_conferir' || x?.estado === 'esclarecer' ? 'bg-amber-50/60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{c.label}{c.opcional && <span className="font-normal text-slate-600"> (opcional)</span>}</p>{x ? <Selo s={x.estado} /> : <span className="text-sm text-slate-500">Não respondido</span>}</div>
      {x?.valor && !ed && <p className="mt-1 text-[17px] text-slate-900">{x.valor}{c.id === 'evento' && x.valor === 'Outro evento' && fatos.eventoDesc?.valor ? `: ${fatos.eventoDesc.valor}` : ''}</p>}
      {x?.trecho && <p className="mt-1.5 text-sm text-slate-600">Do seu relato: <span className="text-slate-800">“{x.trecho}”</span></p>}{x?.nota && <p className="mt-1.5 text-sm text-slate-600">{x.nota}</p>}
      {x?.valor === 'Não, aconteceu com outra pessoa' && <p className="mt-2 text-sm">Fatos de outra pessoa não são atribuídos a você.</p>}
      {ed && <div className="mt-2">{c.opts ? <Opcoes rotulo={c.label} nome={'ed-' + c.id} opts={c.opts} valor={editando[c.id]} onChange={v => setEditando(e => ({ ...e, [c.id]: v }))} /> : <><CampoData id={'ed-' + c.id} valor={editando[c.id]} erro={err} onChange={v => setEditando(e => ({ ...e, [c.id]: v }))} /><label className="mt-2 flex gap-2 text-sm items-center"><input type="checkbox" className="accent-[#1f5b47]" checked={editando[c.id] === 'Não sei'} onChange={e => setEditando(s => ({ ...s, [c.id]: e.target.checked ? 'Não sei' : '' }))} />Não sei</label></>}
        {c.id === 'evento' && editando.evento === 'Outro evento' && <div className="mt-3"><label htmlFor="ed-eventoDesc" className="block text-sm font-medium">Descreva brevemente o acontecimento</label><input id="ed-eventoDesc" maxLength={80} value={fatos.eventoDesc?.valor ?? ''} onChange={e => declarar('eventoDesc', e.target.value)} className="mt-1 w-full max-w-md min-h-11 px-3 rounded-md border border-slate-300 bg-white" /><p className="mt-1 text-xs text-slate-500">Não é preciso usar termos do edital.</p></div>}
        <p className="mt-2 text-sm font-medium text-amber-900">Alteração ainda não aplicada</p>
        <div className="mt-2 flex flex-wrap gap-2"><button className={btnP} disabled={!editando[c.id] || !!err} onClick={() => aplicar(c.id)}>Aplicar correção</button><button className={btnSm} onClick={() => setEditando(e => { const { [c.id]: _, ...r } = e; return r })}>Descartar</button></div></div>}
      {!ed && <div className="mt-3 flex flex-wrap gap-2">
        {x?.estado === 'a_conferir' && x.valor && <button className={btnSmP} onClick={() => setFatos(f => ({ ...f, [c.id]: { ...x, estado: 'confirmado' } }))}>{c.id === 'ref' ? 'Confirmar data' : 'Confirmar'}</button>}
        <button className={btnSm} onClick={() => setEditando(e => ({ ...e, [c.id]: x?.valor ?? '' }))}>{x?.estado === 'esclarecer' ? 'Escolher acontecimento' : x ? 'Corrigir' : 'Responder'}</button>
        {x?.estado === 'a_conferir' && x.valor && <button className={btnSm} onClick={() => setFatos(f => ({ ...f, [c.id]: { ...x, valor: 'Não sei', estado: 'nao_sei' } }))}>Não sei</button>}</div>}
    </div>
  }
  const grupos = [...new Set(CAMPOS.map(c => c.grupo))]

  const Contexto = <div className="text-sm">
    <p className="text-[15px] font-medium text-slate-900">Edital 01/2026, Auxílio Emergencial</p><p className="mt-0.5 text-slate-600">Proaes, Universidade Federal do Acre</p>
    <dl className="mt-4 space-y-3"><div><dt className="text-xs text-slate-500">Processo</dt><dd className="mt-0.5 text-slate-800">23107.000688/2026-82</dd></div><div><dt className="text-xs text-slate-500">Inscrições</dt><dd className="mt-0.5 text-slate-800">Consulte a página oficial</dd></div><div><dt className="text-xs text-slate-500">O que este protótipo cobre</dt><dd className="mt-0.5 text-slate-800">Orientações parciais sobre saída da residência por evento adverso e perda de documentos pessoais.</dd></div></dl>
    <div className="mt-5 pt-4 border-t border-slate-200"><h3 className="text-sm font-medium text-slate-900">Fontes</h3><ul className="mt-2 space-y-1.5"><li><a className={lnkAcao} href={URL_PAG} target="_blank" rel="noreferrer">Abrir página do edital<span className="sr-only"> (abre em nova aba)</span></a></li><li><a className={lnkAcao} href={URL_ED} target="_blank" rel="noreferrer">Consultar o edital<span className="sr-only"> (abre em nova aba)</span></a></li><li><a className={lnkAcao} href={URL_AN} target="_blank" rel="noreferrer">Consultar anexos<span className="sr-only"> (abre em nova aba)</span></a></li></ul><p className="mt-2 text-xs text-slate-500">Consultadas em 24/10/2026 (dado do cenário de protótipo).</p></div>
    <p className="mt-4 pt-4 border-t border-slate-200 text-slate-600">Outros requisitos não foram avaliados. A análise do pedido é da Proaes.</p></div>

  return <div className="min-h-screen">
    <header className="bg-white border-b border-slate-200"><div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5"><span className="text-xl font-semibold text-[#1f5b47]">Ponte</span><span className="text-sm text-slate-700">Preparação documental com fontes</span></div><span className="text-xs text-slate-500">Protótipo independente, com dados fictícios</span></div>
      <div className="max-w-6xl mx-auto px-4 sm:pt-1"><Etapas e={etapa} max={alcancada} ir={ir} /></div></header>
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10 grid gap-8 lg:gap-12 lg:grid-cols-[1fr_300px]">
      <section className="min-w-0 space-y-6 [&>section]:mt-10 [&>fieldset]:mt-10">
        {etapa > 0 && <details className="lg:hidden rounded-md border border-slate-200 bg-white p-3"><summary className="cursor-pointer font-medium">Edital 01/2026 da Proaes: contexto e fontes</summary><div className="mt-3">{Contexto}</div></details>}

        {etapa === 0 && <>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">Prepare seus próximos passos</h1><p className="-mt-3 text-slate-700">Conte sua situação, confira as informações e consulte orientações com a fonte ao lado.</p>
          <div className="lg:hidden rounded-md border border-slate-200 bg-white p-4">{Contexto}</div>
          <fieldset className="space-y-3"><legend className="font-semibold mb-2">Como você prefere começar?</legend>
            {erroModo && <p className="text-sm text-red-800">Escolha uma forma de começar.</p>}
            {([['relato', 'Quero contar minha situação', 'Você escreve com suas palavras. A organização das informações é uma simulação de IA neste protótipo.'], ['perguntas', 'Prefiro responder perguntas', 'Você responde diretamente às mesmas informações.']] as const).map(([k, t, d]) => <label key={k} className={`flex gap-3 p-4 rounded-lg border cursor-pointer bg-white ${modo === k ? 'border-[#1f5b47] ring-1 ring-[#1f5b47]' : 'border-slate-200'}`}><input type="radio" name="modo" className="mt-1 accent-[#1f5b47]" checked={modo === k} onChange={() => { setModo(k); setErroModo(false) }} /><span><span className="font-medium block">{t}</span><span className="text-sm text-slate-700">{d}</span></span></label>)}</fieldset>
          <button className={btnP} onClick={() => { if (!modo) return setErroModo(true); if (modo === 'perguntas') prefillRef(); ir(1) }}>Continuar</button>
          <Expansivel titulo="Entender o que este protótipo avalia"><p>A Ponte faz uma conferência preliminar de um recorte do Edital 01/2026: saída da própria residência por evento adverso e perda de documentos pessoais. Não avalia renda, composição familiar nem outros requisitos. Não envia pedidos. A instituição analisa e decide.</p></Expansivel>
        </>}

        {etapa === 1 && modo === 'relato' && <>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">Minha situação</h1>
          {exemplo && <p className="inline-block text-sm font-medium bg-slate-200 rounded px-2 py-1">Exemplo fictício</p>}
          <div><label htmlFor="relato" className="font-medium block">O que aconteceu?</label><p id="ajuda" className="text-sm text-slate-700 mt-1">Conte o que ocorreu com você, se precisou sair da própria residência e quando aconteceu. Não inclua CPF, matrícula, endereço completo ou documentos pessoais.</p>
            {erroRelato && <p className="mt-2 text-sm text-red-800 font-medium">{erroRelato}</p>}
            <textarea id="relato" aria-describedby="ajuda" rows={6} readOnly={analise === 'carregando'} value={relato} onChange={e => { setRelato(e.target.value); setExemplo(false) }} placeholder="Ex.: Minha casa foi atingida por... e precisei..." className={`mt-2 w-full rounded-lg border bg-white p-3 leading-relaxed ${erroRelato ? 'border-red-700' : 'border-slate-300'}`} /></div>
          <div className="flex flex-wrap gap-2"><button className={btnS} onClick={() => { setRelato(EXEMPLO); setExemplo(true); setErroRelato('') }}>Usar exemplo fictício</button><button className={btnS} onClick={() => { setRelato(EXEMPLO_DOIS); setExemplo(true) }}>Exemplo com dois acontecimentos</button><button className={btnS} onClick={() => { setRelato(EXEMPLO_OUTRA); setExemplo(true); setErroRelato('') }}>Exemplo sobre outra pessoa</button></div>
          {analise === 'carregando' && <p role="status" className="flex items-center gap-2 text-[#1f5b47] font-medium"><span className="w-4 h-4 border-2 border-[#1f5b47] border-t-transparent rounded-full animate-spin" />Organizando as informações do relato</p>}
          {analise === 'falha' && <Aviso tipo="erro" titulo="Não foi possível organizar o relato agora.">Você pode responder às perguntas. Seu texto foi mantido.<div className="mt-3 flex flex-wrap gap-2"><button className={btnP} onClick={() => { setModo('perguntas'); setAnalise('idle'); prefillRef() }}>Responder perguntas</button><button className={btnS} onClick={() => analisar()}>Tentar novamente</button></div></Aviso>}
          {relatoMudou && !confirmaReanalise && analise !== 'carregando' && <Aviso tipo="atencao" titulo="O relato mudou depois da análise">As informações em "Conferir informações" ainda vêm da versão anterior. Para usar o texto atual, analise de novo e confira as sugestões outra vez.</Aviso>}
          {confirmaReanalise && <Aviso tipo="atencao" titulo="Analisar de novo substitui as informações atuais">As respostas que você já conferiu ou corrigiu serão trocadas pelas novas sugestões, que precisarão ser conferidas outra vez.<div className="mt-3 flex flex-wrap gap-2"><button className={btnP} onClick={() => analisar(true)}>Analisar e conferir de novo</button><button className={btnS} onClick={() => setConfirmaReanalise(false)}>Manter informações atuais</button></div></Aviso>}
          <div className="flex flex-wrap gap-3 items-center"><button className={btnS} onClick={() => { if (analise === 'carregando') { versao.current++; setAnalise('idle') } ir(0) }}>Voltar</button><button className={btnP} disabled={analise === 'carregando'} onClick={() => analisar()}>Analisar relato</button></div>
        </>}

        {etapa === 1 && modo === 'perguntas' && <>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">Minha situação</h1><p className="-mt-3 text-slate-700">Responda o que souber. "Não sei" é uma resposta válida. Você pode continuar mesmo com perguntas em branco.</p>
          {mostrarErros && errosPerg.length > 0 && <Aviso tipo="erro" titulo={errosPerg.length === 1 ? 'Corrija uma informação para continuar' : `Corrija ${errosPerg.length} informações para continuar`}><ul className="mt-1 space-y-1">{errosPerg.map(({ c, msg }) => <li key={c.id}><button className={lnk} onClick={() => document.getElementById(c.id)?.focus()}>{c.label}</button>: {msg}</li>)}</ul><p className="mt-2 text-sm">O que você já respondeu foi mantido. "Não sei" também é uma resposta válida.</p></Aviso>}
          {relato && <p className="text-sm text-slate-700">Seu relato foi preservado e pode ser retomado em <button className={lnk} onClick={() => setModo('relato')}>Contar minha situação</button>.</p>}
          {grupos.map(g => <fieldset key={g}><legend className="text-lg font-semibold mb-3">{g}</legend><div className={LISTA}>{CAMPOS.filter(c => c.grupo === g).map(c => { const x = fatos[c.id]; const err = c.data ? erroData(c.id, x?.valor ?? '', fatos) : ''
            if (c.id === 'data') return <div key={c.id} className="p-5"><p className="font-medium">Você sabe a data desse acontecimento?</p><Opcoes rotulo="Você sabe a data desse acontecimento?" nome="sabeData" opts={['Sim', 'Não sei']} valor={sabeDataV} onChange={v => { setSabeData(v); declarar('data', v === 'Não sei' ? 'Não sei' : x?.valor === 'Não sei' ? '' : x?.valor ?? '') }} />
              {sabeDataV === 'Sim' && <div className="mt-4"><label htmlFor="data" className="block font-medium">Data do acontecimento</label><CampoData id="data" valor={x?.valor ?? ''} erro={err} onChange={v => declarar('data', v)} /></div>}</div>
            return <div key={c.id} className="p-5"><p className="font-medium">{c.label}{c.opcional && <span className="font-normal text-slate-600"> (opcional)</span>}</p>
              {c.id === 'ref' && <p className="text-sm text-slate-600">{x?.estado === 'a_conferir' ? 'Preenchida com a data do cenário do protótipo. Confira e altere se necessário.' : 'Usada para conferir as condições de tempo do recorte.'}</p>}
              {c.opts ? <Opcoes rotulo={c.label} nome={c.id} opts={c.opts} valor={x?.valor} onChange={v => declarar(c.id, v)} /> : <><CampoData id={c.id} valor={x?.valor ?? ''} erro={err} onChange={v => declarar(c.id, v)} />{c.id === 'ref' && x?.estado === 'a_conferir' && <button className={`${btnSm} mt-2`} onClick={() => setFatos(f => ({ ...f, ref: { ...f.ref!, estado: 'confirmado' } }))}>Confirmar esta data</button>}</>}
              {c.id === 'evento' && x?.valor === 'Outro evento' && <div className="mt-3"><label htmlFor="eventoDesc" className="block text-sm font-medium">Descreva brevemente o acontecimento</label><input id="eventoDesc" maxLength={80} value={fatos.eventoDesc?.valor ?? ''} onChange={e => declarar('eventoDesc', e.target.value)} className="mt-1 w-full max-w-md min-h-11 px-3 rounded-md border border-slate-300 bg-white" /><p className="mt-1 text-xs text-slate-500">Não é preciso usar termos do edital.</p></div>}
            </div> })}</div></fieldset>)}
          <div className="flex flex-wrap gap-3"><button className={btnS} onClick={() => ir(0)}>Voltar</button><button className={btnP} onClick={() => { if (errosPerg.length) { setMostrarErros(true); window.scrollTo({ top: 0 }); return } setMostrarErros(false); ir(2) }}>Revisar informações</button></div>
        </>}

        {etapa === 2 && <>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">Confira o que será usado na orientação</h1>
          {relatoMudou && <Aviso tipo="atencao" titulo="O relato mudou depois da análise">As sugestões abaixo vêm da versão anterior do relato. <button className={lnk} onClick={() => ir(1)}>Voltar ao relato</button> para analisar o texto atual.</Aviso>}
          {aConferir > 0 ? <Aviso tipo="atencao" titulo={`Informações a conferir: ${aConferir}`}>Leia cada sugestão e confirme, corrija ou marque "Não sei".</Aviso> : <p className="text-sm text-slate-700">Nenhuma sugestão aguardando conferência.</p>}
          {grupos.map(g => <section key={g}><h2 className="text-lg font-semibold mb-3">{g}</h2><div className={LISTA}>{CAMPOS.filter(c => c.grupo === g).map(c => fatoRevisavel(c))}</div></section>)}
          <div className="flex flex-wrap gap-3"><button className={btnS} onClick={() => ir(1)}>{modo === 'relato' ? 'Voltar ao relato' : 'Voltar às perguntas'}</button><button className={btnP} onClick={() => ir(3)}>Ver próximos passos</button></div>
        </>}

        {etapa === 3 && <>
          <div className="flex flex-wrap justify-between gap-2"><h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">Próximos passos para preparar seu atendimento</h1><button className={btnS} onClick={() => ir(2)}>Editar informações</button></div>
          <p className="-mt-3 text-[15px] text-slate-600">Edital Proaes 01/2026. Conferência preliminar com base nas informações que você declarou; não substitui a análise da Proaes.</p>
          <div><h2 className="mb-1 text-sm font-medium text-slate-600">Informações usadas nesta orientação</h2><dl className="grid gap-x-8 text-sm sm:grid-cols-2">{CAMPOS.map(c => { const x = fatos[c.id]; return <div key={c.id} className="flex justify-between gap-4 border-b border-slate-200 py-2"><dt className="text-slate-600">{CURTO[c.id]}</dt><dd className="text-right text-slate-900">{!x || !x.valor ? <span className="text-slate-500">{x?.estado === 'esclarecer' ? 'A escolher' : 'Não respondido'}</span> : x.estado === 'a_conferir' ? <span className="text-amber-800">{x.valor} (a conferir)</span> : <>{x.valor}{c.id === 'evento' && x.valor === 'Outro evento' && fatos.eventoDesc?.valor ? `: ${fatos.eventoDesc.valor}` : ''}</>}</dd></div> })}</dl></div>
          <section><h2 className="text-lg font-semibold">Revise uma informação</h2><p className="mt-0.5 text-sm text-slate-600">Se algo estiver diferente, corrija aqui. Os próximos passos se ajustam sem nova análise do relato.</p><div className={`mt-3 ${LISTA}`}>{[CAMPOS[2], ...CAMPOS.filter(c => c.id !== 'saida' && editando[c.id] !== undefined)].map(c => fatoRevisavel(c))}</div></section>
          {mudanca && !pend && <Aviso tipo="info" titulo={mudanca.msg}>{(mudanca.retiradas.length > 0 || mudanca.novas.length > 0) && <Expansivel titulo="O que mudou (registro)">{mudanca.retiradas.length > 0 && <p>Orientação retirada, não está mais ativa: <s>{mudanca.retiradas.join('; ')}</s></p>}{mudanca.novas.length > 0 && <p>Orientação nova: {mudanca.novas.join('; ')}</p>}</Expansivel>}</Aviso>}
          <section className="space-y-3"><h2 className="text-lg font-semibold">Passos com base no que você informou</h2>
            {plano.cobertura && <Aviso tipo="info" titulo="Este recorte não cobre essa combinação de informações">Isso não é uma decisão sobre o seu pedido. Consulte a Proaes; estas referências do edital podem ajudar:<ul className="mt-1 list-disc pl-5">{plano.cobertura.refs.map(r => <li key={r}>{r}</li>)}</ul></Aviso>}
            {plano.passos.filter(p => !p.geral).map(p => <Orientacao key={p.id} p={p} f={fatos} destaque />)}
            {!plano.cobertura && !plano.passos.some(p => !p.geral) && <p className="text-[15px] text-slate-600">Nenhum passo personalizado com as informações atuais. Veja abaixo o que ainda pode ser esclarecido.</p>}
            <h3 className="pt-3 text-[15px] font-semibold text-slate-800">Para qualquer caso deste edital</h3>
            {plano.passos.filter(p => p.geral).map(p => <Orientacao key={p.id} p={p} f={fatos} />)}</section>
          <section className="space-y-2"><h2 className="text-lg font-semibold">Informações que você ainda pode esclarecer</h2>{plano.esclarecer.length === 0 ? <p className="text-sm">Nada pendente neste recorte.</p> : <ul className={LISTA}>{plano.esclarecer.map((e, i) => <li key={i} className="px-4 py-3 text-sm flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><span>{e.t}</span>{e.acao && <button className={`${lnkAcao} shrink-0 whitespace-nowrap`} onClick={() => irPara(e.campo, e.editar)}>{e.acao}</button>}</li>)}</ul>}</section>
          <section className="space-y-3"><h2 className="text-lg font-semibold">Perguntas para a Proaes</h2>{plano.perguntas.map(p => <Orientacao key={p.id} p={p} f={fatos} />)}</section>
          <section className="space-y-2 border-t border-slate-200 pt-5"><h2 className="text-lg font-semibold">Resumo</h2>
            {pend ? <Aviso tipo="atencao" titulo="Alteração ainda não aplicada">Aplique ou descarte a correção em "Revise uma informação", acima, para ver o resumo atualizado.</Aviso> : <>
              <label htmlFor="resumo" className="text-sm text-slate-700">Selecione o texto e copie, ou use o botão.</label>
              <textarea id="resumo" readOnly rows={14} value={resumo} className="w-full rounded-md border border-slate-300 bg-slate-50 p-4 text-sm leading-relaxed" onFocus={e => e.target.select()} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><button className={btnP} onClick={copiar}>Copiar resumo</button>{copiado === 'ok' && copiadoDe === resumo && <span role="status" className="text-sm">Resumo copiado. Um texto já copiado não é atualizado por correções posteriores.</span>}{copiado === 'ok' && copiadoDe !== resumo && <span role="status" className="text-sm text-amber-900">O resumo mudou depois da última cópia. Copie de novo para levar a versão atual.</span>}{copiado === 'falha' && <span role="status" className="text-sm">Não foi possível copiar. Selecione o texto e copie.</span>}</div></>}
          </section>
          <section className="border-t border-slate-200 pt-4">{!limpar ? <button className={btnS} onClick={() => setLimpar(true)}>Começar outro caso</button> : <div className="rounded-md border border-slate-300 bg-white p-4"><p>Isso apaga as informações deste caso. Nada fica salvo após fechar a sessão.</p><div className="mt-3 flex flex-wrap gap-2"><button className={btnP} onClick={reset}>Apagar e começar</button><button className={btnS} onClick={() => setLimpar(false)}>Manter caso atual</button></div></div>}</section>
        </>}
      </section>
      <aside className="hidden lg:block"><div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xs font-medium text-slate-500 mb-2">Edital em uso</h2>{Contexto}</div></aside>
    </main>
    {/* Controles só para demonstrar estados do protótipo; não fazem parte do produto. */}
    <footer className="max-w-6xl mx-auto px-4 pb-10"><div className="pt-5 border-t border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500"><span>Controles de demonstração do protótipo</span><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-[#1f5b47]" checked={simFalha} onChange={e => setSimFalha(e.target.checked)} />Simular falha na organização do relato</label></div></footer>
  </div>
}
