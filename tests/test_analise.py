"""Análise de edital com respostas preparadas no lugar do Gemma, usando os PDFs reais do Edital 01/2026."""

import json
import re
from datetime import date
from types import SimpleNamespace

import pytest

from ponte.analise import (
    INSTRUCOES_DAS_ORIENTACOES,
    INSTRUCOES_DOS_CAMPOS,
    INSTRUCOES_DOS_METADADOS,
    INSTRUCOES_DOS_TRECHOS,
    FalhaNaAnalise,
    analisar_edital,
    ler_documento,
)
from ponte.fatos import Caso
from ponte.ficha import RAIZ, ler_ficha, para_json
from ponte.motor import gerar_plano
from ponte.plano import Tipo

HOJE = date(2026, 10, 24)
PASTA = RAIZ / "fontes" / "ufac-proaes-01-2026"
DOCUMENTOS = [
    ler_documento("edital", "https://exemplo/edital.pdf", PASTA / "sei_1956124_edital_01.pdf"),
    ler_documento("anexos", "https://exemplo/anexos.pdf", PASTA / "anexos-auxilio-emergencial-2026.pdf"),
]
TEXTO_2_2_B = "Estudante obrigado a sair da própria residência em virtude da ocorrência de alagação, incêndio ou outro evento adverso;"
TEXTO_2_2_2 = (
    "A situação será considerada emergência se o fator motivador da incapacidade temporária no suprimento das "
    "necessidades básica tiver ocorrido em no máximo 90 dias anteriores à solicitação do presente auxílio."
)
TEXTO_6_9 = "poderá incluir no sistema de Bolsas e Auxílios os documentos que possui"

