"""Cenários de aceitação A–K na parte determinística (fatos já declarados).

Os cenários G e K dependem da extração e da interface e são cobertos nos testes
de extração. O cenário H (novo relato e resposta atrasada) está em test_fatos.py.
"""

from datetime import date, timedelta

import pytest

from ponte.fatos import NAO_SEI, Caso, Estado, Fato, Origem
from ponte.ficha import carregar_ficha
from ponte.mudancas import comparar, descrever
from ponte.motor import gerar_plano
from ponte.plano import Plano, Tipo
from ponte.resumo import gerar_resumo

FICHA = carregar_ficha("ufac-proaes-01-2026")
REFERENCIA = date(2026, 10, 24)
EXPRESSOES_PROIBIDAS = (
    "é elegível",
    "elegibilidade confirmada",
    "tem direito",
    "sem direito",
    "sem alternativa",
    "aprovad",
    "dispensad",
    "documentação completa",
    "inscrição completa",
)
PASSOS_DO_6_9 = {"6.9.documentos-disponiveis", "6.9.anexo-vi", "6.9.comprovantes", "6.9.anexo-vii"}


def declarar(**valores) -> Caso:
    caso = Caso.novo(FICHA.campos, REFERENCIA).informar("data_referencia", REFERENCIA)
    for chave, valor in valores.items():
        caso = caso.informar(chave, valor)
    return caso


def caso_claro(**alteracoes) -> Caso:
    valores = dict(
        aconteceu_com_voce="sim",
        acontecimento="alagacao",
        saiu_da_residencia="sim",
        data_evento=date(2026, 10, 10),
        perdeu_documentos="sim",
    )
    valores.update(alteracoes)
    return declarar(**valores)


def chaves(plano: Plano, tipo: Tipo) -> set[str]:
    return {orientacao.chave for orientacao in plano.do_tipo(tipo)}


def textos(plano: Plano) -> str:
    return " ".join(
        f"{o.titulo} {o.instrucao} {o.motivo} {o.pendencia}" for o in plano.orientacoes
    ).lower()


CENARIOS = {
    "A": caso_claro(),
    "B": caso_claro(saiu_da_residencia="nao"),
    "C": caso_claro(data_evento=NAO_SEI),
    "D-terceiro": caso_claro(aconteceu_com_voce="outra_pessoa"),
    "D-datas": caso_claro(data_evento=date(2026, 11, 2)),
    "F": caso_claro(acontecimento="outro", descricao_acontecimento="roubo", saiu_da_residencia="nao"),
    "I-fora": caso_claro(data_evento=REFERENCIA - timedelta(days=91)),
    "J": caso_claro(perdeu_documentos="nao"),
    "outro-evento": caso_claro(acontecimento="outro", descricao_acontecimento="desabamento"),
    "moradia": caso_claro(dificuldade_moradia="sim"),
    "vazio": Caso.novo(FICHA.campos, REFERENCIA),
}


@pytest.mark.parametrize("nome", CENARIOS)
def test_nenhuma_orientacao_sugere_elegibilidade_dispensa_ou_completude(nome):
    caso = CENARIOS[nome]
    plano = gerar_plano(FICHA, caso)
    conteudo = textos(plano) + gerar_resumo(FICHA, caso, plano).lower()
    for expressao in EXPRESSOES_PROIBIDAS:
        assert expressao not in conteudo, f"{nome}: {expressao!r}"


@pytest.mark.parametrize("nome", CENARIOS)
def test_toda_orientacao_cita_fonte_existente(nome):
    for orientacao in gerar_plano(FICHA, CENARIOS[nome]).orientacoes:
        assert orientacao.fontes, orientacao.chave
        for fonte in orientacao.fontes:
            assert fonte in FICHA.trechos, (orientacao.chave, fonte)


@pytest.mark.parametrize("nome", CENARIOS)
def test_passo_personalizado_so_depende_de_fatos_conhecidos(nome):
    caso = CENARIOS[nome]
    for orientacao in gerar_plano(FICHA, caso).do_tipo(Tipo.PASSO):
        for chave in orientacao.depende_de:
            if chave != "descricao_acontecimento":
                assert caso.valor(chave) is not None, (nome, orientacao.chave, chave)


@pytest.mark.parametrize("nome", CENARIOS)
def test_referencias_6_8_e_6_10_permanecem_visiveis(nome):
    plano = gerar_plano(FICHA, CENARIOS[nome])
    assert {"6.8", "6.10"} <= plano.chaves()


