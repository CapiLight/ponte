import { EDITAIS, EDITAL_GUIADO, HOJE } from '../editais'
import { OUTRA_PESSOA, type CampoAnalise, type ProvedorIA } from './contrato'
import { provedorSimulado } from './simulado'
import { validarPlano, validarRelato } from './validar'

/* Casos de conformidade: o mínimo que qualquer provedor (simulado ou Gemma) precisa acertar,
   porque a interface e as orientações do edital guiado dependem deles. Os textos são os exemplos do fluxo. */
export const EXEMPLO = 'No dia 10 de outubro de 2026, minha casa foi alagada. Precisei sair da minha residência e perdi meus documentos pessoais.'
export const EXEMPLO_DOIS = 'Em 2023 houve um incêndio na casa da minha avó. No dia 10 de outubro de 2026, minha casa foi alagada e precisei sair da minha residência.'
export const EXEMPLO_OUTRA = 'No dia 10 de outubro de 2026, a casa da minha tia foi alagada e ela precisou sair da residência dela.'

type Caso = { nome: string; relato: string; esperado: Record<string, string>; esclarecer: string[]; ausentes: string[] }
export const CASOS_RELATO: Caso[] = [
  { nome: 'um acontecimento, com a própria pessoa', relato: EXEMPLO, esperado: { evento: 'Alagação', sujeito: 'Sim', saida: 'Sim', data: '10/10/2026', docs: 'Sim' }, esclarecer: [], ausentes: ['moradia'] },
  { nome: 'dois acontecimentos: pedir para escolher', relato: EXEMPLO_DOIS, esperado: { saida: 'Sim', data: '10/10/2026' }, esclarecer: ['evento'], ausentes: ['docs'] },
  { nome: 'fato de outra pessoa', relato: EXEMPLO_OUTRA, esperado: { sujeito: OUTRA_PESSOA, evento: 'Alagação' }, esclarecer: [], ausentes: ['saida', 'docs', 'moradia'] },
]

/* Roda os casos contra um provedor e devolve a lista de problemas (vazia = conforme).
   Em desenvolvimento, disponível no console como `await ponteIA.verificar()`. */
export async function verificarConformidade(provedor: ProvedorIA, campos: CampoAnalise[]) {
  const problemas: string[] = [], sinal = new AbortController().signal
  for (const [k, c] of CASOS_RELATO.entries()) {
    const entrada = { versao: k + 1, relato: c.relato, edital: EDITAL_GUIADO.id, campos, dataReferencia: HOJE }
    try {
      const { valor: r, descartes } = validarRelato(entrada, await provedor.analisarRelato(entrada, { sinal }))
      const p = (m: string) => problemas.push(`relato "${c.nome}": ${m}`)
      descartes.forEach(d => p(`descartado na validação: ${d}`))
      for (const [campo, v] of Object.entries(c.esperado)) { const s = r.sugestoes.find(x => x.campo === campo); if (s?.valor !== v) p(`${campo}: esperado "${v}", veio "${s?.valor ?? 'nada'}"`) }
      for (const campo of c.esclarecer) if (!r.esclarecer.some(x => x.campo === campo)) p(`${campo}: deveria pedir esclarecimento`)
      for (const campo of c.ausentes) if (r.sugestoes.some(x => x.campo === campo)) p(`${campo}: não deveria ser sugerido`)
    } catch (x) { problemas.push(`relato "${c.nome}": ${x instanceof Error ? x.message : String(x)}`) }
  }
  for (const edital of EDITAIS) {
    try {
      const { valor, descartes } = validarPlano({ edital }, await provedor.gerarPlano({ edital }, { sinal }), provedor === provedorSimulado)
      descartes.forEach(d => problemas.push(`plano ${edital.id}: descartado na validação: ${d}`))
      if (!valor.perguntas.length) problemas.push(`plano ${edital.id}: sem perguntas`)
    } catch (x) { problemas.push(`plano ${edital.id}: ${x instanceof Error ? x.message : String(x)}`) }
  }
  return problemas
}
