import type { Edital } from './editais'

/* Preparação genérica por tipo de edital. No produto, a Gemma leria o texto do edital e geraria
   perguntas e documentos específicos, sempre com o trecho de origem. Aqui as regras são fixas por área/tipo. */

export type Pergunta = { id: string; grupo: string; texto: string; ajuda?: string; opts: string[] }
export type Item = { id: string; titulo: string; detalhe: string; motivo: string; link?: [string, string] }
export type Preparo = { resp: Record<string, string>; tenho: string[]; etapa: number; max: number }
export const PREPARO_VAZIO: Preparo = { resp: {}, tenho: [], etapa: 0, max: 0 }

const SN = ['Sim', 'Não', 'Não sei']
const assist = (e: Edital) => e.area === 'Assistência estudantil'
const academico = (e: Edital) => ['Pesquisa', 'Inovação'].includes(e.area)
const pos = (e: Edital) => e.publico.toLowerCase().includes('pós')
const pagaBolsa = (e: Edital) => e.valor !== 0

export function perguntas(e: Edital): Pergunta[] {
  const q: Pergunta[] = [
    { id: 'vinculo', grupo: 'Seu vínculo', texto: 'Você está matriculado(a) na instituição neste período?', opts: ['Sim', 'Ainda vou me matricular', 'Não sei'] },
    { id: 'outraBolsa', grupo: 'Seu vínculo', texto: 'Você recebe outra bolsa ou auxílio atualmente?', ajuda: 'Alguns editais não permitem acumular benefícios.', opts: SN },
  ]
  if (assist(e)) q.push(
    { id: 'moraCom', grupo: 'Família e moradia', texto: 'Com quem você mora?', opts: ['Com a família', 'Sozinho(a) ou com colegas', 'Outra situação'] },
    { id: 'cadunico', grupo: 'Família e moradia', texto: 'Sua família está inscrita no CadÚnico?', ajuda: 'Cadastro Único para Programas Sociais do governo federal.', opts: SN },
    { id: 'informal', grupo: 'Família e moradia', texto: 'Alguém que mora com você tem renda sem carteira assinada?', opts: SN })
  if (e.tipo === 'Moradia') q.push({ id: 'aluguel', grupo: 'Família e moradia', texto: 'Você paga aluguel onde mora?', opts: SN })
  if (e.tipo === 'Transporte') q.push({ id: 'desloc', grupo: 'Deslocamento', texto: 'Como você chega ao campus?', opts: ['Transporte público', 'Transporte próprio', 'A pé ou de bicicleta'] })
  if (e.tipo === 'Inclusão digital') q.push({ id: 'internet', grupo: 'Acesso digital', texto: 'Você tem internet em casa?', opts: ['Sim', 'Só pelo celular', 'Não'] })
  if (academico(e) || e.tipo === 'Extensão') q.push({ id: 'orientador', grupo: 'Atividade acadêmica', texto: e.tipo === 'Extensão' ? 'Você já tem um projeto ou coordenador(a) de extensão em vista?' : 'Você já tem um(a) orientador(a)?', opts: ['Sim', 'Ainda não', 'Não sei'] })
  if (academico(e) || pos(e)) q.push({ id: 'lattes', grupo: 'Atividade acadêmica', texto: 'Seu currículo Lattes está atualizado?', opts: ['Sim', 'Não', 'Não tenho currículo Lattes'] })
  if (e.tipo === 'Monitoria') q.push({ id: 'disciplina', grupo: 'Atividade acadêmica', texto: 'Você já foi aprovado(a) na disciplina em que quer ser monitor(a)?', opts: SN })
  if (e.tipo === 'Esporte') q.push({ id: 'equipe', grupo: 'Atividade esportiva', texto: 'Você participa de alguma equipe ou competição pela instituição?', opts: SN })
  if (pagaBolsa(e)) q.push({ id: 'conta', grupo: 'Recebimento', texto: 'Você tem conta bancária em seu nome?', ajuda: 'O pagamento costuma ser feito em conta do(a) próprio(a) estudante.', opts: ['Sim, conta corrente', 'Sim, só poupança ou conta digital', 'Não', 'Não sei'] })
  return q
}

