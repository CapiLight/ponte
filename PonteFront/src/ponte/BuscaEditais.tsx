import { useEffect, useMemo, useRef, useState } from 'react'
import { AREAS, EDITAIS, HOJE, HOJE_ORIGEM, INST, INSTITUICOES, ficticio, dia, fmt, fmtCurto, real, situacao, type Edital, type Situacao } from './editais'
import { derivarPreparo, planoRegras } from './preparo'
import { useSalvo } from './persistencia'

/* Mesma linguagem visual da Ponte (verde #1f5b47, superfícies brancas com borda slate). */
const btnP = 'inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#1f5b47] text-white text-sm font-medium hover:bg-[#174636] transition-colors'
const btnS = 'inline-flex items-center justify-center h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
const campo = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 hover:border-slate-400'
const rotulo = 'block text-xs font-medium text-slate-600 mb-1'
const lnkAcao = 'text-sm font-medium text-[#1f5b47] hover:underline underline-offset-2 rounded-sm'

type Coord = { lat: number; lng: number }
function km(a: Coord, b: Coord) {
  const r = (x: number) => (x * Math.PI) / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
const distTxt = (d: number) => (d < 1 ? 'menos de 1 km' : `${Math.round(d).toLocaleString('pt-BR')} km`)

const ORDENS = [
  ['recentes', 'Mais recentes'], ['prazo', 'Prazo de inscrição mais próximo'], ['area', 'Área'], ['centro', 'Centro ou unidade'],
  ['instituicao', 'Instituição'], ['valor', 'Maior valor de bolsa'], ['vagas', 'Mais vagas'], ['distancia', 'Distância (mais perto primeiro)'],
] as const
type Ordem = (typeof ORDENS)[number][0]
const SITUACOES = [['ativos', 'Abertos e em breve'], ['aberto', 'Abertos'], ['em_breve', 'Em breve'], ['encerrado', 'Encerrados'], ['todos', 'Todos']] as const
type FiltroSit = (typeof SITUACOES)[number][0]
const RANK: Record<Situacao, number> = { aberto: 0, em_breve: 1, encerrado: 2 }
const UFS = [...new Set(INSTITUICOES.map(i => i.uf))].sort()
/* Sem localização do aparelho, a pessoa pode usar uma cidade do catálogo como ponto de partida das distâncias. */
const COORD_CIDADE: Record<string, Coord> = Object.fromEntries(INSTITUICOES.map(i => [`${i.cidade}, ${i.uf}`, { lat: i.lat, lng: i.lng }]))
const CIDADES_REF = Object.keys(COORD_CIDADE).sort((a, b) => a.localeCompare(b, 'pt-BR'))
const Chevron = ({ aberto }: { aberto: boolean }) => <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 shrink-0 text-slate-500 transition-transform ${aberto ? 'rotate-180' : ''}`}><path fill="currentColor" d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" /></svg>
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function Selo({ e }: { e: Edital }) {
  const s = situacao(e), falta = dia(e.fim) - dia(HOJE)
  if (s === 'aberto' && falta <= 7) return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900"><span className="size-1.5 rounded-full bg-amber-500" />{falta === 0 ? 'Encerra hoje' : `Encerra em ${falta} ${falta === 1 ? 'dia' : 'dias'}`}</span>
  const m = { aberto: ['bg-[#e8f1ec] text-[#16392d]', 'bg-[#1f5b47]', 'Inscrições abertas'], em_breve: ['bg-sky-50 text-sky-900', 'bg-sky-500', `Abre em ${fmtCurto(e.inicio)}`], encerrado: ['bg-slate-100 text-slate-600', 'bg-slate-400', 'Encerrado'] }[s]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${m[0]}`}><span className={`size-1.5 rounded-full ${m[1]}`} />{m[2]}</span>
}

