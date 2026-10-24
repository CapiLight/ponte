import hashlib
import re
from pathlib import Path

import pytest

from ponte.fontes import EDITAL_01_2026

RAIZ = Path(__file__).resolve().parent.parent


def normalizar(texto: str) -> str:
    texto = re.sub(r"\s+", " ", texto)
    texto = re.sub(r"\s+([,.;:)])", r"\1", texto)
    texto = re.sub(r"\(\s+", "(", texto)
    return texto.strip()


@pytest.mark.parametrize("documento", EDITAL_01_2026.documentos.values(), ids=lambda d: d.chave)
def test_copia_local_confere_com_hash_registrado(documento):
    conteudo = (RAIZ / documento.arquivo_local).read_bytes()
    assert hashlib.sha256(conteudo).hexdigest() == documento.sha256


@pytest.mark.parametrize("trecho", EDITAL_01_2026.trechos.values(), ids=lambda t: t.chave)
def test_trecho_aparece_na_pagina_indicada(trecho):
    pypdf = pytest.importorskip("pypdf")
    documento = EDITAL_01_2026.documentos[trecho.documento]
    assert 1 <= trecho.pagina <= documento.paginas
    leitor = pypdf.PdfReader(RAIZ / documento.arquivo_local)
    texto_da_pagina = leitor.pages[trecho.pagina - 1].extract_text()
    assert normalizar(trecho.texto) in normalizar(texto_da_pagina)