export function derivarPreparo(e: Edital, r: Record<string, string>) {
  const docs: Item[] = [], passos: Item[] = [], confirmar: string[] = []
  const doc = (id: string, titulo: string, detalhe: string, motivo: string) => docs.push({ id, titulo, detalhe, motivo })
  doc('identidade', 'Documento de identidade com foto', 'RG, CNH ou outro documento oficial com foto.', 'Pedido em praticamente todos os editais.')
  doc('cpf', 'CPF', 'Pode constar no próprio documento de identidade.', 'Pedido em praticamente todos os editais.')
  doc('matricula', 'Comprovante de matrícula', 'Emitido no sistema acadêmico da instituição.', r.vinculo === 'Ainda vou me matricular' ? 'Você ainda vai se matricular: emita o comprovante assim que a matrícula for concluída.' : 'Comprova seu vínculo com a instituição.')
  if (academico(e) || pos(e) || e.tipo === 'Monitoria') doc('historico', 'Histórico acadêmico', 'Versão atualizada, emitida no sistema acadêmico.', r.disciplina === 'Sim' ? 'Mostra a aprovação na disciplina da monitoria.' : 'Editais acadêmicos costumam considerar o desempenho.')
  if (assist(e)) {
    doc('residencia', 'Comprovante de residência', 'Conta de água, luz ou internet recente.', 'Editais de assistência estudantil costumam pedir.')
    doc('renda', r.moraCom === 'Com a família' ? 'Comprovantes de renda de quem mora com você' : 'Comprovantes da sua renda', r.moraCom === 'Com a família' ? 'Contracheques, extratos de benefícios ou declarações de cada pessoa com renda.' : 'Seus comprovantes e, se houver, de quem ajuda você financeiramente.', 'A renda é usada na análise socioeconômica.')
  }
  if (r.cadunico === 'Sim') doc('cadunico', 'Comprovante do CadÚnico', 'Folha resumo do cadastro ou número do NIS.', 'Você informou que sua família está no CadÚnico.')
  if (r.informal === 'Sim') doc('informal', 'Declaração de renda informal', 'Muitos editais trazem um modelo nos anexos.', 'Você informou renda sem carteira assinada.')
  if (r.aluguel === 'Sim') doc('aluguel', 'Contrato de aluguel ou recibos', 'Contrato vigente ou recibos dos últimos meses.', 'Você informou que paga aluguel.')
  if (r.desloc === 'Transporte público') doc('transporte', 'Comprovantes de transporte', 'Cartão de transporte ou recibos de passagem.', 'Você informou que usa transporte público.')
  if (r.equipe === 'Sim') doc('equipe', 'Declaração da equipe ou federação', 'Documento que comprove sua participação.', 'Você informou que participa de equipe ou competição.')
  if (r.lattes === 'Sim') doc('lattes', 'Currículo Lattes', 'Versão atualizada, exportada em PDF.', 'Editais acadêmicos costumam pedir.')
  if (r.outraBolsa === 'Sim') { doc('outraBolsa', 'Comprovante do benefício atual', 'Termo de concessão ou extrato de pagamento.', 'Você informou que recebe outra bolsa ou auxílio.'); confirmar.push('Posso acumular este benefício com a bolsa ou o auxílio que já recebo?') }
  if (r.conta === 'Sim, conta corrente') doc('banco', 'Dados bancários', 'Banco, agência e número da conta corrente em seu nome.', 'Necessários para receber o pagamento.')

  if (r.lattes && r.lattes !== 'Sim') passos.push({ id: 'p-lattes', titulo: r.lattes === 'Não' ? 'Atualize seu currículo Lattes' : 'Crie seu currículo Lattes', detalhe: 'O cadastro é feito na Plataforma Lattes, do CNPq, e pode levar alguns dias para ser publicado.', motivo: 'Editais de pesquisa e pós-graduação costumam pedir o currículo.', link: ['Abrir a Plataforma Lattes', 'https://lattes.cnpq.br'] })
  if (r.orientador === 'Ainda não') passos.push({ id: 'p-orientador', titulo: e.tipo === 'Extensão' ? 'Procure um projeto de extensão' : 'Procure um(a) orientador(a)', detalhe: 'Consulte os projetos do centro ou da pró-reitoria e converse com docentes antes do fim das inscrições.', motivo: 'A inscrição costuma depender de um projeto vinculado.' })
  if (r.conta === 'Não') passos.push({ id: 'p-conta', titulo: 'Abra uma conta corrente em seu nome', detalhe: 'Leve documento de identidade, CPF e comprovante de residência ao banco, ou abra uma conta digital se o edital aceitar.', motivo: 'O pagamento costuma ser feito só em conta do(a) estudante.' })
  if (r.conta === 'Sim, só poupança ou conta digital') confirmar.push('Posso receber o pagamento em conta poupança ou conta digital?')
  if (r.disciplina === 'Não') confirmar.push('Posso me inscrever na monitoria de uma disciplina em que ainda não fui aprovado(a)?')
  if (r.internet === 'Só pelo celular') confirmar.push('O auxílio pode ser usado para pacote de dados no celular?')
  if (r.vinculo === 'Ainda vou me matricular') confirmar.push('Estudantes que ainda vão se matricular podem se inscrever?')
  for (const p of perguntas(e)) if (r[p.id] === 'Não sei') confirmar.push(`Você não soube responder: “${p.texto}” Confira no edital ou pergunte à instituição.`)
  confirmar.push('Os documentos podem ser enviados digitalmente ou precisam ser entregues em papel?')
  return { docs, passos, confirmar }
}
