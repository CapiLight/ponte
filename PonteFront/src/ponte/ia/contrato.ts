import type { Edital } from '../editais'

/* ==========================================================================================
   Contrato entre a interface da Ponte e o modelo de linguagem (Gemma).
   A interface só conhece estes tipos. Qualquer provedor (simulado, Gemma no navegador, Gemma
   via servidor) implementa `ProvedorIA`; toda resposta passa por `validar.ts` antes de chegar
   à tela. Documentação completa: src/ia/CONTRATO.md.
   ========================================================================================== */

/* ---------- Tarefa 1: organizar o relato do fluxo guiado ---------- */

/* Campo que o modelo pode sugerir a partir do relato. Enviado na entrada para o prompt não duplicar a lista. */
export type CampoAnalise = { id: string; pergunta: string; tipo: 'opcao' | 'data'; opcoes?: string[] }

export type EntradaRelato = {
  /* Versão do relato; a resposta deve devolver o mesmo número. Respostas de versões antigas são descartadas. */
  versao: number
  relato: string
  /* Id do edital no catálogo (hoje, sempre o edital guiado). */
  edital: string
  campos: CampoAnalise[]
  /* Data de referência da consulta, AAAA-MM-DD. */
  dataReferencia: string
}

/* Sugestão de valor para um campo. `trecho` é obrigatório e precisa ser cópia literal de parte do relato. */
export type SugestaoRelato = { campo: string; valor: string; trecho: string; nota?: string }
/* Ambiguidade que a pessoa precisa resolver (ex.: dois acontecimentos). Não sugere valor. */
export type PendenciaRelato = { campo: string; nota: string; trechos: string[] }

export type RespostaRelato = { versao: number; sugestoes: SugestaoRelato[]; esclarecer: PendenciaRelato[] }

/* ---------- Tarefa 2: plano de preparação de um edital (fluxo genérico) ---------- */

/* Trecho literal do texto do edital e, se houver, onde ele está (ex.: "item 4.2", "Anexo II"). */
export type Fonte = { trecho: string; local?: string }

export type PerguntaPlano = { id: string; grupo: string; texto: string; ajuda?: string; opcoes: string[]; fonte?: Fonte }

/* O item vale quando a resposta da pergunta está em `respostas`. Sem condição, vale sempre. */
export type Condicao = { pergunta: string; respostas: string[] }

/* Itens com o mesmo `id` são variantes do mesmo item: vale a primeira, na ordem da lista, cuja condição for satisfeita. */
export type ItemPlano = {
  id: string
  tipo: 'documento' | 'passo' | 'confirmar'
  titulo: string
  detalhe?: string
  motivo?: string
  fonte?: Fonte
  quando?: Condicao
  link?: { rotulo: string; url: string }
}

export type EntradaPlano = { edital: Edital }

export type PlanoEdital = {
  edital: string
  /* 'regras': lista geral fixa por tipo de edital; 'modelo': gerado a partir do texto do edital. */
  origem: 'regras' | 'modelo'
  perguntas: PerguntaPlano[]
  itens: ItemPlano[]
}

/* O provedor devolve, junto do plano, o texto do edital que usou; ele serve só para conferir as citações. */
export type RespostaPlano = PlanoEdital & { textoEdital?: string }

/* ---------- Provedor ---------- */

export type MotivoErro = 'indisponivel' | 'tempo_esgotado' | 'resposta_invalida' | 'cancelado'
export class ErroIA extends Error {
  constructor(readonly motivo: MotivoErro, mensagem?: string) { super(mensagem ?? motivo); this.name = 'ErroIA' }
}

export type OpcoesChamada = { sinal: AbortSignal }

export interface ProvedorIA {
  nome: string
  /* Pode devolver `unknown`: a resposta é validada antes de ser usada. Deve rejeitar com ErroIA. */
  analisarRelato(entrada: EntradaRelato, opcoes: OpcoesChamada): Promise<RespostaRelato | unknown>
  gerarPlano(entrada: EntradaPlano, opcoes: OpcoesChamada): Promise<RespostaPlano | unknown>
}

/* ---------- Limites e regras compartilhadas ---------- */

export const LIMITES = {
  relatoMax: 4000,
  trechoMax: 300,
  notaMax: 300,
  textoMax: 200,
  opcoesMin: 2,
  opcoesMax: 6,
  perguntasMax: 15,
  itensMax: 40,
  tempoMs: 30000,
} as const

/* Valores que só a pessoa pode declarar; o modelo nunca os sugere. */
export const VALORES_SO_DO_USUARIO = ['Não sei', 'Não quero informar']
/* Se o relato indica que o fato aconteceu com outra pessoa, estes campos não são atribuídos à pessoa que usa a Ponte. */
export const CAMPOS_DA_PESSOA = ['saida', 'docs', 'moradia']
export const OUTRA_PESSOA = 'Não, aconteceu com outra pessoa'

/* ---------- Esquemas JSON para saída estruturada do modelo ---------- */

const str = { type: 'string' } as const
const fonte = { type: 'object', required: ['trecho'], properties: { trecho: str, local: str }, additionalProperties: false } as const

export const ESQUEMA_RELATO = {
  type: 'object', required: ['versao', 'sugestoes', 'esclarecer'], additionalProperties: false,
  properties: {
    versao: { type: 'integer' },
    sugestoes: { type: 'array', items: { type: 'object', required: ['campo', 'valor', 'trecho'], additionalProperties: false, properties: { campo: str, valor: str, trecho: str, nota: str } } },
    esclarecer: { type: 'array', items: { type: 'object', required: ['campo', 'nota', 'trechos'], additionalProperties: false, properties: { campo: str, nota: str, trechos: { type: 'array', items: str } } } },
  },
} as const

export const ESQUEMA_PLANO = {
  type: 'object', required: ['edital', 'origem', 'perguntas', 'itens'], additionalProperties: false,
  properties: {
    edital: str, origem: { enum: ['modelo'] }, textoEdital: str,
    perguntas: { type: 'array', items: { type: 'object', required: ['id', 'grupo', 'texto', 'opcoes'], additionalProperties: false, properties: { id: str, grupo: str, texto: str, ajuda: str, opcoes: { type: 'array', items: str }, fonte } } },
    itens: { type: 'array', items: { type: 'object', required: ['id', 'tipo', 'titulo'], additionalProperties: false, properties: {
      id: str, tipo: { enum: ['documento', 'passo', 'confirmar'] }, titulo: str, detalhe: str, motivo: str, fonte,
      quando: { type: 'object', required: ['pergunta', 'respostas'], additionalProperties: false, properties: { pergunta: str, respostas: { type: 'array', items: str } } },
      link: { type: 'object', required: ['rotulo', 'url'], additionalProperties: false, properties: { rotulo: str, url: str } } } } },
  },
} as const
