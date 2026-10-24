import type { Edital } from './editais'
import type { Fonte, ItemPlano, PerguntaPlano, PlanoEdital } from './ia/contrato'

/* Preparação genérica por edital.
   - O plano (perguntas + itens condicionais) vem do provedor de IA (src/ia). Sem modelo, `planoRegras` gera a lista
     geral fixa por área/tipo, no mesmo formato.
   - `derivarPreparo` é uma função pura do plano e das respostas: responder ou mudar uma resposta nunca chama o modelo. */

export type Item = { id: string; titulo: string; detalhe: string; motivo: string; fonte?: Fonte; link?: [string, string] }
export type Preparo = { resp: Record<string, string>; tenho: string[]; etapa: number; max: number }
export const PREPARO_VAZIO: Preparo = { resp: {}, tenho: [], etapa: 0, max: 0 }

const SN = ['Sim', 'Não', 'Não sei']
const assist = (e: Edital) => e.area === 'Assistência estudantil'
const academico = (e: Edital) => ['Pesquisa', 'Inovação'].includes(e.area)
const pos = (e: Edital) => e.publico.toLowerCase().includes('pós')
const pagaBolsa = (e: Edital) => e.valor !== 0

function perguntasRegras(e: Edital): PerguntaPlano[] {
  const q: PerguntaPlano[] = [
    { id: 'vinculo', grupo: 'Seu vínculo', texto: 'Você está matriculado(a) na instituição neste período?', opcoes: ['Sim', 'Ainda vou me matricular', 'Não sei'] },
    { id: 'outraBolsa', grupo: 'Seu vínculo', texto: 'Você recebe outra bolsa ou auxílio atualmente?', ajuda: 'Alguns editais não permitem acumular benefícios.', opcoes: SN },
  ]
  if (assist(e)) q.push(
    { id: 'moraCom', grupo: 'Família e moradia', texto: 'Com quem você mora?', opcoes: ['Com a família', 'Sozinho(a) ou com colegas', 'Outra situação'] },
    { id: 'cadunico', grupo: 'Família e moradia', texto: 'Sua família está inscrita no CadÚnico?', ajuda: 'Cadastro Único para Programas Sociais do governo federal.', opcoes: SN },
    { id: 'informal', grupo: 'Família e moradia', texto: 'Alguém que mora com você tem renda sem carteira assinada?', opcoes: SN })
  if (e.tipo === 'Moradia') q.push({ id: 'aluguel', grupo: 'Família e moradia', texto: 'Você paga aluguel onde mora?', opcoes: SN })
  if (e.tipo === 'Transporte') q.push({ id: 'desloc', grupo: 'Deslocamento', texto: 'Como você chega ao campus?', opcoes: ['Transporte público', 'Transporte próprio', 'A pé ou de bicicleta'] })
  if (e.tipo === 'Inclusão digital') q.push({ id: 'internet', grupo: 'Acesso digital', texto: 'Você tem internet em casa?', opcoes: ['Sim', 'Só pelo celular', 'Não'] })
  if (academico(e) || e.tipo === 'Extensão') q.push({ id: 'orientador', grupo: 'Atividade acadêmica', texto: e.tipo === 'Extensão' ? 'Você já tem um projeto ou coordenador(a) de extensão em vista?' : 'Você já tem um(a) orientador(a)?', opcoes: ['Sim', 'Ainda não', 'Não sei'] })
  if (academico(e) || pos(e)) q.push({ id: 'lattes', grupo: 'Atividade acadêmica', texto: 'Seu currículo Lattes está atualizado?', opcoes: ['Sim', 'Não', 'Não tenho currículo Lattes'] })
  if (e.tipo === 'Monitoria') q.push({ id: 'disciplina', grupo: 'Atividade acadêmica', texto: 'Você já foi aprovado(a) na disciplina em que quer ser monitor(a)?', opcoes: SN })
  if (e.tipo === 'Esporte') q.push({ id: 'equipe', grupo: 'Atividade esportiva', texto: 'Você participa de alguma equipe ou competição pela instituição?', opcoes: SN })
  if (pagaBolsa(e)) q.push({ id: 'conta', grupo: 'Recebimento', texto: 'Você tem conta bancária em seu nome?', ajuda: 'O pagamento costuma ser feito em conta do(a) próprio(a) estudante.', opcoes: ['Sim, conta corrente', 'Sim, só poupança ou conta digital', 'Não', 'Não sei'] })
  return q
}

