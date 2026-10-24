import { useState } from 'react'
import { HOJE, INST, dia, ficticio, fmt, fmtCurto, situacao, type Edital } from './editais'
import { derivarPreparo, type Preparo } from './preparo'
import { usePlano, type Fonte, type PlanoEdital } from './ia'
import { Selo } from './BuscaEditais'

const btnP = 'inline-flex items-center justify-center h-11 px-5 rounded-lg bg-[#1f5b47] text-white text-[15px] font-medium hover:bg-[#174636] transition-colors'
const btnS = 'inline-flex items-center justify-center h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-800 text-[15px] font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors'
const btnSm = 'inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-800 hover:bg-slate-50'
const lnkAcao = 'text-sm font-medium text-[#1f5b47] hover:underline underline-offset-2 rounded-sm'
const LISTA = 'rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
export const ETAPAS_PREPARO = ['Perguntas', 'Documentos', 'Resumo']

/* Preparação genérica para editais sem orientação guiada. O estado fica no App, por edital, para não se perder ao alternar telas.
   A etapa vem do endereço e o indicador de etapas é o mesmo do fluxo guiado, renderizado no cabeçalho do App. */
type Props = { e: Edital; p: Preparo; etapa: number; ir: (n: number) => void; set: (p: Preparo) => void; onTrocar: () => void; onRecomecar: () => void }

/* Citação do edital, quando o plano vem do modelo (o validador garante que o trecho é literal). */
const Trecho = ({ f }: { f?: Fonte }) => f ? <span className="mt-1 block text-xs text-slate-500">No edital{f.local ? `, ${f.local}` : ''}: <span className="text-slate-700">“{f.trecho}”</span></span> : null

/* O plano (perguntas e itens) vem do provedor de IA; sem ele, a lista geral por tipo de edital. */
export default function PrepararEdital(props: Props) {
  const est = usePlano(props.e)
  if (est.estado === 'carregando') { const i = INST[props.e.inst]
    return <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Preparar documentação</p>
      <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">{props.e.titulo}</h1><p className="text-slate-600">{props.e.numero} · {i.sigla} · {i.campus}</p>
      <p role="status" className="aparecer-tarde mt-8 text-[15px] text-slate-700">Lendo o edital e preparando as perguntas…</p></main> }
  return <Preparacao {...props} plano={est.plano} geral={est.estado === 'geral'} />
}

