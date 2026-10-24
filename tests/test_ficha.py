import copy
import json
from datetime import date

import pytest

from ponte.fatos import Caso
from ponte.ficha import PASTA_DAS_FICHAS, FichaInvalida, ler_ficha, para_json
from ponte.motor import gerar_plano
from ponte.resumo import gerar_resumo

DADOS = json.loads((PASTA_DAS_FICHAS / "ufac-proaes-01-2026.json").read_text(encoding="utf-8"))


def com_alteracao(alterar):
    dados = copy.deepcopy(DADOS)
    alterar(dados)
    return dados


def orientacao(dados, chave):
    return next(modelo for modelo in dados["orientacoes"] if modelo["chave"] == chave)


def test_ficha_do_edital_01_2026_e_valida():
    ficha = ler_ficha(DADOS)
    assert ficha.edital.numero == "01/2026"
    assert not ficha.geracao.automatica


@pytest.mark.parametrize(
    ("descricao", "alterar", "trecho_do_problema"),
    [
        ("fonte inexistente", lambda d: orientacao(d, "6.8")["fontes"].append("9.9"), "fonte 9.9 inexistente"),
        (
            "valor fora das opções",
            lambda d: orientacao(d, "6.10")["quando"].update(igual="talvez"),
            "valor talvez não existe em beneficio_anterior",
        ),
        (
            "campo inexistente no requisito",
            lambda d: d["ramos"][0]["requisitos"].append({"campo": "renda", "atende": ["sim"]}),
            "campo renda inexistente",
        ),
        (
            "marcador desconhecido",
            lambda d: orientacao(d, "6.8").update(titulo="Consulte {valor:renda}"),
            "valor:renda usa campo inexistente",
        ),
        ("chave fora do formato", lambda d: orientacao(d, "6.8").update(titulo="Consulte {algo}"), "marcador desconhecido"),
        (
            "condição desconhecida",
            lambda d: orientacao(d, "6.8").update(quando={"sempre": True}),
            "condição desconhecida",
        ),
        (
            "trecho em página inexistente",
            lambda d: d["trechos"][0].update(pagina=42),
            "página 42 fora do documento",
        ),
    ],
)
def test_ficha_com_referencia_invalida_e_recusada(descricao, alterar, trecho_do_problema):
    with pytest.raises(FichaInvalida) as erro:
        ler_ficha(com_alteracao(alterar))
    assert any(trecho_do_problema in problema for problema in erro.value.problemas), erro.value.problemas


def test_ficha_sem_parte_obrigatoria_e_recusada():
    with pytest.raises(FichaInvalida):
        ler_ficha(com_alteracao(lambda d: d.pop("ramos")))


def test_resumo_avisa_quando_a_ficha_foi_gerada_automaticamente():
    dados = com_alteracao(
        lambda d: d.update(geracao={"modo": "gemma", "descricao": "teste", "modelo": "gemma-teste", "gerada_em": "2026-10-24"})
    )
    ficha = ler_ficha(dados)
    caso = Caso.novo(ficha.campos, date(2026, 10, 24))
    resumo = gerar_resumo(ficha, caso, gerar_plano(ficha, caso))
    assert "gemma-teste" in resumo
    assert "sem revisão humana" in resumo


def test_dependencias_sao_derivadas_da_condicao_quando_a_ficha_nao_as_declara():
    dados = com_alteracao(lambda d: orientacao(d, "esclarecer.perdeu_documentos").pop("depende_de"))
    ficha = ler_ficha(dados)
    plano = gerar_plano(ficha, Caso.novo(ficha.campos, date(2026, 10, 24)))
    pergunta = next(o for o in plano.orientacoes if o.chave == "esclarecer.perdeu_documentos")
    assert pergunta.depende_de == ("perdeu_documentos", "aconteceu_com_voce")


def test_ficha_serializada_e_lida_de_novo_fica_igual():
    ficha = ler_ficha(DADOS)
    assert ler_ficha(json.loads(json.dumps(para_json(ficha)))) == ficha
