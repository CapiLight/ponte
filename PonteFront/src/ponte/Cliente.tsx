'use client'

import dynamic from 'next/dynamic'

/* A Ponte é um app de uma página com rotas por hash e estado em sessionStorage: roda só no navegador. */
const App = dynamic(() => import('./App'), { ssr: false, loading: () => <p className="p-6 text-slate-600">Carregando…</p> })

export default function Ponte() {
  return <App />
}
