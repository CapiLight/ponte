import { useEffect, useState } from 'react'
import type { Edital } from '../editais'
import { planoRegras } from '../preparo'
import { ErroIA, LIMITES, type EntradaRelato, type PlanoEdital, type ProvedorIA, type RespostaRelato } from './contrato'
import { provedorSimulado } from './simulado'
import { validarPlano, validarRelato } from './validar'

export * from './contrato'
export { opcoesSimulado } from './simulado'

/* Ponto único de troca do provedor. O agente da Gemma registra o provedor dele aqui
   (ex.: escolhendo por import.meta.env.VITE_IA_PROVEDOR). A interface não muda. */
export const provedor: ProvedorIA = provedorSimulado

/* Aplica tempo limite e cancelamento a qualquer provedor, mesmo que ele ignore o sinal. */
async function chamar(f: (sinal: AbortSignal) => Promise<unknown>, externo?: AbortSignal): Promise<unknown> {
  if (externo?.aborted) throw new ErroIA('cancelado')
  const ctl = new AbortController(), cancelar = () => ctl.abort()
  externo?.addEventListener('abort', cancelar, { once: true })
  let relogio: ReturnType<typeof setTimeout> | undefined
  const limite = new Promise<never>((_, erro) => {
    relogio = setTimeout(() => { erro(new ErroIA('tempo_esgotado')); ctl.abort() }, LIMITES.tempoMs)
    ctl.signal.addEventListener('abort', () => erro(new ErroIA(externo?.aborted ? 'cancelado' : 'tempo_esgotado')), { once: true })
  })
  limite.catch(() => {}) // quem consome a rejeição é o race; isto evita aviso de rejeição não tratada
  try { return await Promise.race([f(ctl.signal), limite]) }
  catch (x) { throw x instanceof ErroIA ? x : new ErroIA('indisponivel', x instanceof Error ? x.message : String(x)) }
  finally { clearTimeout(relogio); externo?.removeEventListener('abort', cancelar) }
}

const registrar = (tarefa: string, descartes: string[]) => { if (descartes.length && import.meta.env?.DEV) console.warn(`[ia:${provedor.nome}] ${tarefa}: ${descartes.length} item(ns) descartado(s) na validação`, descartes) }

/* Tarefa 1. Rejeita com ErroIA; a tela trata qualquer motivo, exceto 'cancelado', como falha recuperável. */
export async function analisarRelato(entrada: EntradaRelato, sinal?: AbortSignal): Promise<RespostaRelato> {
  if (entrada.relato.length > LIMITES.relatoMax) throw new ErroIA('resposta_invalida', 'Relato acima do limite de tamanho.')
  const r = validarRelato(entrada, await chamar(s => provedor.analisarRelato(entrada, { sinal: s }), sinal))
  registrar('relato', r.descartes); return r.valor
}

/* Tarefa 2. */
export async function gerarPlano(edital: Edital, sinal?: AbortSignal): Promise<PlanoEdital> {
  const entrada = { edital }
  const r = validarPlano(entrada, await chamar(s => provedor.gerarPlano(entrada, { sinal: s }), sinal), provedor === provedorSimulado)
  registrar('plano', r.descartes); return r.valor
}

/* Plano do edital para a tela. 'geral': o provedor falhou e a tela usa a lista geral por tipo de edital. */
export type EstadoPlano = { estado: 'carregando' } | { estado: 'pronto' | 'geral'; plano: PlanoEdital }
const planos = new Map<string, PlanoEdital>()

export function usePlano(e: Edital): EstadoPlano {
  const [st, setSt] = useState<EstadoPlano>(() => { const p = planos.get(e.id); return p ? { estado: 'pronto', plano: p } : { estado: 'carregando' } })
  useEffect(() => {
    const p = planos.get(e.id); if (p) { setSt({ estado: 'pronto', plano: p }); return }
    setSt({ estado: 'carregando' })
    const ctl = new AbortController()
    gerarPlano(e, ctl.signal).then(
      p => { planos.set(e.id, p); setSt({ estado: 'pronto', plano: p }) },
      x => { if (!(x instanceof ErroIA && x.motivo === 'cancelado')) setSt({ estado: 'geral', plano: planoRegras(e) }) })
    return () => ctl.abort()
  }, [e])
  return st
}
