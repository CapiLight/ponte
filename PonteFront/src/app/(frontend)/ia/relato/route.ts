import { analisarComGemma, FalhaGemma, lerEntrada, MODELO } from '@/ponte/servidor/gemma'

export const dynamic = 'force-dynamic'

/* POST /ia/relato: recebe EntradaRelato e devolve a resposta bruta da Gemma (validada no navegador).
   O relato não é registrado em log nem guardado. */
export async function POST(req: Request) {
  const entrada = lerEntrada(await req.json().catch(() => null))
  if (!entrada) return Response.json({ erro: 'entrada_invalida' }, { status: 400 })
  try {
    const resposta = await analisarComGemma(entrada, AbortSignal.any([req.signal, AbortSignal.timeout(25000)]))
    return Response.json(resposta, { headers: { 'x-ponte-modelo': MODELO, 'cache-control': 'no-store' } })
  } catch (x) {
    if (x instanceof FalhaGemma) return Response.json({ erro: x.message }, { status: x.status })
    const tempo = x instanceof Error && (x.name === 'TimeoutError' || x.name === 'AbortError')
    if (!tempo) console.error('[gemma]', x instanceof Error ? x.message : x)
    return Response.json({ erro: tempo ? 'tempo_esgotado' : 'indisponivel' }, { status: tempo ? 504 : 502 })
  }
}
