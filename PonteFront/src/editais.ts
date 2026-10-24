/* Catálogo do protótipo: fonte única dos dados de editais usados em todas as telas.
   Só editais com `fontes` são reais (hoje, o Edital 01/2026 da Proaes/UFAC, com orientação guiada);
   os demais são exemplos fictícios para demonstrar busca, filtros e ordenação.
   No produto, viria de uma coleta periódica das páginas oficiais das instituições. */

/* Data de referência única do produto: situação das inscrições, prazos e data de referência do fluxo guiado.
   O protótipo usa uma data fixa de cenário para que a demonstração seja reproduzível. */
export const HOJE = '2026-10-24'
export const HOJE_ORIGEM = 'data do cenário do protótipo'

export type Instituicao = { id: string; sigla: string; nome: string; campus: string; cidade: string; uf: string; lat: number; lng: number; site: string }
export type Edital = {
  id: string; inst: string; numero: string; titulo: string; centro: string; area: string; tipo: string
  publico: string; publicado: string; inicio: string; fim: string; valor: number | null; vagas: number | null
  resumo: string; guiado?: boolean
  /* Presente só em editais reais. `notaDatas` avisa quando o cronograma exibido não é o oficial. */
  fontes?: { pagina: string; edital: string; anexos?: string; processo?: string; consultadoEm: string; notaDatas?: string }
}
export const ficticio = (e: Edital) => !e.fontes

export const AREAS = ['Assistência estudantil', 'Pesquisa', 'Extensão', 'Ensino', 'Inovação', 'Esporte e cultura']

export const INSTITUICOES: Instituicao[] = [
  { id: 'ufac-rb', sigla: 'UFAC', nome: 'Universidade Federal do Acre', campus: 'Campus Rio Branco', cidade: 'Rio Branco', uf: 'AC', lat: -9.957, lng: -67.869, site: 'https://www.ufac.br' },
  { id: 'ufac-czs', sigla: 'UFAC', nome: 'Universidade Federal do Acre', campus: 'Campus Floresta', cidade: 'Cruzeiro do Sul', uf: 'AC', lat: -7.631, lng: -72.67, site: 'https://www.ufac.br' },
  { id: 'ifac-rb', sigla: 'IFAC', nome: 'Instituto Federal do Acre', campus: 'Campus Rio Branco', cidade: 'Rio Branco', uf: 'AC', lat: -9.975, lng: -67.81, site: 'https://www.ifac.edu.br' },
  { id: 'ufam', sigla: 'UFAM', nome: 'Universidade Federal do Amazonas', campus: 'Campus Manaus', cidade: 'Manaus', uf: 'AM', lat: -3.09, lng: -59.965, site: 'https://ufam.edu.br' },
  { id: 'uea', sigla: 'UEA', nome: 'Universidade do Estado do Amazonas', campus: 'Escola Superior de Tecnologia', cidade: 'Manaus', uf: 'AM', lat: -3.09, lng: -60.02, site: 'https://www.uea.edu.br' },
  { id: 'unir', sigla: 'UNIR', nome: 'Universidade Federal de Rondônia', campus: 'Campus Porto Velho', cidade: 'Porto Velho', uf: 'RO', lat: -8.83, lng: -63.94, site: 'https://www.unir.br' },
  { id: 'ufrr', sigla: 'UFRR', nome: 'Universidade Federal de Roraima', campus: 'Campus Paricarana', cidade: 'Boa Vista', uf: 'RR', lat: 2.83, lng: -60.69, site: 'https://ufrr.br' },
  { id: 'ufpa', sigla: 'UFPA', nome: 'Universidade Federal do Pará', campus: 'Campus Belém', cidade: 'Belém', uf: 'PA', lat: -1.475, lng: -48.455, site: 'https://portal.ufpa.br' },
  { id: 'unifap', sigla: 'UNIFAP', nome: 'Universidade Federal do Amapá', campus: 'Campus Marco Zero', cidade: 'Macapá', uf: 'AP', lat: 0.006, lng: -51.08, site: 'https://www.unifap.br' },
  { id: 'uft', sigla: 'UFT', nome: 'Universidade Federal do Tocantins', campus: 'Campus Palmas', cidade: 'Palmas', uf: 'TO', lat: -10.18, lng: -48.36, site: 'https://www.uft.edu.br' },
]

