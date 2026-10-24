import hashlib
import re
from pathlib import Path

import pytest

from ponte.ficha import carregar_ficha

RAIZ = Path(__file__).resolve().parent.parent
FICHA = carregar_ficha("ufac-proaes-01-2026")


def normalizar(texto: str) -> str:
    texto = re.sub(r"\s+", " ", texto)
    texto = re.sub(r"\s+([,.;:)])", r"\1", texto)
    texto = re.sub(r"\(\s+", "(", texto)
    return texto.strip()


@pytest.mark.parametrize("documento", FICHA.documentos.values(), ids=lambda d: d.chave)
def test_copia_local_confere_com_hash_registrado(documento):
    conteudo = (RAIZ / documento.arquivo_local).read_bytes()
    assert hashlib.sha256(conteudo).hexdigest() == documento.sha256


@pytest.mark.parametrize("trecho", FICHA.trechos.values(), ids=lambda t: t.chave)
def test_trecho_aparece_na_pagina_indicada(trecho):
    pypdf = pytest.importorskip("pypdf")
    documento = FICHA.documentos[trecho.documento]
    assert 1 <= trecho.pagina <= documento.paginas
    leitor = pypdf.PdfReader(RAIZ / documento.arquivo_local)
    texto_da_pagina = leitor.pages[trecho.pagina - 1].extract_text()
    assert normalizar(trecho.texto) in normalizar(texto_da_pagina)