RESPOSTA_DOS_TRECHOS = {
    "edital": {"instituicao": "Universidade Federal do Acre", "orgao": "Proaes", "numero": "01/2026", "processo": "23107.000688/2026-82",
               "objeto": "Auxílio Emergencial", "assinado_em": "2026-01-23", "canais_de_duvida": ["coaps.dae@ufac.br"]},
    "documentos": [{"chave": "edital", "titulo": "Edital nº 01/2026"}],
    "trechos": [
        {"chave": "2.2.b", "rotulo": "Item 2.2, alínea b", "documento": "edital", "pagina": 2, "texto": TEXTO_2_2_B},
        {"chave": "2.2.2", "rotulo": "Item 2.2.2", "documento": "edital", "pagina": 2, "texto": TEXTO_2_2_2},
        {"chave": "6.9", "rotulo": "Item 6.9", "documento": "edital", "pagina": 2, "texto": TEXTO_6_9},
        {"chave": "9.9", "rotulo": "Item 9.9", "documento": "edital", "pagina": 5, "texto": "O auxílio será pago em dobro para todos."},
    ],
}
SIM_NAO = {"sim": "Sim", "nao": "Não", "nao_sei": "Não sei"}
RESPOSTA_DOS_CAMPOS = {
    "limite": "Esta ficha consulta a saída da residência por evento adverso. A análise do pedido é da instituição.",
    "campos": [
        {"chave": "aconteceu_com_voce", "pergunta": "A situação aconteceu com você?", "rotulo": "Aconteceu com você", "tipo": "escolha",
         "opcoes": {"sim": "Sim", "outra_pessoa": "Outra pessoa", "nao_sei": "Não sei"}, "por_evento": True},
        {"chave": "saiu", "pergunta": "Você precisou sair da sua residência?", "rotulo": "Saída da residência", "tipo": "escolha",
         "opcoes": SIM_NAO, "por_evento": True, "identifica_evento": True},
        {"chave": "perdeu_documentos", "pergunta": "Você perdeu documentos pessoais?", "rotulo": "Perda de documentos", "tipo": "escolha", "opcoes": SIM_NAO},
        {"chave": "data_evento", "pergunta": "Data do acontecimento", "rotulo": "Data do acontecimento", "tipo": "data", "por_evento": True, "identifica_evento": True},
        {"chave": "data_referencia", "pergunta": "Data do pedido", "rotulo": "Data de referência", "tipo": "data", "extraivel": False, "padrao": "hoje"},
        {"chave": "renda", "pergunta": "Qual sua renda?", "rotulo": "Renda", "tipo": "numero"},
        {"chave": "elegivel", "pergunta": "Você é elegível ao auxílio?", "rotulo": "Elegível", "tipo": "escolha", "opcoes": SIM_NAO},
    ],
    "ramos": [
        {"chave": "2.2.b", "descricao": "Estudante obrigado a sair da própria residência por evento adverso.", "fontes": ["2.2.b", "inexistente"],
         "requisitos": [
             {"campo": "aconteceu_com_voce", "atende": ["sim"], "contraria": {"outra_pessoa": "Você informou que aconteceu com outra pessoa."}},
             {"campo": "saiu", "atende": ["sim"], "contraria": {"nao": "Você informou que não precisou sair."}},
             {"campo": "perdeu_documentos", "atende": ["sim"], "contraria": {"nao": "Você informou que não perdeu documentos."}},
             {"campo": "renda", "atende": ["baixa"]},
         ],
         "prazo": {"inicio": "data_evento", "fim": "data_referencia", "dias": 90,
                   "frase_fora": "Pelas datas informadas, passaram {dias} dias, mais que os {limite} dias do item 2.2.2."},
         "textos": {"faltando": "Falta informar: {campos}."}},
        {"chave": "fantasma", "descricao": "Ramo sem base", "fontes": ["nao-existe"], "requisitos": [{"campo": "saiu", "atende": ["sim"]}]},
    ],
}
RESPOSTA_DAS_ORIENTACOES = {
    "orientacoes": [
        {"chave": "documentos", "tipo": "passo", "quando": {"ramo": "2.2.b", "estado": "personalizavel"},
         "titulo": "Separe os documentos que você ainda possui", "instrucao": "O item 6.9 permite incluir os documentos que você possui.",
         "motivo": "Você informou que saiu da residência e perdeu documentos.", "fontes": ["6.9"]},
        {"chave": "prazo", "tipo": "passo", "quando": {"prazo": "2.2.b", "estado": "dentro"},
         "titulo": "Observe o prazo de {prazo:limite} dias", "instrucao": "O prazo vai até {prazo:data_final}.",
         "motivo": "O item 2.2.2 fixa o prazo.", "fontes": ["2.2.2"]},
        {"chave": "fora", "tipo": "nao_avaliado", "quando": {"ramo": "2.2.b", "estado": "com_contrarios"},
         "titulo": "Esta situação do edital não corresponde às informações atuais", "instrucao": "{ramo:contrarios}",
         "motivo": "Isso não significa ausência de direito ou de outra alternativa.", "fontes": ["2.2.b"]},
        {"chave": "eleg", "tipo": "passo", "quando": {"ramo": "2.2.b", "estado": "personalizavel"},
         "titulo": "Comemore", "instrucao": "Você é elegível ao auxílio.", "motivo": "Tudo certo.", "fontes": ["6.9"]},
        {"chave": "fonte-falsa", "tipo": "referencia", "quando": {"ramo": "2.2.b", "estado": "personalizavel"},
         "titulo": "Veja o item 9.9", "instrucao": "...", "motivo": "...", "fontes": ["9.9"]},
        {"chave": "marcador", "tipo": "passo", "quando": {"ramo": "2.2.b", "estado": "personalizavel"},
         "titulo": "Informe {valor:renda}", "instrucao": "...", "motivo": "...", "fontes": ["6.9"]},
    ]
}


class GemmaPreparado:
    def __init__(self, respostas: dict[str, dict]):
        self.respostas = respostas
        self.etapas = []
        self.models = SimpleNamespace(generate_content=self._gerar)

    def _gerar(self, model, contents, config):
        etapa = {
            INSTRUCOES_DOS_METADADOS: "metadados",
            INSTRUCOES_DOS_TRECHOS: "trechos",
            INSTRUCOES_DOS_CAMPOS: "campos",
            INSTRUCOES_DAS_ORIENTACOES: "orientacoes",
        }[config.system_instruction]
        self.etapas.append(etapa)
        if etapa == "metadados":
            resposta = {chave: self.respostas["trechos"][chave] for chave in ("edital", "documentos")}
        elif etapa == "trechos":
            documento, pagina = re.match(r"=== documento: (\w+) \| página (\d+) ===", contents).groups()
            resposta = {"trechos": [t for t in self.respostas["trechos"]["trechos"] if t["documento"] == documento and t["pagina"] == int(pagina)]}
        else:
            resposta = self.respostas[etapa]
        return SimpleNamespace(text=json.dumps(resposta, ensure_ascii=False))


