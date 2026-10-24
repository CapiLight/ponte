import { ErroIA, type ProvedorIA } from './contrato'
import { opcoesSimulado, provedorSimulado } from './simulado'

/* Provedor real: a análise do relato vai para a Gemma 4 pela rota do servidor (/ia/relato), que guarda a chave.
   O plano do edital ainda usa a lista geral (o texto dos editais ainda não é coletado). */
export const provedorGemma: ProvedorIA = {
  nome: 'gemma-4',
  async analisarRelato(entrada, { sinal }) {
    if (opcoesSimulado.falharRelato) throw new ErroIA('indisponivel', 'Falha simulada (controle de demonstração).')
    let r: Response
    try {
      r = await fetch('/ia/relato', { method: 'POST', signal: sinal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(entrada) })
    } catch (x) {
      throw new ErroIA(sinal.aborted ? 'cancelado' : 'indisponivel', x instanceof Error ? x.message : String(x))
    }
    if (r.status === 504) throw new ErroIA('tempo_esgotado')
    if (!r.ok) throw new ErroIA('indisponivel', `Servidor respondeu HTTP ${r.status}.`)
    return r.json().catch(() => { throw new ErroIA('resposta_invalida', 'Resposta não é JSON.') })
  },
  gerarPlano: (entrada, opcoes) => provedorSimulado.gerarPlano(entrada, opcoes),
}