function Preparacao({ e, p, etapa, ir, set, onTrocar, onRecomecar, plano, geral }: Props & { plano: PlanoEdital; geral: boolean }) {
  const [copiado, setCopiado] = useState(false); const [recomecar, setRecomecar] = useState(false)
  const i = INST[e.inst], qs = plano.perguntas, d = derivarPreparo(plano, p.resp), doModelo = plano.origem === 'modelo'
  const respondidas = qs.filter(q => p.resp[q.id]).length, separados = d.docs.filter(x => p.tenho.includes(x.id)).length
  const naoResp = qs.filter(q => !p.resp[q.id])
  const grupos = [...new Set(qs.map(q => q.grupo))]
  const responder = (id: string, v: string) => set({ ...p, resp: { ...p.resp, [id]: v } })
  const alternar = (id: string) => set({ ...p, tenho: p.tenho.includes(id) ? p.tenho.filter(x => x !== id) : [...p.tenho, id] })
  const falta = dia(e.fim) - dia(HOJE), s = situacao(e)

  const resumo = [`Preparação para: ${e.titulo} (${e.numero}), ${i.sigla} · ${i.campus}`, `Inscrições: ${fmt(e.inicio)} a ${fmt(e.fim)}`, '',
    'Documentos:', ...d.docs.map(x => `[${p.tenho.includes(x.id) ? 'x' : ' '}] ${x.titulo}`),
    ...(d.passos.length ? ['', 'Antes de se inscrever:', ...d.passos.map(x => `- ${x.titulo}`)] : []),
    '', 'Confirmar com a instituição:', ...d.confirmar.map(x => `- ${x}`), ...naoResp.map(q => `- Ainda não respondido: ${q.texto}`),
    '', doModelo ? 'Lista gerada pela Ponte a partir do texto do edital. Confira sempre o texto oficial.' : 'Lista geral gerada pela Ponte (protótipo). Confira sempre o texto oficial do edital.'].join('\n')
  const copiar = () => navigator.clipboard?.writeText(resumo).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500) }, () => setCopiado(false))

  return <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10 grid gap-8 lg:gap-12 lg:grid-cols-[1fr_300px]">
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Preparar documentação</p>
      <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">{e.titulo}</h1>
      <p className="text-slate-600">{e.numero} · {i.sigla} · {i.campus}</p>

      {etapa === 0 && <div className="mt-8 space-y-8">
        {geral && <div role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-[15px] text-amber-950">Não foi possível preparar perguntas específicas deste edital agora. Mostramos a lista geral para editais de {e.tipo.toLowerCase()}.</div>}
        <div role="note" className="rounded-lg bg-[#e8f1ec] px-4 py-3 text-[15px] text-[#16392d]">{doModelo
          ? <><p className="font-medium">Perguntas preparadas a partir do texto deste edital</p><p className="mt-0.5">Quando uma pergunta vem de um item do edital, o trecho aparece logo abaixo. Você pode pular qualquer pergunta.</p></>
          : <><p className="font-medium">Perguntas gerais para editais de {e.tipo.toLowerCase()}</p><p className="mt-0.5">Na versão com IA, a Gemma lê o texto deste edital e faz perguntas específicas, com o trecho de origem. Você pode pular qualquer pergunta.</p></>}</div>
        {grupos.map(g => <fieldset key={g}><legend className="mb-3 text-lg font-semibold">{g}</legend><div className={LISTA}>{qs.filter(q => q.grupo === g).map(q =>
          <div key={q.id} role="radiogroup" aria-labelledby={`q-${q.id}`} className="p-5"><p id={`q-${q.id}`} className="font-medium text-slate-900">{q.texto}</p>{q.ajuda && <p className="text-sm text-slate-600">{q.ajuda}</p>}<Trecho f={q.fonte} />
            <div className="mt-3 flex flex-wrap gap-2">{q.opcoes.map(o => { const on = p.resp[q.id] === o
              return <label key={o} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-[15px] transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#1f5b47] ${on ? 'border-[#1f5b47] bg-[#e8f1ec] text-[#16392d] font-medium' : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'}`}>
                <input type="radio" className="sr-only" name={q.id} checked={on} onChange={() => responder(q.id, o)} />{o}</label> })}</div></div>)}</div></fieldset>)}
        <div className="flex flex-wrap items-center gap-4"><button className={btnP} onClick={() => ir(1)}>Ver documentos</button><span className="text-sm text-slate-600">{respondidas} de {qs.length} respondidas</span></div>
      </div>}

      {etapa === 1 && <div className="mt-8 space-y-10">
        <section aria-labelledby="t-docs"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="t-docs" className="text-lg font-semibold">Documentos para separar</h2><span className="text-sm text-slate-600">{separados} de {d.docs.length} separados</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><div className="h-full rounded-full bg-[#1f5b47] transition-[width] duration-300" style={{ width: `${d.docs.length ? (separados / d.docs.length) * 100 : 0}%` }} /></div>
          <ul className={`mt-4 ${LISTA}`}>{d.docs.map(x => { const ok = p.tenho.includes(x.id)
            return <li key={x.id}><label className="flex cursor-pointer gap-3 p-4 hover:bg-slate-50 has-[:focus-visible]:bg-slate-50"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-[#1f5b47]" checked={ok} onChange={() => alternar(x.id)} />
              <span><span className={`block font-medium ${ok ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-900'}`}>{x.titulo}</span><span className="block text-sm text-slate-700">{x.detalhe}</span><span className="mt-1 block text-xs text-slate-500">Por quê: {x.motivo}</span><Trecho f={x.fonte} /></span></label></li> })}</ul>
          <p className="mt-2 text-xs text-slate-500">Marque o que você já tem. {doModelo ? 'Confira a lista completa no texto oficial do edital.' : 'A lista é geral e pode não incluir documentos específicos deste edital.'}</p></section>

        {d.passos.length > 0 && <section aria-labelledby="t-passos"><h2 id="t-passos" className="text-lg font-semibold">Antes de se inscrever</h2>
          <div className="mt-3 space-y-3">{d.passos.map(x => <article key={x.id} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">{x.titulo}</h3><p className="mt-1 text-slate-800">{x.detalhe}</p><p className="mt-1 text-sm text-slate-600">Por quê: {x.motivo}</p><Trecho f={x.fonte} />{x.link && <a className={`${lnkAcao} mt-2 inline-block`} href={x.link[1]} target="_blank" rel="noreferrer">{x.link[0]}<span className="sr-only"> (abre em nova aba)</span></a>}</article>)}</div></section>}

        <section aria-labelledby="t-conf"><h2 id="t-conf" className="text-lg font-semibold">Confirme com a instituição</h2><p className="mt-1 text-sm text-slate-600">Pontos que dependem do texto do edital ou que você ainda não respondeu.</p>
          <ul className={`mt-3 ${LISTA}`}>{d.confirmar.map(c => <li key={c} className="px-4 py-3 text-[15px]">{c}</li>)}
            {naoResp.map(q => <li key={q.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-[15px]"><span>Ainda não respondido: {q.texto}</span><button className={`${lnkAcao} shrink-0`} onClick={() => ir(0)}>Responder</button></li>)}</ul></section>

        <div className="flex flex-wrap gap-3"><button className={btnS} onClick={() => ir(0)}>Voltar às perguntas</button><button className={btnP} onClick={() => ir(2)}>Ver resumo</button></div>
      </div>}

      {etapa === 2 && <div className="mt-8 space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">{([['Documentos separados', `${separados} de ${d.docs.length}`], ['Passos antes da inscrição', String(d.passos.length)], ['Pontos para confirmar', String(d.confirmar.length + naoResp.length)]] as const).map(([t, v]) =>
          <div key={t} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">{t}</p><p className="mt-1 text-2xl font-semibold text-slate-900">{v}</p></div>)}</div>
        {s !== 'encerrado' && <p className="text-[15px] text-slate-800">{s === 'aberto' ? <>Inscrições até <b>{fmt(e.fim)}</b>{falta <= 7 && <span className="text-amber-900"> · {falta === 0 ? 'encerra hoje' : `faltam ${falta} ${falta === 1 ? 'dia' : 'dias'}`}</span>}.</> : <>As inscrições abrem em <b>{fmt(e.inicio)}</b>.</>}</p>}
        <section aria-labelledby="t-resumo"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="t-resumo" className="text-lg font-semibold">Resumo para guardar</h2><div className="flex flex-wrap gap-2 print:hidden"><button className={btnSm} onClick={copiar}>{copiado ? 'Copiado' : 'Copiar resumo'}</button><button className={btnSm} onClick={() => window.print()}>Imprimir ou salvar PDF</button></div></div>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-5 font-[inherit] text-sm leading-relaxed text-slate-800">{resumo}</pre>
          <p role="status" className="sr-only">{copiado ? 'Resumo copiado' : ''}</p></section>
        <div className="flex flex-wrap gap-3"><button className={btnS} onClick={() => ir(1)}>Voltar aos documentos</button><a className={btnP} href={e.fontes?.pagina ?? i.site} target="_blank" rel="noreferrer">{e.fontes ? 'Abrir página oficial' : `Abrir site da ${i.sigla}`}<span className="sr-only"> (abre em nova aba)</span></a></div>
      </div>}
    </div>

    <aside className="lg:sticky lg:top-6 lg:self-start print:hidden"><div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
      <h2 className="mb-2 text-xs font-medium text-slate-500">Edital em preparação</h2><Selo e={e} />
      <p className="mt-2 text-[15px] font-medium text-slate-900">{e.titulo}</p><p className="text-slate-600">{e.numero} · {e.centro}</p>
      <dl className="mt-4 space-y-3"><div><dt className="text-xs text-slate-500">Instituição</dt><dd className="text-slate-800">{i.nome}, {i.campus} · {i.cidade}, {i.uf}</dd></div><div><dt className="text-xs text-slate-500">Inscrições</dt><dd className="text-slate-800">{fmtCurto(e.inicio)} a {fmt(e.fim)}</dd></div></dl>
      <div className="mt-4 flex flex-col items-start gap-1.5 border-t border-slate-200 pt-4"><a className={lnkAcao} href={e.fontes?.pagina ?? i.site} target="_blank" rel="noreferrer">{e.fontes ? 'Página oficial do edital' : `Site da ${i.sigla}`}<span className="sr-only"> (abre em nova aba)</span></a><button className={lnkAcao} onClick={onTrocar}>Trocar de edital</button></div>
      <p className="mt-4 text-xs text-slate-500">{ficticio(e) ? 'Exemplo fictício. ' : ''}{doModelo ? 'A lista foi preparada a partir do texto do edital e' : 'A lista é geral para o tipo de edital e'} não substitui a leitura do texto oficial.</p>
      <div className="mt-4 border-t border-slate-200 pt-4">{!recomecar ? <button className={lnkAcao} onClick={() => setRecomecar(true)}>Recomeçar preparação</button>
        : <div role="alert"><p className="text-slate-800">Apagar as respostas e a lista de documentos deste edital? As preparações de outros editais continuam salvas.</p>
          <div className="mt-3 flex flex-wrap gap-2"><button className={btnSm} onClick={() => { setRecomecar(false); onRecomecar() }}>Apagar e recomeçar</button><button className={btnSm} onClick={() => setRecomecar(false)}>Cancelar</button></div></div>}</div>
    </div></aside>
  </main>
}
