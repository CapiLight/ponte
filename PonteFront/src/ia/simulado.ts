import { planoRegras } from '../preparo'
import { ErroIA, OUTRA_PESSOA, type EntradaRelato, type PendenciaRelato, type ProvedorIA, type RespostaRelato, type SugestaoRelato } from './contrato'

/* Provedor do protótipo: regras fixas no lugar da Gemma, com o mesmo contrato e passando pelos mesmos validadores. */
export const opcoesSimulado = { atrasoMs: 1400, falharRelato: false }

function esperar(ms: number, sinal: AbortSignal) {
  return new Promise<void>((ok, erro) => {
    if (sinal.aborted) return erro(new ErroIA('cancelado'))
    const t = setTimeout(ok, ms)
    sinal.addEventListener('abort', () => { clearTimeout(t); erro(new ErroIA('cancelado')) }, { once: true })
  })
}

/* Só devolve trechos literais do relato; explicações vão em `nota`. */
export function simularRelato({ versao, relato: t }: EntradaRelato): RespostaRelato {
  const sugestoes: SugestaoRelato[] = [], esclarecer: PendenciaRelato[] = []
  const trecho = (re: RegExp) => t.match(re)?.[0].trim()
  const sug = (campo: string, valor: string, re: RegExp, nota?: string) => { const tr = trecho(re); if (tr) sugestoes.push({ campo, valor, trecho: tr, ...(nota ? { nota } : {}) }) }
  const RE_ALAG = /[^.,]*foi alagad[ao]/i, RE_INC = /[^.,]*inc[eê]ndio[^.,]*/i
  const alag = /alagad/i.test(t), inc = /inc[eê]ndio/i.test(t), dois = alag && inc
  if (dois) esclarecer.push({ campo: 'evento', nota: 'O relato menciona um incêndio e uma alagação. Escolha qual acontecimento será analisado.', trechos: [trecho(RE_INC), trecho(RE_ALAG)].filter((x): x is string => !!x) })
  else if (alag) sug('evento', 'Alagação', RE_ALAG)
  else if (inc) sug('evento', 'Incêndio', RE_INC)
  const outra = trecho(/(meu|minha) (pai|mãe|avó|avô|irmã|irmão|tia|tio|amiga|amigo)/i)
  if (outra && !/minha casa|minha residência|precisei/i.test(t)) sugestoes.push({ campo: 'sujeito', valor: OUTRA_PESSOA, trecho: outra })
  else sug('sujeito', 'Sim', /minha casa|precisei|perdi/i)
  const junto = dois ? 'No relato, esta informação aparece junto da alagação.' : undefined
  sug('saida', 'Sim', /precisei sair da minha residência/i, junto)
  const m = t.match(/dia (\d{1,2}) de outubro de (\d{4})/i)
  if (m) sugestoes.push({ campo: 'data', valor: `${m[1].padStart(2, '0')}/10/${m[2]}`, trecho: m[0], ...(junto ? { nota: junto } : {}) })
  sug('docs', 'Sim', /perdi meus documentos pessoais/i)
  return { versao, sugestoes, esclarecer }
}

export const provedorSimulado: ProvedorIA = {
  nome: 'simulado',
  async analisarRelato(entrada, { sinal }) {
    await esperar(opcoesSimulado.atrasoMs, sinal)
    if (opcoesSimulado.falharRelato) throw new ErroIA('indisponivel', 'Falha simulada pelo modo demonstração.')
    return simularRelato(entrada)
  },
  async gerarPlano({ edital }) { return planoRegras(edital) },
}
