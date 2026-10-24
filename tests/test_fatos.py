from datetime import date

import pytest

from ponte.fatos import NAO_SEI, Caso, Estado, Fato, Origem, resultado_ainda_vale, versao_do_relato
from ponte.ficha import carregar_ficha

HOJE = date(2026, 10, 24)
RELATO = "Minha casa foi alagada e precisei sair."
FICHA = carregar_ficha("ufac-proaes-01-2026")


def sugestao(valor, trecho="trecho"):
    return Fato(valor=valor, estado=Estado.A_CONFERIR, origem=Origem.RELATO, trecho=trecho)


def test_caso_novo_traz_data_de_referencia_a_conferir():
    caso = Caso.novo(FICHA.campos, HOJE)
    assert caso.fatos["data_referencia"].estado is Estado.A_CONFERIR
    assert caso.valor("data_referencia") is None


def test_sugestao_nao_conferida_conta_como_desconhecida():
    caso = Caso.novo(FICHA.campos, HOJE).aplicar_sugestoes({"saiu_da_residencia": sugestao("sim")}, versao_do_relato(RELATO))
    assert caso.valor("saiu_da_residencia") is None
    assert caso.confirmar("saiu_da_residencia").valor("saiu_da_residencia") == "sim"


def test_nao_sei_nao_equivale_a_resposta_negativa():
    caso = Caso.novo(FICHA.campos, HOJE).informar("saiu_da_residencia", NAO_SEI)
    assert caso.fatos["saiu_da_residencia"].estado is Estado.NAO_SEI
    assert caso.valor("saiu_da_residencia") is None


def test_correcao_registra_declaracao_sem_nova_confirmacao():
    caso = Caso.novo(FICHA.campos, HOJE).informar("saiu_da_residencia", "nao")
    assert caso.fatos["saiu_da_residencia"].estado is Estado.INFORMADO
    assert caso.valor("saiu_da_residencia") == "nao"


def test_confirmar_exige_sugestao_pendente():
    with pytest.raises(ValueError):
        Caso.novo(FICHA.campos, HOJE).informar("saiu_da_residencia", "sim").confirmar("saiu_da_residencia")


def test_sugestao_nao_pode_chegar_confirmada_nem_alterar_data_de_referencia():
    confirmada = Fato(valor="sim", estado=Estado.CONFIRMADO, origem=Origem.RELATO)
    with pytest.raises(ValueError):
        Caso.novo(FICHA.campos, HOJE).aplicar_sugestoes({"saiu_da_residencia": confirmada}, "v1")
    with pytest.raises(ValueError):
        Caso.novo(FICHA.campos, HOJE).aplicar_sugestoes({"data_referencia": sugestao(HOJE)}, "v1")


def test_novo_relato_descarta_confirmacoes_anteriores_e_preserva_declaracoes_diretas():
    caso = (
        Caso.novo(FICHA.campos, HOJE)
        .aplicar_sugestoes({"saiu_da_residencia": sugestao("sim"), "perdeu_documentos": sugestao("sim")}, "v1")
        .confirmar("saiu_da_residencia")
        .confirmar("perdeu_documentos")
        .informar("dificuldade_moradia", "sim")
    )
    novo = caso.aplicar_sugestoes({"saiu_da_residencia": sugestao("nao")}, "v2")
    assert novo.fatos["saiu_da_residencia"].estado is Estado.A_CONFERIR
    assert novo.fatos["perdeu_documentos"].estado is Estado.SEM_RESPOSTA
    assert novo.valor("dificuldade_moradia") == "sim"
    assert novo.versao_relato == "v2"


def test_novo_relato_sugerindo_campo_informado_volta_a_exigir_conferencia():
    caso = Caso.novo(FICHA.campos, HOJE).informar("perdeu_documentos", "nao")
    novo = caso.aplicar_sugestoes({"perdeu_documentos": sugestao("sim")}, "v1")
    assert novo.fatos["perdeu_documentos"].estado is Estado.A_CONFERIR
    assert novo.valor("perdeu_documentos") is None


def test_resposta_atrasada_e_descartada_apos_edicao_manual():
    caso = Caso.novo(FICHA.campos, HOJE)
    revisao_no_pedido = caso.revisao
    editado = caso.informar("saiu_da_residencia", "nao")
    assert resultado_ainda_vale(caso, revisao_no_pedido, RELATO, RELATO)
    assert not resultado_ainda_vale(editado, revisao_no_pedido, RELATO, RELATO)


def test_resposta_atrasada_e_descartada_se_o_relato_mudou():
    caso = Caso.novo(FICHA.campos, HOJE)
    assert not resultado_ainda_vale(caso, caso.revisao, RELATO, "Outro relato completamente diferente.")