def test_a_caso_claro_mostra_passos_do_6_9_prazo_e_6_8():
    plano = gerar_plano(FICHA, CENARIOS["A"])
    assert PASSOS_DO_6_9 | {"6.8", "2.2.2.prazo"} <= chaves(plano, Tipo.PASSO)
    assert {"proaes.versao-anexo-vi", "proaes.opcao-anexo-vii"} <= chaves(plano, Tipo.PERGUNTA_PROAES)
    assert not plano.do_tipo(Tipo.ESCLARECER)
    assert "fora-do-recorte" not in plano.chaves()


def test_a_prazo_e_contado_a_partir_do_acontecimento():
    prazo = next(o for o in gerar_plano(FICHA, CENARIOS["A"]).orientacoes if o.chave == "2.2.2.prazo")
    assert "14 dias" in prazo.instrucao
    assert "08/01/2027" in prazo.instrucao


def test_b_sem_saida_da_residencia_nao_personaliza_6_9():
    plano = gerar_plano(FICHA, CENARIOS["B"])
    assert not PASSOS_DO_6_9 & plano.chaves()
    geral = next(o for o in plano.orientacoes if o.chave == "6.9.geral")
    assert "não precisou sair" in geral.motivo
    fora = next(o for o in plano.orientacoes if o.chave == "fora-do-recorte")
    assert "2.2.1" in fora.fontes
    assert fora.depende_de == ("saiu_da_residencia",)


def test_c_data_desconhecida_pergunta_a_data_e_mantem_passos_independentes():
    plano = gerar_plano(FICHA, CENARIOS["C"])
    assert "esclarecer.data_evento" in chaves(plano, Tipo.ESCLARECER)
    assert not PASSOS_DO_6_9 & plano.chaves()
    assert "fora-do-recorte" not in plano.chaves()
    assert "6.8" in chaves(plano, Tipo.PASSO)
    geral = next(o for o in plano.orientacoes if o.chave == "6.9.geral")
    assert "data do acontecimento" in geral.motivo


def test_c_saida_desconhecida_gera_pergunta_factual():
    plano = gerar_plano(FICHA, caso_claro(saiu_da_residencia=NAO_SEI))
    assert "esclarecer.saiu_da_residencia" in chaves(plano, Tipo.ESCLARECER)
    assert not PASSOS_DO_6_9 & plano.chaves()


def test_d_situacao_de_outra_pessoa_nao_vira_orientacao_pessoal():
    plano = gerar_plano(FICHA, CENARIOS["D-terceiro"])
    assert not plano.do_tipo(Tipo.PASSO)
    assert not plano.do_tipo(Tipo.ESCLARECER)
    assert "fora-do-recorte" in plano.chaves()


def test_d_data_do_acontecimento_posterior_a_referencia_pede_correcao():
    plano = gerar_plano(FICHA, CENARIOS["D-datas"])
    assert "esclarecer.datas" in chaves(plano, Tipo.ESCLARECER)
    assert "2.2.2.prazo" not in plano.chaves()
    assert not PASSOS_DO_6_9 & plano.chaves()


def test_d_sugestoes_nao_conferidas_nao_personalizam():
    sugestoes = {
        chave: Fato(valor=valor, estado=Estado.A_CONFERIR, origem=Origem.RELATO, trecho="...")
        for chave, valor in {
            "aconteceu_com_voce": "sim",
            "acontecimento": "alagacao",
            "saiu_da_residencia": "sim",
            "data_evento": date(2026, 10, 10),
            "perdeu_documentos": "sim",
        }.items()
    }
    caso = Caso.novo(FICHA.campos, REFERENCIA).informar("data_referencia", REFERENCIA).aplicar_sugestoes(sugestoes, "v1")
    assert not gerar_plano(FICHA, caso).do_tipo(Tipo.PASSO)


def test_e_correcao_retira_orientacoes_dependentes_e_atualiza_resumo():
    antes = CENARIOS["A"]
    depois = antes.informar("saiu_da_residencia", "nao")
    plano_antes, plano_depois = gerar_plano(FICHA, antes), gerar_plano(FICHA, depois)

    mudancas = comparar(antes, plano_antes, depois, plano_depois)
    retiradas = {m.orientacao.chave: m for m in mudancas if m.efeito == "retirada"}
    assert PASSOS_DO_6_9 <= retiradas.keys()
    for chave in PASSOS_DO_6_9:
        assert retiradas[chave].campos_alterados == ("saiu_da_residencia",)
    descricao = descrever(retiradas["6.9.documentos-disponiveis"], antes, depois)
    assert "“Saída da própria residência” de Sim para Não" in descricao

    resumo = gerar_resumo(FICHA, depois, plano_depois)
    assert "Separe os documentos pessoais" not in resumo
    assert "Saída da própria residência: Não" in resumo
    assert FICHA.limite in resumo
    assert FICHA.documentos["edital"].url in resumo


