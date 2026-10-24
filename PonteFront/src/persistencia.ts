import { useEffect, useState } from 'react'

/* Progresso salvo só nesta aba (sessionStorage): sobrevive a recarregar a página e some ao fechar a aba.
   Escolha de privacidade: o relato pode conter dados sensíveis, então nada vai para localStorage nem para servidores. */
const PREFIXO = 'ponte:'

export function useSalvo<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try { const s = sessionStorage.getItem(PREFIXO + chave); return s === null ? inicial : (JSON.parse(s) as T) } catch { return inicial }
  })
  useEffect(() => { try { sessionStorage.setItem(PREFIXO + chave, JSON.stringify(valor)) } catch { /* armazenamento indisponível: segue só em memória */ } }, [chave, valor])
  return [valor, setValor] as const
}

/* Apaga tudo o que a Ponte salvou e recarrega na tela inicial. */
export function apagarTudo() {
  try { Object.keys(sessionStorage).filter(k => k.startsWith(PREFIXO)).forEach(k => sessionStorage.removeItem(k)) } catch { /* nada a apagar */ }
  history.replaceState(null, '', location.pathname + location.search)
  location.reload()
}
