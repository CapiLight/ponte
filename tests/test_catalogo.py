import json
import shutil

import pytest

from ponte.catalogo import atualizar_catalogo, carregar_do_catalogo, listar_editais
from ponte.ficha import PASTA_DAS_FICHAS, carregar_ficha


def test_catalogo_lista_e_devolve_as_fichas_validas(tmp_path):
    pasta = tmp_path / "fichas"
    pasta.mkdir()
    shutil.copy(PASTA_DAS_FICHAS / "ufac-proaes-01-2026.json", pasta)
    (pasta / "quebrada.json").write_text(json.dumps({"chave": "quebrada"}), encoding="utf-8")
    banco = tmp_path / "catalogo.db"

    problemas = atualizar_catalogo(banco, pasta)

    assert len(problemas) == 1 and problemas[0].startswith("quebrada.json")
    editais = listar_editais(banco)
    assert [edital.chave for edital in editais] == ["ufac-proaes-01-2026"]
    assert editais[0].geracao == "curadoria_manual"
    assert carregar_do_catalogo("ufac-proaes-01-2026", banco) == carregar_ficha("ufac-proaes-01-2026")
    with pytest.raises(KeyError):
        carregar_do_catalogo("inexistente", banco)


def test_atualizar_retira_ficha_que_saiu_da_pasta(tmp_path):
    pasta = tmp_path / "fichas"
    pasta.mkdir()
    shutil.copy(PASTA_DAS_FICHAS / "ufac-proaes-01-2026.json", pasta)
    banco = tmp_path / "catalogo.db"
    atualizar_catalogo(banco, pasta)
    (pasta / "ufac-proaes-01-2026.json").unlink()
    atualizar_catalogo(banco, pasta)
    assert listar_editais(banco) == []
