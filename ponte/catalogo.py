"""Catálogo de editais em SQLite, montado a partir das fichas JSON.

As fichas em fichas/*.json são a fonte e ficam versionadas no repositório. O
catálogo é uma cópia para consulta rápida pelo app: lista os editais
disponíveis e devolve a ficha sem reler nem revalidar arquivos. Ficha inválida
não entra no catálogo.
"""

import hashlib
import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from ponte.ficha import PASTA_DAS_FICHAS, RAIZ, Ficha, FichaInvalida, ler_ficha, para_json

CAMINHO_PADRAO = RAIZ / "catalogo.db"
ESQUEMA = """
CREATE TABLE IF NOT EXISTS fichas (
    chave TEXT PRIMARY KEY,
    instituicao TEXT NOT NULL,
    orgao TEXT NOT NULL,
    numero TEXT NOT NULL,
    objeto TEXT NOT NULL,
    geracao TEXT NOT NULL,
    modelo TEXT NOT NULL,
    gerada_em TEXT NOT NULL,
    hash_dos_documentos TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    atualizada_em TEXT NOT NULL
)
"""


@dataclass(frozen=True)
class EditalNoCatalogo:
    chave: str
    instituicao: str
    orgao: str
    numero: str
    objeto: str
    geracao: str
    modelo: str
    gerada_em: str


def atualizar_catalogo(caminho: Path = CAMINHO_PADRAO, pasta: Path = PASTA_DAS_FICHAS) -> list[str]:
    """Recarrega todas as fichas da pasta e devolve os problemas das que ficaram de fora."""
    problemas = []
    fichas = []
    for arquivo in sorted(pasta.glob("*.json")):
        try:
            fichas.append(ler_ficha(json.loads(arquivo.read_text(encoding="utf-8"))))
        except (FichaInvalida, json.JSONDecodeError) as erro:
            problemas.append(f"{arquivo.name}: {erro}")
    agora = datetime.now().isoformat(timespec="seconds")
    with sqlite3.connect(caminho) as conexao:
        conexao.execute(ESQUEMA)
        conexao.execute("DELETE FROM fichas")
        conexao.executemany(
            "INSERT INTO fichas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [_linha(ficha, agora) for ficha in fichas],
        )
    return problemas


def listar_editais(caminho: Path = CAMINHO_PADRAO) -> list[EditalNoCatalogo]:
    with sqlite3.connect(caminho) as conexao:
        linhas = conexao.execute(
            "SELECT chave, instituicao, orgao, numero, objeto, geracao, modelo, gerada_em FROM fichas ORDER BY instituicao, numero"
        ).fetchall()
    return [EditalNoCatalogo(*linha) for linha in linhas]


def carregar_do_catalogo(chave: str, caminho: Path = CAMINHO_PADRAO) -> Ficha:
    with sqlite3.connect(caminho) as conexao:
        linha = conexao.execute("SELECT conteudo FROM fichas WHERE chave = ?", (chave,)).fetchone()
    if linha is None:
        raise KeyError(chave)
    return ler_ficha(json.loads(linha[0]))


def _linha(ficha: Ficha, agora: str) -> tuple:
    hashes = "".join(sorted(documento.sha256 for documento in ficha.documentos.values()))
    edital = ficha.edital
    return (
        ficha.chave,
        edital.instituicao,
        edital.orgao,
        edital.numero,
        edital.objeto,
        ficha.geracao.modo,
        ficha.geracao.modelo,
        ficha.geracao.gerada_em.isoformat() if ficha.geracao.gerada_em else "",
        hashlib.sha256(hashes.encode()).hexdigest(),
        json.dumps(para_json(ficha), ensure_ascii=False),
        agora,
    )