const Seta = ({ esq }: { esq?: boolean }) => <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 ${esq ? 'rotate-180' : ''}`}><path fill="currentColor" d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4Z" /></svg>
const LISTA = 'rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden'
const Tag = ({ e }: { e: Edital }) => <>{e.guiado && <span className="rounded-full border border-[#1f5b47]/30 px-2.5 py-0.5 text-xs font-medium text-[#1f5b47]">Orientação guiada na Ponte</span>}</>

/* O cartão inteiro abre o edital (botão do título estendido); o link externo fica acima da camada clicável. */
function CartaoEdital({ e, dist, onAbrir }: { e: Edital; dist?: number; onAbrir: () => void }) {
  const i = INST[e.inst], enc = situacao(e) === 'encerrado'
  return <article className={`group relative rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:shadow-[0_4px_14px_rgba(16,24,40,0.08)] has-[button:focus-visible]:outline-3 has-[button:focus-visible]:outline-offset-2 has-[button:focus-visible]:outline-[#1f5b47] ${e.guiado ? 'border-[#1f5b47]/40 hover:border-[#1f5b47]/70' : 'border-slate-200 hover:border-slate-300'}`}>
    <div className="flex flex-wrap items-center gap-2"><Selo e={e} /><Tag e={e} /></div>
    <h3 className={`mt-3 text-[17px] font-semibold leading-snug ${enc ? 'text-slate-600' : 'text-slate-900'}`}><button onClick={onAbrir} className="text-left outline-none group-hover:text-[#1f5b47] after:absolute after:inset-0 after:rounded-xl after:content-['']">{e.titulo}</button></h3>
    <p className="text-sm text-slate-600">{e.numero} · {e.centro}</p>
    <p className="mt-2 text-[15px] text-slate-800">{e.resumo}</p>
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
      <div className="col-span-2"><dt className="text-xs text-slate-500">Instituição</dt><dd className="text-slate-900">{i.sigla} · {i.campus}<span className="block text-slate-600">{i.cidade}, {i.uf}{dist !== undefined && ` · ${distTxt(dist)}`}</span></dd></div>
      <div><dt className="text-xs text-slate-500">Inscrições</dt><dd className="text-slate-900">{fmtCurto(e.inicio)} a {fmt(e.fim)}</dd></div>
      <div><dt className="text-xs text-slate-500">Área</dt><dd className="text-slate-900">{e.area}</dd></div>
      <div><dt className="text-xs text-slate-500">Tipo</dt><dd className="text-slate-900">{e.tipo}</dd></div>
      <div><dt className="text-xs text-slate-500">Público</dt><dd className="text-slate-900">{e.publico}</dd></div>
      <div><dt className="text-xs text-slate-500">Valor</dt><dd className="text-slate-900">{e.valor ? `${real(e.valor)}/mês` : 'Consulte o edital'}</dd></div>
      <div><dt className="text-xs text-slate-500">Vagas</dt><dd className="text-slate-900">{e.vagas ?? 'Consulte o edital'}</dd></div>
    </dl>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-slate-200 pt-4">
      <span aria-hidden="true" className="inline-flex items-center gap-1 text-sm font-medium text-[#1f5b47]">Ver edital e preparar documentação<Seta /></span>
      <a className={`${lnkAcao} relative z-10`} href={e.fontes?.pagina ?? i.site} target="_blank" rel="noreferrer">{e.fontes ? 'Página oficial' : `Site da ${i.sigla}`}<span className="sr-only"> (abre em nova aba)</span></a>
    </div>
  </article>
}