def test_e_desfazer_a_correcao_restaura_as_mesmas_orientacoes():
    depois = CENARIOS["A"].informar("saiu_da_residencia", "nao").informar("saiu_da_residencia", "sim")
    assert gerar_plano(FICHA, depois) == gerar_plano(FICHA, CENARIOS["A"])


def test_f_roubo_sem_saida_indica_6_8_sem_negar_alternativas():
    plano = gerar_plano(FICHA, CENARIOS["F"])
    assert "6.8" in chaves(plano, Tipo.PASSO)
    assert "fora-do-recorte" in plano.chaves()
    assert "proaes.enquadramento" not in plano.chaves()
    assert not PASSOS_DO_6_9 & plano.chaves()


@pytest.mark.parametrize(
    ("dias", "personaliza"),
    [(0, True), (89, True), (90, True), (91, False)],
)
def test_i_fronteira_dos_90_dias(dias, personaliza):
    plano = gerar_plano(FICHA, caso_claro(data_evento=REFERENCIA - timedelta(days=dias)))
    assert (PASSOS_DO_6_9 <= plano.chaves()) is personaliza
    assert ("fora-do-recorte" in plano.chaves()) is not personaliza


def test_i_fora_da_janela_cita_2_2_2_e_2_2_1():
    fora = next(o for o in gerar_plano(FICHA, CENARIOS["I-fora"]).orientacoes if o.chave == "fora-do-recorte")
    assert "91 dias" in fora.instrucao
    assert set(fora.fontes) == {"2.2.1", "2.2.2"}


def test_i_data_de_referencia_nao_conferida_impede_calculo():
    caso = Caso.novo(FICHA.campos, REFERENCIA)
    for chave, valor in dict(
        aconteceu_com_voce="sim",
        acontecimento="alagacao",
        saiu_da_residencia="sim",
        data_evento=date(2026, 10, 10),
        perdeu_documentos="sim",
    ).items():
        caso = caso.informar(chave, valor)
    plano = gerar_plano(FICHA, caso)
    assert "esclarecer.data_referencia" in chaves(plano, Tipo.ESCLARECER)
    assert "2.2.2.prazo" not in plano.chaves()
    assert not PASSOS_DO_6_9 & plano.chaves()


def test_j_saida_sem_perda_de_documentos_nao_personaliza_6_9():
    plano = gerar_plano(FICHA, CENARIOS["J"])
    assert not PASSOS_DO_6_9 & plano.chaves()
    assert "6.8" in chaves(plano, Tipo.REFERENCIA)
    fora = next(o for o in plano.orientacoes if o.chave == "fora-do-recorte")
    assert "não perdeu documentos" in fora.instrucao


def test_outro_evento_vira_pergunta_de_enquadramento_para_a_proaes():
    plano = gerar_plano(FICHA, CENARIOS["outro-evento"])
    assert not PASSOS_DO_6_9 & plano.chaves()
    enquadramento = next(o for o in plano.orientacoes if o.chave == "proaes.enquadramento")
    assert "desabamento" in enquadramento.instrucao


def test_dificuldade_com_moradia_gera_pergunta_citando_6_9_e_8_4():
    plano = gerar_plano(FICHA, CENARIOS["moradia"])
    moradia = next(o for o in plano.orientacoes if o.chave == "proaes.moradia")
    assert moradia.fontes == ("6.9", "8.4")
    fora_do_ramo = gerar_plano(FICHA, caso_claro(saiu_da_residencia="nao", dificuldade_moradia="sim"))
    assert next(o for o in fora_do_ramo.orientacoes if o.chave == "proaes.moradia").fontes == ("8.4",)


def test_6_10_so_e_personalizado_quando_o_beneficio_foi_mencionado():
    geral = next(o for o in gerar_plano(FICHA, CENARIOS["A"]).orientacoes if o.chave == "6.10")
    assert geral.depende_de == ()
    com_beneficio = gerar_plano(FICHA, caso_claro(beneficio_anterior="sim"))
    assert next(o for o in com_beneficio.orientacoes if o.chave == "6.10").depende_de == ("beneficio_anterior",)
    assert "proaes.opcao-anexo-vii" not in com_beneficio.chaves()