const AE = 'Assistência estudantil'
const UFAC_01 = 'https://www3.ufac.br/proaes/2026/edital-ndeg-01-2026-proaes-selecao-do-programa-de-auxilio-emergencial-e-01-26'
export const EDITAIS: Edital[] = [
  { id: 'ufac-01-2026', inst: 'ufac-rb', numero: 'Edital 01/2026', titulo: 'Programa de Auxílio Emergencial', centro: 'Pró-Reitoria de Assuntos Estudantis (Proaes)', area: AE, tipo: 'Auxílio emergencial', publico: 'Graduação', publicado: '2026-10-01', inicio: '2026-10-05', fim: '2026-11-06', valor: null, vagas: null, resumo: 'Seleção para auxílio emergencial. Inclui situações de saída da própria residência por evento adverso e perda de documentos pessoais.', guiado: true,
    fontes: { pagina: UFAC_01, edital: UFAC_01 + '/sei_1956124_edital_01.pdf', anexos: UFAC_01 + '/anexos-auxilio-emergencial-2026.pdf', processo: '23107.000688/2026-82', consultadoEm: HOJE, notaDatas: 'Datas do cenário do protótipo. Confira o cronograma na página oficial.' } },
  { id: 'ufac-03-2026', inst: 'ufac-rb', numero: 'Edital 03/2026', titulo: 'Auxílio Moradia', centro: 'Pró-Reitoria de Assuntos Estudantis (Proaes)', area: AE, tipo: 'Moradia', publico: 'Graduação', publicado: '2026-09-15', inicio: '2026-09-20', fim: '2026-10-30', valor: 500, vagas: 120, resumo: 'Apoio mensal para estudantes que moram longe da família e pagam aluguel.' },
  { id: 'ufac-12-2026', inst: 'ufac-rb', numero: 'Edital 12/2026', titulo: 'PIBIC 2026–2027', centro: 'Pró-Reitoria de Pesquisa e Pós-Graduação (Propeg)', area: 'Pesquisa', tipo: 'Iniciação científica', publico: 'Graduação', publicado: '2026-08-10', inicio: '2026-08-15', fim: '2026-09-15', valor: 700, vagas: 80, resumo: 'Bolsas de iniciação científica vinculadas a projetos de docentes orientadores.' },
  { id: 'ufac-07-2026', inst: 'ufac-rb', numero: 'Edital 07/2026', titulo: 'Bolsas de extensão universitária', centro: 'Pró-Reitoria de Extensão e Cultura (Proex)', area: 'Extensão', tipo: 'Extensão', publico: 'Graduação', publicado: '2026-10-20', inicio: '2026-11-03', fim: '2026-11-24', valor: 700, vagas: 40, resumo: 'Bolsas para atuação em projetos e programas de extensão com a comunidade.' },
  { id: 'ufac-05-2026', inst: 'ufac-rb', numero: 'Edital 05/2026', titulo: 'Monitoria acadêmica', centro: 'Centro de Ciências da Saúde e do Desporto (CCSD)', area: 'Ensino', tipo: 'Monitoria', publico: 'Graduação', publicado: '2026-10-10', inicio: '2026-10-12', fim: '2026-10-28', valor: 400, vagas: 30, resumo: 'Monitoria em disciplinas dos cursos do centro, com carga de 12 horas semanais.' },
  { id: 'ufac-czs-02-2026', inst: 'ufac-czs', numero: 'Edital 02/2026', titulo: 'Auxílio Alimentação', centro: 'Pró-Reitoria de Assuntos Estudantis (Proaes)', area: AE, tipo: 'Alimentação', publico: 'Graduação', publicado: '2026-10-14', inicio: '2026-10-15', fim: '2026-11-10', valor: 300, vagas: 60, resumo: 'Auxílio para alimentação de estudantes do Campus Floresta.' },
  { id: 'ifac-18-2026', inst: 'ifac-rb', numero: 'Edital 18/2026', titulo: 'Auxílio Inclusão Digital', centro: 'Diretoria de Assuntos Estudantis', area: AE, tipo: 'Inclusão digital', publico: 'Técnico e graduação', publicado: '2026-10-05', inicio: '2026-10-06', fim: '2026-10-31', valor: 150, vagas: 200, resumo: 'Auxílio para contratação de internet e acesso a equipamentos para estudo.' },
  { id: 'ufam-21-2026', inst: 'ufam', numero: 'Edital 21/2026', titulo: 'Auxílio Acadêmico', centro: 'Pró-Reitoria de Gestão Comunitária', area: AE, tipo: 'Permanência', publico: 'Graduação', publicado: '2026-10-18', inicio: '2026-10-20', fim: '2026-11-14', valor: 400, vagas: 300, resumo: 'Auxílio para permanência de estudantes em situação de vulnerabilidade socioeconômica.' },
  { id: 'ufam-09-2026', inst: 'ufam', numero: 'Edital 09/2026', titulo: 'Programa de Apoio à Iniciação Científica', centro: 'Pró-Reitoria de Pesquisa e Pós-Graduação', area: 'Pesquisa', tipo: 'Iniciação científica', publico: 'Graduação', publicado: '2026-09-01', inicio: '2026-09-02', fim: '2026-10-02', valor: 700, vagas: 150, resumo: 'Bolsas de iniciação científica com duração de 12 meses.' },
  { id: 'ufam-14-2026', inst: 'ufam', numero: 'Edital 14/2026', titulo: 'Bolsas de inovação tecnológica', centro: 'Agência de Inovação', area: 'Inovação', tipo: 'Inovação', publico: 'Graduação e pós-graduação', publicado: '2026-10-22', inicio: '2026-10-26', fim: '2026-11-30', valor: 800, vagas: 25, resumo: 'Bolsas para projetos de desenvolvimento tecnológico com parceiros externos.' },
  { id: 'uea-33-2026', inst: 'uea', numero: 'Edital 33/2026', titulo: 'Auxílio Transporte', centro: 'Pró-Reitoria de Extensão e Assuntos Comunitários', area: AE, tipo: 'Transporte', publico: 'Graduação', publicado: '2026-10-03', inicio: '2026-10-05', fim: '2026-10-25', valor: 200, vagas: 180, resumo: 'Apoio para deslocamento até a unidade acadêmica.' },
  { id: 'unir-06-2026', inst: 'unir', numero: 'Edital 06/2026', titulo: 'Auxílio Emergencial', centro: 'Pró-Reitoria de Cultura, Extensão e Assuntos Estudantis', area: AE, tipo: 'Auxílio emergencial', publico: 'Graduação', publicado: '2026-10-12', inicio: '2026-10-13', fim: '2026-11-13', valor: 400, vagas: 80, resumo: 'Auxílio pontual para estudantes afetados por situações imprevistas.' },
  { id: 'unir-11-2026', inst: 'unir', numero: 'Edital 11/2026', titulo: 'Monitoria — Núcleo de Saúde', centro: 'Núcleo de Saúde', area: 'Ensino', tipo: 'Monitoria', publico: 'Graduação', publicado: '2026-09-28', inicio: '2026-10-01', fim: '2026-10-20', valor: 400, vagas: 20, resumo: 'Monitoria em disciplinas básicas dos cursos de saúde.' },
  { id: 'ufrr-04-2026', inst: 'ufrr', numero: 'Edital 04/2026', titulo: 'Bolsa Esporte Universitário', centro: 'Pró-Reitoria de Assuntos Estudantis e Extensão', area: 'Esporte e cultura', tipo: 'Esporte', publico: 'Graduação', publicado: '2026-10-16', inicio: '2026-10-19', fim: '2026-11-09', valor: 350, vagas: 40, resumo: 'Bolsas para estudantes-atletas que representam a universidade em competições.' },
  { id: 'ufpa-27-2026', inst: 'ufpa', numero: 'Edital 27/2026', titulo: 'PIBIC Ações Afirmativas', centro: 'Pró-Reitoria de Pesquisa e Pós-Graduação (Propesp)', area: 'Pesquisa', tipo: 'Iniciação científica', publico: 'Graduação', publicado: '2026-10-21', inicio: '2026-11-02', fim: '2026-12-01', valor: 700, vagas: 100, resumo: 'Iniciação científica com vagas para estudantes ingressantes por ações afirmativas.' },
  { id: 'ufpa-15-2026', inst: 'ufpa', numero: 'Edital 15/2026', titulo: 'Auxílio Moradia', centro: 'Superintendência de Assistência Estudantil (Saest)', area: AE, tipo: 'Moradia', publico: 'Graduação', publicado: '2026-10-08', inicio: '2026-10-09', fim: '2026-11-03', valor: 530, vagas: 150, resumo: 'Auxílio mensal para estudantes que não residem com a família em Belém.' },
  { id: 'unifap-08-2026', inst: 'unifap', numero: 'Edital 08/2026', titulo: 'Bolsas de extensão em cultura', centro: 'Pró-Reitoria de Extensão e Ações Comunitárias', area: 'Esporte e cultura', tipo: 'Extensão', publico: 'Graduação', publicado: '2026-10-11', inicio: '2026-10-14', fim: '2026-11-05', valor: 700, vagas: 30, resumo: 'Bolsas para projetos culturais desenvolvidos com comunidades do Amapá.' },
  { id: 'uft-19-2026', inst: 'uft', numero: 'Edital 19/2026', titulo: 'Bolsas de mestrado', centro: 'Pró-Reitoria de Pesquisa e Pós-Graduação (Propesq)', area: 'Pesquisa', tipo: 'Pós-graduação', publico: 'Pós-graduação', publicado: '2026-10-02', inicio: '2026-10-05', fim: '2026-11-20', valor: 2100, vagas: 12, resumo: 'Bolsas para estudantes regularmente matriculados em programas de mestrado.' },
]

export type Situacao = 'aberto' | 'em_breve' | 'encerrado'
export const dia = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5
export const fmt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
export const fmtCurto = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`
export const real = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const situacao = (e: Edital): Situacao => { const h = dia(HOJE); return h < dia(e.inicio) ? 'em_breve' : h > dia(e.fim) ? 'encerrado' : 'aberto' }
export const INST = Object.fromEntries(INSTITUICOES.map(i => [i.id, i])) as Record<string, Instituicao>
export const EDITAL_GUIADO = EDITAIS.find(e => e.guiado)!
/* Nome de citação padronizado, usado em fontes, resumos e cabeçalhos. */
export const nomeEdital = (e: Edital) => `${e.numero} (${e.centro.match(/\(([^)]+)\)/)?.[1] ?? e.centro}/${INST[e.inst].sigla})`