function DetalheEdital({ e, dist, onVoltar, onAbrir, onPreparar }: { e: Edital; dist?: number; onVoltar: () => void; onAbrir: (id: string) => void; onPreparar: () => void }) {
  const i = INST[e.inst], s = situacao(e), h = dia(HOJE)
  const base = derivarPreparo(planoRegras(e), {}).docs
  const outros = EDITAIS.filter(x => x.inst === e.inst && x.id !== e.id).sort((a, b) => b.publicado.localeCompare(a.publicado))
  const marcos: [string, string, string][] = [
    ['Publicação', e.publicado, ''],
    ['Abertura das inscrições', e.inicio, s === 'em_breve' ? `Abre em ${dia(e.inicio) - h} ${dia(e.inicio) - h === 1 ? 'dia' : 'dias'}` : ''],
    ['Encerramento das inscrições', e.fim, s === 'aberto' ? (dia(e.fim) - h === 0 ? 'Encerra hoje' : `Faltam ${dia(e.fim) - h} ${dia(e.fim) - h === 1 ? 'dia' : 'dias'}`) : s === 'encerrado' ? 'Encerrado' : ''],
  ]
  return <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
    <button onClick={onVoltar} className={`${lnkAcao} inline-flex items-center gap-1`}><Seta esq />Voltar aos resultados</button>
    <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-12">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><Selo e={e} /><Tag e={e} /></div>
        <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">{e.titulo}</h1>
        <p className="mt-1 text-slate-600">{e.numero} · {e.centro} · {i.sigla}</p>
        <p className="mt-4 max-w-[68ch] text-[17px] text-slate-800">{e.resumo}</p>

        <div className="mt-6 rounded-xl border border-[#1f5b47]/30 bg-[#f3f8f5] p-5">
          <h2 className="font-semibold text-slate-900">Prepare a documentação para este edital</h2>
          <p className="mt-1 max-w-[60ch] text-[15px] text-slate-700">{e.guiado ? 'Conte sua situação ou responda perguntas. A Ponte confere as informações com os itens do edital e indica os próximos passos, sempre com a fonte.' : 'Responda algumas perguntas sobre você e receba uma lista de documentos para separar e de pontos para confirmar com a instituição.'}</p>
          {s === 'encerrado' && <p className="mt-2 text-sm text-amber-900">As inscrições deste edital já terminaram. Você ainda pode se preparar para a próxima edição.</p>}
          <button className={`${btnP} mt-4 gap-1.5`} onClick={onPreparar}>Preparar documentação<Seta /></button>
        </div>

        <section className="mt-10" aria-labelledby="t-crono"><h2 id="t-crono" className="text-lg font-semibold">Cronograma</h2>{e.fontes?.notaDatas && <p className="mt-1 text-sm text-amber-900">{e.fontes.notaDatas}</p>}
          <ol className="mt-4 space-y-0">{marcos.map(([t, d, nota], k) => { const feito = dia(d) <= h
            return <li key={t} className="relative flex gap-4 pb-5 last:pb-0">
              {k < marcos.length - 1 && <span aria-hidden="true" className={`absolute left-[7px] top-5 bottom-0 w-0.5 ${dia(marcos[k + 1][1]) <= h ? 'bg-[#1f5b47]' : 'bg-slate-200'}`} />}
              <span aria-hidden="true" className={`relative mt-1 size-4 shrink-0 rounded-full border-2 ${feito ? 'border-[#1f5b47] bg-[#1f5b47]' : 'border-slate-300 bg-white'}`} />
              <div><p className="text-sm text-slate-600">{t}</p><p className="font-medium text-slate-900">{fmt(d)}{nota && <span className="ml-2 text-sm font-normal text-[#1f5b47]">{nota}</span>}</p></div></li> })}</ol></section>

        <section className="mt-10" aria-labelledby="t-res"><h2 id="t-res" className="text-lg font-semibold">Em resumo</h2>
          <dl className="mt-3 grid gap-x-8 text-sm sm:grid-cols-2">{([['Área', e.area], ['Tipo', e.tipo], ['Público', e.publico], ['Centro ou unidade', e.centro], ['Valor', e.valor ? `${real(e.valor)}/mês` : 'Consulte o edital'], ['Vagas', e.vagas ?? 'Consulte o edital']] as const).map(([k, v]) =>
            <div key={k} className="flex justify-between gap-4 border-b border-slate-200 py-2.5"><dt className="text-slate-600">{k}</dt><dd className="text-right text-slate-900">{v}</dd></div>)}</dl></section>

        <section className="mt-10" aria-labelledby="t-docs"><h2 id="t-docs" className="text-lg font-semibold">O que costuma ser pedido</h2>
          <p className="mt-1 text-sm text-slate-600">Lista geral para editais de {e.tipo.toLowerCase()}. A lista da preparação muda conforme as suas respostas.</p>
          <ul className={`mt-3 ${LISTA}`}>{base.map(d => <li key={d.id} className="px-4 py-3"><p className="text-[15px] font-medium text-slate-900">{d.titulo}</p><p className="text-sm text-slate-600">{d.detalhe}</p></li>)}</ul></section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">Instituição</p><p className="mt-0.5 font-medium text-slate-900">{i.nome}</p><p className="text-sm text-slate-600">{i.campus} · {i.cidade}, {i.uf}{dist !== undefined && ` · ${distTxt(dist)}`}</p>
          <ul className="mt-4 space-y-1.5 border-t border-slate-200 pt-4">{e.fontes && ([['Página oficial do edital', e.fontes.pagina], ['Texto do edital (PDF)', e.fontes.edital], ...(e.fontes.anexos ? [['Anexos (PDF)', e.fontes.anexos]] : [])] as [string, string][]).map(([t, u]) => <li key={u}><a className={lnkAcao} href={u} target="_blank" rel="noreferrer">{t}<span className="sr-only"> (abre em nova aba)</span></a></li>)}<li><a className={lnkAcao} href={i.site} target="_blank" rel="noreferrer">Site da {i.sigla}<span className="sr-only"> (abre em nova aba)</span></a></li></ul>
          <p className="mt-4 text-xs text-slate-500">{e.fontes ? <>{e.fontes.processo && <>Processo {e.fontes.processo}. </>}Fontes consultadas em {fmt(e.fontes.consultadoEm)} ({HOJE_ORIGEM}).</> : 'Confira os detalhes na página oficial da instituição.'}</p></div>
        {outros.length > 0 && <div><h2 className="mb-2 text-sm font-medium text-slate-900">Outros editais em {i.sigla} · {i.campus}</h2>
          <ul className={LISTA}>{outros.map(o => <li key={o.id}><button onClick={() => onAbrir(o.id)} className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50"><span className="block text-sm font-medium text-slate-900">{o.titulo}</span><span className="block text-xs text-slate-600">{o.numero} · {o.area}</span><span className="mt-1.5 block"><Selo e={o} /></span></button></li>)}</ul></div>}
      </aside>
    </div>
  </main>
}

/* O edital aberto vem do endereço (#/editais/<id>); filtros ficam salvos na aba para sobreviver a recarregar. */
export default function BuscaEditais({ ativo, detalhe, onAbrir, onVoltar, onPreparar }: { ativo: boolean; detalhe?: string; onAbrir: (id: string) => void; onVoltar: () => void; onPreparar: (id: string) => void }) {
  const [q, setQ] = useSalvo('busca.q', ''); const [uf, setUf] = useSalvo('busca.uf', ''); const [cidade, setCidade] = useSalvo('busca.cidade', ''); const [inst, setInst] = useSalvo('busca.inst', '')
  const [area, setArea] = useSalvo('busca.area', ''); const [centro, setCentro] = useSalvo('busca.centro', ''); const [publico, setPublico] = useSalvo('busca.publico', ''); const [sit, setSit] = useSalvo<FiltroSit>('busca.sit', 'ativos')
  const [soGuiado, setSoGuiado] = useSalvo('busca.guiado', false); const [ordemSalva, setOrdem] = useSalvo<Ordem>('busca.ordem', 'recentes')
  // Origem das distâncias: '' (não calcular), 'gps' (localização do aparelho, nunca salva) ou "Cidade, UF".
  const [gps, setGps] = useState<Coord | null>(null); const [origem, setOrigem] = useSalvo('busca.origem', ''); const [geo, setGeo] = useState<'' | 'buscando' | 'erro'>('')
  const [instAberto, setInstAberto] = useState(false)
  const pos = origem === 'gps' ? gps : (COORD_CIDADE[origem] ?? null)
  const ordem: Ordem = ordemSalva === 'distancia' && !pos ? 'recentes' : ordemSalva
  const rolagem = useRef(0), daLista = useRef(false), detalheAntes = useRef(detalhe)

  const cidades = useMemo(() => [...new Set(INSTITUICOES.filter(i => !uf || i.uf === uf).map(i => i.cidade))].sort(), [uf])
  const dist = (id: string) => (pos ? km(pos, INST[id]) : undefined)
  const abertosPor = (id: string) => EDITAIS.filter(e => e.inst === id && situacao(e) === 'aberto').length

  // Instituições na região escolhida; com localização, as mais próximas primeiro.
  const instituicoes = useMemo(() => {
    const l = INSTITUICOES.filter(i => (!uf || i.uf === uf) && (!cidade || i.cidade === cidade))
    return pos ? [...l].sort((a, b) => km(pos, a) - km(pos, b)) : [...l].sort((a, b) => a.uf.localeCompare(b.uf) || a.sigla.localeCompare(b.sigla) || a.campus.localeCompare(b.campus))
  }, [uf, cidade, pos])
  const selecionada = inst ? INST[inst] : null

  const naRegiao = useMemo(() => EDITAIS.filter(e => instituicoes.some(i => i.id === e.inst) && (!inst || e.inst === inst)), [instituicoes, inst])
  const centros = useMemo(() => [...new Set(naRegiao.map(e => e.centro))].sort(), [naRegiao])
  const publicos = useMemo(() => [...new Set(EDITAIS.map(e => e.publico))].sort(), [])

  const resultado = useMemo(() => {
    const t = norm(q.trim())
    const l = naRegiao.filter(e => {
      const s = situacao(e), i = INST[e.inst]
      return (sit === 'todos' || (sit === 'ativos' ? s !== 'encerrado' : s === sit)) && (!area || e.area === area) && (!centro || e.centro === centro)
        && (!publico || e.publico === publico) && (!soGuiado || e.guiado)
        && (!t || norm([e.titulo, e.numero, e.centro, e.tipo, e.resumo, i.sigla, i.nome, i.cidade].join(' ')).includes(t))
    })
    const recentes = (a: Edital, b: Edital) => b.publicado.localeCompare(a.publicado)
    const prazo = (a: Edital, b: Edital) => { const sa = situacao(a), sb = situacao(b)
      if (sa !== sb) return RANK[sa] - RANK[sb]
      return sa === 'aberto' ? a.fim.localeCompare(b.fim) : sa === 'em_breve' ? a.inicio.localeCompare(b.inicio) : b.fim.localeCompare(a.fim) }
    const cmp: Record<Ordem, (a: Edital, b: Edital) => number> = {
      recentes, prazo,
      area: (a, b) => a.area.localeCompare(b.area) || recentes(a, b),
      centro: (a, b) => a.centro.localeCompare(b.centro) || INST[a.inst].sigla.localeCompare(INST[b.inst].sigla) || recentes(a, b),
      instituicao: (a, b) => INST[a.inst].sigla.localeCompare(INST[b.inst].sigla) || INST[a.inst].campus.localeCompare(INST[b.inst].campus) || recentes(a, b),
      valor: (a, b) => (b.valor ?? -1) - (a.valor ?? -1) || recentes(a, b),
      vagas: (a, b) => (b.vagas ?? -1) - (a.vagas ?? -1) || recentes(a, b),
      distancia: (a, b) => (pos ? km(pos, INST[a.inst]) - km(pos, INST[b.inst]) : 0) || prazo(a, b),
    }
    return l.sort(cmp[ordem])
  }, [naRegiao, q, sit, area, centro, publico, soGuiado, ordem, pos])

  // Ao ordenar por área, centro ou instituição, os resultados aparecem agrupados.
  const grupo = (e: Edital) => { const i = INST[e.inst]
    return ordem === 'area' ? e.area : ordem === 'centro' ? `${e.centro} · ${i.sigla}` : ordem === 'instituicao' ? `${i.sigla} · ${i.campus}, ${i.cidade}` : '' }
  const grupos = useMemo(() => { const m = new Map<string, Edital[]>(); for (const e of resultado) { const g = grupo(e); m.set(g, [...(m.get(g) ?? []), e]) } return [...m] }, [resultado, ordem])

  const filtrosAtivos = [q, area, centro, publico].filter(Boolean).length + (sit !== 'ativos' ? 1 : 0) + (soGuiado ? 1 : 0)
  const limparFiltros = () => { setQ(''); setArea(''); setCentro(''); setPublico(''); setSit('ativos'); setSoGuiado(false) }
  const limparLocal = () => { setUf(''); setCidade(''); setInst(''); setCentro('') }

  const abrir = (id: string) => { daLista.current = !detalhe; if (!detalhe) rolagem.current = window.scrollY; onAbrir(id) }
  // Se o detalhe foi aberto a partir da lista, voltar no histórico mantém o botão voltar do navegador coerente.
  const voltar = () => { if (daLista.current) { daLista.current = false; history.back() } else onVoltar() }
  // Ao sair do detalhe para a lista, restaura a rolagem depois do App levar a página ao topo.
  useEffect(() => {
    if (ativo && detalheAntes.current && !detalhe) { const y = rolagem.current; requestAnimationFrame(() => window.scrollTo(0, y)) }
    detalheAntes.current = detalhe
  }, [ativo, detalhe])

  function localizar() {
    if (!navigator.geolocation) return setGeo('erro')
    setGeo('buscando')
    navigator.geolocation.getCurrentPosition(p => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); setOrigem('gps'); setGeo(''); setOrdem('distancia') }, () => { setGeo('erro'); if (origem === 'gps') setOrigem('') }, { timeout: 10000 })
  }
  const nomeOrigem = origem === 'gps' ? 'você' : origem.split(',')[0]

  const aberto = detalhe ? EDITAIS.find(e => e.id === detalhe) : undefined
  if (aberto) return <DetalheEdital key={aberto.id} e={aberto} dist={dist(aberto.inst)} onVoltar={voltar} onAbrir={abrir} onPreparar={() => onPreparar(aberto.id)} />

  return <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
    <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">Encontre editais de bolsas e auxílios</h1>
    <p className="mt-1 text-slate-700">Escolha onde você estuda, veja os editais de cada instituição e compare prazos, áreas e centros.</p>
    <div className="mt-5 relative max-w-2xl"><label htmlFor="busca" className="sr-only">Buscar editais</label>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500"><path fill="currentColor" d="M8.5 3a5.5 5.5 0 0 1 4.38 8.83l3.65 3.64-1.06 1.06-3.64-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>
      <input id="busca" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, número, tipo de auxílio ou instituição" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-[15px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:border-slate-400" /></div>

    <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-labelledby="t-local">
        <div className="flex items-baseline justify-between"><h2 id="t-local" className="font-semibold">Localização</h2>{(uf || cidade || inst) && <button className={lnkAcao} onClick={limparLocal}>Limpar</button>}</div>
        <div className="grid grid-cols-[88px_1fr] gap-2">
          <div><label htmlFor="uf" className={rotulo}>Estado</label><select id="uf" className={campo} value={uf} onChange={e => { setUf(e.target.value); setCidade(''); setInst(''); setCentro('') }}><option value="">Todos</option>{UFS.map(u => <option key={u}>{u}</option>)}</select></div>
          <div><label htmlFor="cidade" className={rotulo}>Cidade</label><select id="cidade" className={campo} value={cidade} onChange={e => { setCidade(e.target.value); setInst(''); setCentro('') }}><option value="">Todas</option>{cidades.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div><button className={`${btnS} w-full gap-2`} onClick={localizar} disabled={geo === 'buscando'}>
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4"><path fill="currentColor" d="M10 2a6 6 0 0 1 6 6c0 4.2-4.7 8.9-5.4 9.6a.85.85 0 0 1-1.2 0C8.7 16.9 4 12.2 4 8a6 6 0 0 1 6-6Zm0 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /></svg>
          {geo === 'buscando' ? 'Obtendo localização…' : gps ? 'Atualizar minha localização' : 'Usar minha localização'}</button>
          <div className="mt-3"><label htmlFor="origem" className={rotulo}>Calcular distância a partir de</label>
            <select id="origem" className={campo} value={pos ? origem : ''} onChange={e => { setOrigem(e.target.value); if (e.target.value) setOrdem('distancia') }}>
              <option value="">Não calcular</option>{gps && <option value="gps">Minha localização</option>}
              <optgroup label="Cidades com instituições">{CIDADES_REF.map(c => <option key={c}>{c}</option>)}</optgroup></select></div>
          <p role="status" className="mt-1.5 text-xs text-slate-600">{geo === 'erro' ? 'Não foi possível obter sua localização. Você pode escolher uma cidade acima como referência.' : pos ? `Instituições ordenadas pela distância até ${nomeOrigem}.` : 'Opcional. A localização é usada só neste navegador e não é guardada.'}</p></div>

        <div><button type="button" aria-expanded={instAberto} aria-controls="lista-inst" onClick={() => setInstAberto(a => !a)} className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-left text-sm hover:border-slate-400 lg:hidden">
            <span className="min-w-0 truncate"><span className="text-slate-600">Instituição: </span><span className="font-medium text-slate-900">{selecionada ? `${selecionada.sigla} · ${selecionada.campus}` : 'Todas'}</span> <span className="text-slate-500">({instituicoes.length})</span></span><Chevron aberto={instAberto} /></button>
          <div id="lista-inst" className={`${instAberto ? 'mt-2' : 'hidden'} lg:mt-0 lg:block`}>
          <h3 className="mb-2 hidden text-sm font-medium text-slate-900 lg:block">Instituições <span className="font-normal text-slate-500">({instituicoes.length})</span></h3>
          <ul className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 lg:max-h-[calc(100vh-22rem)]">
            <li><button aria-pressed={!inst} onClick={() => { setInst(''); setCentro(''); setInstAberto(false) }} className={`w-full px-4 py-3 text-left text-sm transition-colors ${!inst ? 'bg-[#e8f1ec] font-medium text-[#16392d]' : 'hover:bg-slate-50'}`}>Todas as instituições</button></li>
            {instituicoes.map(i => { const sel = inst === i.id, n = abertosPor(i.id), d = dist(i.id)
              return <li key={i.id}><button aria-pressed={sel} onClick={() => { setInst(sel ? '' : i.id); setCentro(''); setInstAberto(false) }} className={`relative w-full px-4 py-3 text-left transition-colors ${sel ? 'bg-[#e8f1ec]' : 'hover:bg-slate-50'}`}>
                {sel && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-[#1f5b47]" />}
                <span className="flex items-baseline justify-between gap-3"><span className={`text-sm font-medium ${sel ? 'text-[#16392d]' : 'text-slate-900'}`}>{i.sigla} · {i.campus}</span>{d !== undefined && <span className="shrink-0 text-xs text-slate-500">{distTxt(d)}</span>}</span>
                <span className="block text-xs text-slate-600">{i.cidade}, {i.uf}</span>
                <span className={`mt-0.5 block text-xs ${n ? 'text-[#1f5b47]' : 'text-slate-500'}`}>{n ? `${n} ${n === 1 ? 'edital aberto' : 'editais abertos'}` : 'Nenhum edital aberto'}</span>
              </button></li> })}
            {instituicoes.length === 0 && <li className="px-4 py-3 text-sm text-slate-600">Nenhuma instituição nesta região.</li>}
          </ul></div></div>
      </aside>

      <section className="min-w-0" aria-labelledby="t-editais">
        {selecionada ? <div className="mb-5"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Editais disponíveis em</p>
          <h2 id="t-editais" className="text-xl font-semibold text-slate-900">{selecionada.nome}</h2>
          <p className="text-sm text-slate-600">{selecionada.campus} · {selecionada.cidade}, {selecionada.uf} · <a className={lnkAcao} href={selecionada.site} target="_blank" rel="noreferrer">Site da instituição<span className="sr-only"> (abre em nova aba)</span></a></p></div>
          : <h2 id="t-editais" className="mb-5 text-xl font-semibold text-slate-900">{uf || cidade ? `Editais em ${cidade || uf}` : 'Todos os editais'}</h2>}

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div><label htmlFor="f-area" className={rotulo}>Área</label><select id="f-area" className={campo} value={area} onChange={e => setArea(e.target.value)}><option value="">Todas as áreas</option>{AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div><label htmlFor="f-centro" className={rotulo}>Centro ou unidade</label><select id="f-centro" className={campo} value={centro} onChange={e => setCentro(e.target.value)}><option value="">Todos</option>{centros.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label htmlFor="f-publico" className={rotulo}>Público</label><select id="f-publico" className={campo} value={publico} onChange={e => setPublico(e.target.value)}><option value="">Todos</option>{publicos.map(p => <option key={p}>{p}</option>)}</select></div>
            <div><label htmlFor="f-ordem" className={rotulo}>Ordenar por</label><select id="f-ordem" className={campo} value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}>{ORDENS.map(([k, t]) => <option key={k} value={k} disabled={k === 'distancia' && !pos}>{t}{k === 'distancia' && !pos ? ' (escolha uma referência)' : ''}</option>)}</select></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <fieldset className="flex flex-wrap gap-1.5"><legend className="sr-only">Situação das inscrições</legend>
              {SITUACOES.map(([k, t]) => <label key={k} className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#1f5b47] ${sit === k ? 'border-[#1f5b47] bg-[#1f5b47] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}>
                <input type="radio" name="sit" className="sr-only" checked={sit === k} onChange={() => setSit(k)} />{t}</label>)}</fieldset>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="size-4 accent-[#1f5b47]" checked={soGuiado} onChange={e => setSoGuiado(e.target.checked)} />Só com orientação guiada</label>
          </div>
        </div>

        <div className="mt-5 mb-3 flex flex-wrap items-baseline justify-between gap-2"><p role="status" className="text-sm text-slate-600"><span className="font-medium text-slate-900">{resultado.length} {resultado.length === 1 ? 'edital' : 'editais'}</span> · ordenados por {ORDENS.find(o => o[0] === ordem)![1].toLowerCase()}</p>
          {filtrosAtivos > 0 && <button className={lnkAcao} onClick={limparFiltros}>Limpar filtros ({filtrosAtivos})</button>}</div>

        {resultado.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"><p className="font-medium text-slate-900">Nenhum edital com esses critérios</p>
          <p className="mx-auto mt-1 text-sm text-slate-600">Tente incluir editais encerrados, outra área ou outra instituição.</p>
          <div className="mt-4 flex justify-center gap-2">{filtrosAtivos > 0 && <button className={btnS} onClick={limparFiltros}>Limpar filtros</button>}{(uf || cidade || inst) && <button className={btnS} onClick={limparLocal}>Ver todas as regiões</button>}</div></div>
          : <div className="space-y-8">{grupos.map(([g, l]) => <div key={g || 'todos'} className="space-y-3">
            {g && <h3 className="flex items-baseline gap-2 border-b border-slate-200 pb-1.5 text-sm font-semibold text-slate-800">{g}<span className="font-normal text-slate-500">{l.length}</span></h3>}
            {l.map(e => <CartaoEdital key={e.id} e={e} dist={dist(e.inst)} onAbrir={() => abrir(e.id)} />)}</div>)}</div>}

        <p className="mt-6 text-xs text-slate-500">Situação das inscrições calculada em {fmt(HOJE)} ({HOJE_ORIGEM}). Confirme prazos e requisitos na página oficial de cada edital.</p>
      </section>
    </div>
  </main>
}