def analisar(respostas=None):
    respostas = respostas or {"trechos": RESPOSTA_DOS_TRECHOS, "campos": RESPOSTA_DOS_CAMPOS, "orientacoes": RESPOSTA_DAS_ORIENTACOES}
    return analisar_edital("teste-01-2026", DOCUMENTOS, "https://exemplo/pagina", GemmaPreparado(respostas), HOJE)


def test_ficha_gerada_e_valida_e_marcada_como_automatica():
    ficha, _ = analisar()
    assert ler_ficha(json.loads(json.dumps(para_json(ficha)))) == ficha
    assert ficha.geracao.automatica
    assert ficha.documentos["edital"].titulo == "Edital nº 01/2026"
    assert ficha.documentos["anexos"].titulo == "anexos-auxilio-emergencial-2026.pdf"


def test_trechos_sao_conferidos_na_pagina_e_os_inventados_descartados():
    ficha, relatorio = analisar()
    assert set(ficha.trechos) == {"2.2.b", "2.2.2", "6.9"}
    assert ficha.trechos["6.9"].pagina == 3
    assert "trecho 6.9: página corrigida de 2 para 3" in relatorio.correcoes
    assert any("trecho 9.9: texto não encontrado" in item for item in relatorio.descartes)
    assert any("metadados" in etapa for etapa in relatorio.etapas)
    assert sum("trechos de" in etapa for etapa in relatorio.etapas) == sum(1 for d in DOCUMENTOS for p in d.paginas if p.strip())


def test_campos_e_requisitos_invalidos_ou_sobre_elegibilidade_sao_descartados():
    ficha, relatorio = analisar()
    assert set(ficha.campos) == {"aconteceu_com_voce", "saiu", "perdeu_documentos", "data_evento", "data_referencia"}
    assert any("elegivel: pergunta sobre elegibilidade" in item for item in relatorio.descartes)
    ramo = ficha.ramos["2.2.b"]
    assert [requisito.campo for requisito in ramo.requisitos] == ["aconteceu_com_voce", "saiu", "perdeu_documentos"]
    assert ramo.fontes == ("2.2.b",)
    assert "fantasma" not in ficha.ramos


def test_orientacoes_com_elegibilidade_fonte_ou_marcador_invalidos_sao_descartadas():
    ficha, relatorio = analisar()
    chaves = {modelo.chave for modelo in ficha.orientacoes}
    assert {"2.2.b.documentos", "2.2.b.prazo", "2.2.b.fora", "2.2.b.geral"} <= chaves
    assert not {"2.2.b.eleg", "2.2.b.fonte-falsa", "2.2.b.marcador"} & chaves
    assert any("linguagem de elegibilidade" in item for item in relatorio.descartes)


def test_perguntas_factuais_sao_montadas_sem_o_modelo_para_cada_campo_dos_ramos():
    ficha, _ = analisar()
    perguntas = {modelo.chave for modelo in ficha.orientacoes if modelo.tipo is Tipo.ESCLARECER}
    assert perguntas == {f"esclarecer.{campo}" for campo in ficha.ramos["2.2.b"].campos}


def test_ficha_gerada_funciona_no_motor():
    ficha, _ = analisar()
    caso = Caso.novo(ficha.campos, HOJE)
    for chave, valor in {"aconteceu_com_voce": "sim", "saiu": "sim", "perdeu_documentos": "sim", "data_evento": date(2026, 10, 10), "data_referencia": HOJE}.items():
        caso = caso.informar(chave, valor)
    assert {"2.2.b.documentos", "2.2.b.prazo"} <= {o.chave for o in gerar_plano(ficha, caso).do_tipo(Tipo.PASSO)}
    sem_saida = gerar_plano(ficha, caso.informar("saiu", "nao"))
    fora = next(o for o in sem_saida.orientacoes if o.chave == "2.2.b.fora")
    assert fora.instrucao == "Você informou que não precisou sair."
    assert "2.2.b.documentos" not in sem_saida.chaves()


def test_sem_trecho_encontrado_a_analise_falha():
    sem_trechos = {**RESPOSTA_DOS_TRECHOS, "trechos": [RESPOSTA_DOS_TRECHOS["trechos"][3]]}
    with pytest.raises(FalhaNaAnalise):
        analisar({"trechos": sem_trechos, "campos": RESPOSTA_DOS_CAMPOS, "orientacoes": RESPOSTA_DAS_ORIENTACOES})
