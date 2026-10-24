import { useState } from 'react'
import { apagarTudo } from './persistencia'
import { EDITAIS, EDITAL_GUIADO, HOJE, HOJE_ORIGEM, INSTITUICOES, ficticio, fmt, nomeEdital } from './editais'

const btnP = 'inline-flex items-center justify-center h-11 px-5 rounded-lg bg-[#1f5b47] text-white text-[15px] font-medium hover:bg-[#174636] transition-colors'
const btnSm = 'inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-800 hover:bg-slate-50'
const reais = EDITAIS.filter(e => !ficticio(e)).length

function Bloco({ titulo, itens }: { titulo: string; itens: string[] }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-900">{titulo}</h3>
    <ul className="mt-3 space-y-2 text-[15px] text-slate-800">{itens.map(t => <li key={t} className="flex gap-2.5"><span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#1f5b47]" />{t}</li>)}</ul></div>
}

/* Ação destrutiva com confirmação em duas etapas. Usada no Sobre e no rodapé. */
export function ApagarDados({ className = '', compacto }: { className?: string; compacto?: boolean }) {
  const [confirmar, setConfirmar] = useState(false)
  if (!confirmar) return <button className={compacto ? `font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900 ${className}` : `${btnSm} ${className}`} onClick={() => setConfirmar(true)}>Apagar meus dados</button>
  return <div role="alert" className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-950 ${className}`}><p className="font-medium">Apagar tudo o que você preencheu na Ponte?</p><p className="mt-0.5">Isso remove o relato, as respostas, as preparações de todos os editais e os filtros da busca. Não é possível desfazer.</p>
    <div className="mt-3 flex flex-wrap gap-2"><button className="inline-flex h-9 items-center rounded-lg bg-red-700 px-3.5 text-sm font-medium text-white hover:bg-red-800" onClick={apagarTudo}>Apagar tudo</button><button className={btnSm} onClick={() => setConfirmar(false)}>Cancelar</button></div></div>
}

export default function Sobre({ onBuscar }: { onBuscar: () => void }) {
  return <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
    <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] text-slate-900">Sobre a Ponte</h1>
    <p className="mt-2 text-[17px] text-slate-700">A Ponte ajuda estudantes a encontrar editais de bolsas e auxílios e a preparar a documentação, sempre indicando a fonte de cada orientação.</p>

    <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="O que a Ponte faz e não faz">
      <Bloco titulo="O que a Ponte faz" itens={['Reúne editais por instituição, área, centro e prazo.', 'Organiza as informações que você declara e pede que você as confira.', 'Indica documentos para separar e pontos para confirmar com a instituição.', 'Mostra de qual item do edital vem cada orientação.']} />
      <Bloco titulo="O que a Ponte não faz" itens={['Não envia inscrições nem documentos.', 'Não decide se você tem direito ao benefício: a análise é da instituição.', 'Não comprova acontecimentos nem aprova documentos.', 'Não avalia todos os requisitos de cada edital.']} />
    </section>

    <section className="mt-10" aria-labelledby="t-dados"><h2 id="t-dados" className="text-lg font-semibold">De onde vêm os dados</h2>
      <div className="mt-3 space-y-3 text-[15px] text-slate-800">
        <p>O catálogo reúne {EDITAIS.length} editais de {INSTITUICOES.length} campi. O {nomeEdital(EDITAL_GUIADO)}, {EDITAL_GUIADO.titulo}, tem orientação guiada passo a passo.</p>
        <p>Prazos e situação das inscrições são calculados em <b>{fmt(HOJE)}</b> ({HOJE_ORIGEM}). Confira sempre as datas na página oficial do edital.</p>
        <p>As informações vêm das páginas oficiais das instituições, com a data da consulta indicada em cada edital.</p>
      </div></section>

    <section className="mt-10" aria-labelledby="t-ia"><h2 id="t-ia" className="text-lg font-semibold">Como a inteligência artificial é usada</h2>
      <div className="mt-3 space-y-3 text-[15px] text-slate-800">
        <p>A organização do seu relato é feita por um modelo de linguagem (Gemma), a partir do texto que você escreve e das regras do edital.</p>
        <p>A IA só sugere: cita apenas trechos literais do seu relato ou do edital, marca o que for ambíguo e nada é usado na orientação sem que você confira.</p>
      </div></section>

    <section className="mt-10" aria-labelledby="t-priv"><h2 id="t-priv" className="text-lg font-semibold">Privacidade</h2>
      <div className="mt-3 space-y-3 text-[15px] text-slate-800">
        <p>O que você escreve e responde fica salvo <b>apenas nesta aba do navegador</b>, para não se perder se a página recarregar. O texto do relato é enviado apenas para ser organizado pela IA e não fica guardado.</p>
        <p>Tudo é apagado ao fechar a aba, ou a qualquer momento pelo botão abaixo. A localização, se você permitir, é usada só para calcular distâncias e não é guardada.</p>
        <p className="text-sm text-slate-600">Em computador compartilhado, apague seus dados ou feche a aba ao terminar.</p>
      </div>
      <ApagarDados className="mt-4" /></section>

    <p className="mt-10 rounded-lg bg-[#e8f1ec] px-4 py-3 text-[15px] text-[#16392d]">A Ponte é um protótipo independente, sem vínculo com as instituições citadas. Siga sempre o texto oficial do edital e as orientações da instituição.</p>
    <button className={`${btnP} mt-6`} onClick={onBuscar}>Buscar editais</button>
  </main>
}