/* Lista geral fixa, no formato do contrato. Variantes com o mesmo id: vale a primeira cuja condição for satisfeita. */
export function planoRegras(e: Edital): PlanoEdital {
  const perguntas = perguntasRegras(e), tem = (id: string) => perguntas.some(p => p.id === id)
  const itens: ItemPlano[] = []
  const se = (pergunta: string, ...respostas: string[]) => ({ quando: { pergunta, respostas } })
  const doc = (id: string, titulo: string, detalhe: string, motivo: string, extra: Partial<ItemPlano> = {}) => itens.push({ id, tipo: 'documento', titulo, detalhe, motivo, ...extra })
  const passo = (id: string, titulo: string, detalhe: string, motivo: string, extra: Partial<ItemPlano> = {}) => itens.push({ id, tipo: 'passo', titulo, detalhe, motivo, ...extra })
  const confirmar = (id: string, titulo: string, extra: Partial<ItemPlano> = {}) => itens.push({ id, tipo: 'confirmar', titulo, ...extra })

  doc('identidade', 'Documento de identidade com foto', 'RG, CNH ou outro documento oficial com foto.', 'Pedido em praticamente todos os editais.')
  doc('cpf', 'CPF', 'Pode constar no próprio documento de identidade.', 'Pedido em praticamente todos os editais.')
  doc('matricula', 'Comprovante de matrícula', 'Emitido no sistema acadêmico da instituição.', 'Você ainda vai se matricular: emita o comprovante assim que a matrícula for concluída.', se('vinculo', 'Ainda vou me matricular'))
  doc('matricula', 'Comprovante de matrícula', 'Emitido no sistema acadêmico da instituição.', 'Comprova seu vínculo com a instituição.')
  if (academico(e) || pos(e) || e.tipo === 'Monitoria') {
    if (tem('disciplina')) doc('historico', 'Histórico acadêmico', 'Versão atualizada, emitida no sistema acadêmico.', 'Mostra a aprovação na disciplina da monitoria.', se('disciplina', 'Sim'))
    doc('historico', 'Histórico acadêmico', 'Versão atualizada, emitida no sistema acadêmico.', 'Editais acadêmicos costumam considerar o desempenho.')
  }
  if (assist(e)) {
    doc('residencia', 'Comprovante de residência', 'Conta de água, luz ou internet recente.', 'Editais de assistência estudantil costumam pedir.')
    doc('renda', 'Comprovantes de renda de quem mora com você', 'Contracheques, extratos de benefícios ou declarações de cada pessoa com renda.', 'A renda é usada na análise socioeconômica.', se('moraCom', 'Com a família'))
    doc('renda', 'Comprovantes da sua renda', 'Seus comprovantes e, se houver, de quem ajuda você financeiramente.', 'A renda é usada na análise socioeconômica.')
    doc('cadunico', 'Comprovante do CadÚnico', 'Folha resumo do cadastro ou número do NIS.', 'Você informou que sua família está no CadÚnico.', se('cadunico', 'Sim'))
    doc('informal', 'Declaração de renda informal', 'Muitos editais trazem um modelo nos anexos.', 'Você informou renda sem carteira assinada.', se('informal', 'Sim'))
  }
  if (tem('aluguel')) doc('aluguel', 'Contrato de aluguel ou recibos', 'Contrato vigente ou recibos dos últimos meses.', 'Você informou que paga aluguel.', se('aluguel', 'Sim'))
  if (tem('desloc')) doc('transporte', 'Comprovantes de transporte', 'Cartão de transporte ou recibos de passagem.', 'Você informou que usa transporte público.', se('desloc', 'Transporte público'))
  if (tem('equipe')) doc('equipe', 'Declaração da equipe ou federação', 'Documento que comprove sua participação.', 'Você informou que participa de equipe ou competição.', se('equipe', 'Sim'))
  if (tem('lattes')) doc('lattes', 'Currículo Lattes', 'Versão atualizada, exportada em PDF.', 'Editais acadêmicos costumam pedir.', se('lattes', 'Sim'))
  doc('outraBolsa', 'Comprovante do benefício atual', 'Termo de concessão ou extrato de pagamento.', 'Você informou que recebe outra bolsa ou auxílio.', se('outraBolsa', 'Sim'))
  if (tem('conta')) doc('banco', 'Dados bancários', 'Banco, agência e número da conta corrente em seu nome.', 'Necessários para receber o pagamento.', se('conta', 'Sim, conta corrente'))

  const lattes = { link: { rotulo: 'Abrir a Plataforma Lattes', url: 'https://lattes.cnpq.br' } }, motivoLattes = 'Editais de pesquisa e pós-graduação costumam pedir o currículo.'
  if (tem('lattes')) {
    passo('p-lattes', 'Atualize seu currículo Lattes', 'O cadastro é feito na Plataforma Lattes, do CNPq, e pode levar alguns dias para ser publicado.', motivoLattes, { ...lattes, ...se('lattes', 'Não') })
    passo('p-lattes', 'Crie seu currículo Lattes', 'O cadastro é feito na Plataforma Lattes, do CNPq, e pode levar alguns dias para ser publicado.', motivoLattes, { ...lattes, ...se('lattes', 'Não tenho currículo Lattes') })
  }
  if (tem('orientador')) passo('p-orientador', e.tipo === 'Extensão' ? 'Procure um projeto de extensão' : 'Procure um(a) orientador(a)', 'Consulte os projetos do centro ou da pró-reitoria e converse com docentes antes do fim das inscrições.', 'A inscrição costuma depender de um projeto vinculado.', se('orientador', 'Ainda não'))
  if (tem('conta')) passo('p-conta', 'Abra uma conta corrente em seu nome', 'Leve documento de identidade, CPF e comprovante de residência ao banco, ou abra uma conta digital se o edital aceitar.', 'O pagamento costuma ser feito só em conta do(a) estudante.', se('conta', 'Não'))

  confirmar('c-acumular', 'Posso acumular este benefício com a bolsa ou o auxílio que já recebo?', se('outraBolsa', 'Sim'))
  if (tem('conta')) confirmar('c-conta', 'Posso receber o pagamento em conta poupança ou conta digital?', se('conta', 'Sim, só poupança ou conta digital'))
  if (tem('disciplina')) confirmar('c-disciplina', 'Posso me inscrever na monitoria de uma disciplina em que ainda não fui aprovado(a)?', se('disciplina', 'Não'))
  if (tem('internet')) confirmar('c-internet', 'O auxílio pode ser usado para pacote de dados no celular?', se('internet', 'Só pelo celular'))
  confirmar('c-matricula', 'Estudantes que ainda vão se matricular podem se inscrever?', se('vinculo', 'Ainda vou me matricular'))
  confirmar('c-entrega', 'Os documentos podem ser enviados digitalmente ou precisam ser entregues em papel?')
  return { edital: e.id, origem: 'regras', perguntas, itens }
}

/* Aplica as respostas ao plano. Puro e local. */
export function derivarPreparo(plano: PlanoEdital, r: Record<string, string>) {
  const vistos = new Set<string>(), docs: Item[] = [], passos: Item[] = [], confirmar: string[] = []
  for (const x of plano.itens) {
    if (vistos.has(x.id) || (x.quando && !x.quando.respostas.includes(r[x.quando.pergunta]))) continue
    vistos.add(x.id)
    if (x.tipo === 'confirmar') { confirmar.push(x.titulo); continue }
    const item: Item = { id: x.id, titulo: x.titulo, detalhe: x.detalhe ?? '', motivo: x.motivo ?? '', ...(x.fonte ? { fonte: x.fonte } : {}), ...(x.link ? { link: [x.link.rotulo, x.link.url] as [string, string] } : {}) }
    ;(x.tipo === 'documento' ? docs : passos).push(item)
  }
  for (const p of plano.perguntas) if (r[p.id] === 'Não sei') confirmar.push(`Você não soube responder: “${p.texto}” Confira no edital ou pergunte à instituição.`)
  return { docs, passos, confirmar }
}
