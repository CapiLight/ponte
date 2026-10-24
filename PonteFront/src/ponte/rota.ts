import { useCallback, useEffect, useState } from 'react'

/* Endereços com hash, para o botão voltar do navegador e links diretos:
   #/editais · #/editais/<id> · #/preparar/<id>/<etapa a partir de 1> · #/sobre */
export type Rota = { tela: 'busca'; detalhe?: string } | { tela: 'sobre' } | { tela: 'orientacao'; edital: string; etapa: number }

export function lerRota(hash: string): Rota {
  const p = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (p[0] === 'sobre') return { tela: 'sobre' }
  if (p[0] === 'preparar' && p[1]) return { tela: 'orientacao', edital: p[1], etapa: Math.max(0, (parseInt(p[2] ?? '1', 10) || 1) - 1) }
  if (p[0] === 'editais' && p[1]) return { tela: 'busca', detalhe: p[1] }
  return { tela: 'busca' }
}

export const hashRota = (r: Rota) =>
  r.tela === 'sobre' ? '#/sobre' : r.tela === 'orientacao' ? `#/preparar/${encodeURIComponent(r.edital)}/${r.etapa + 1}` : r.detalhe ? `#/editais/${encodeURIComponent(r.detalhe)}` : '#/editais'

export function useRota() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const f = () => setHash(location.hash)
    addEventListener('popstate', f); addEventListener('hashchange', f)
    return () => { removeEventListener('popstate', f); removeEventListener('hashchange', f) }
  }, [])
  /* substituir: corrige o endereço sem criar entrada no histórico (ex.: etapa ainda não liberada). */
  const navegar = useCallback((r: Rota, substituir = false) => {
    const h = hashRota(r)
    if (h !== location.hash) history[substituir ? 'replaceState' : 'pushState'](null, '', h)
    setHash(h)
  }, [])
  return [lerRota(hash), navegar] as const
}
