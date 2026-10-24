"""Gera a ficha de um edital com o Gemma e atualiza o catálogo.

Uso:
    .venv/bin/python scripts/analisar_edital.py --chave ufac-proaes-17-2026 \\
        --pagina https://www3.ufac.br/... \\
        --pdf edital=https://www3.ufac.br/.../edital.pdf --pdf anexos=https://...

Use --local chave=caminho em vez de --pdf para reaproveitar cópias já baixadas.
A chave da API vem de GEMINI_API_KEY ou de .streamlit/secrets.toml.
"""

import argparse
import json
import os
import sys
import tomllib
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from ponte.analise import TEMPO_LIMITE_DO_MODELO_MS, FalhaNaAnalise, analisar_edital, baixar_documentos, ler_documento  # noqa: E402
from ponte.catalogo import CAMINHO_PADRAO, atualizar_catalogo  # noqa: E402
from ponte.ficha import PASTA_DAS_FICHAS, para_json  # noqa: E402
from ponte.gemma import MODELO_PADRAO, criar_cliente  # noqa: E402


def ler_chave_da_api() -> str:
    chave = os.environ.get("GEMINI_API_KEY", "")
    segredos = RAIZ / ".streamlit" / "secrets.toml"
    if not chave and segredos.exists():
        chave = tomllib.loads(segredos.read_text(encoding="utf-8")).get("GEMINI_API_KEY", "")
    if not chave:
        sys.exit("Defina GEMINI_API_KEY ou preencha .streamlit/secrets.toml.")
    return chave


def pares(valores: list[str], opcao: str) -> list[tuple[str, str]]:
    resultado = []
    for valor in valores:
        chave, separador, destino = valor.partition("=")
        if not separador:
            sys.exit(f"{opcao} espera chave=valor, recebi {valor!r}")
        resultado.append((chave, destino))
    return resultado


def main() -> None:
    argumentos = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    argumentos.add_argument("--chave", required=True, help="identificador da ficha, ex.: ufac-proaes-17-2026")
    argumentos.add_argument("--pagina", required=True, help="página oficial do edital")
    argumentos.add_argument("--pdf", action="append", default=[], help="documento=URL do PDF oficial")
    argumentos.add_argument("--local", action="append", default=[], help="documento=caminho de cópia já baixada (a URL vem de --pdf com a mesma chave)")
    argumentos.add_argument("--modelo", default=MODELO_PADRAO)
    opcoes = argumentos.parse_args()

    urls = dict(pares(opcoes.pdf, "--pdf"))
    locais = dict(pares(opcoes.local, "--local"))
    if not urls:
        sys.exit("Informe ao menos um --pdf.")
    pasta = RAIZ / "fontes" / opcoes.chave
    a_baixar = [(chave, url) for chave, url in urls.items() if chave not in locais]
    documentos = {d.chave: d for d in baixar_documentos(a_baixar, pasta)} if a_baixar else {}
    documentos |= {chave: ler_documento(chave, urls[chave], Path(caminho)) for chave, caminho in locais.items()}
    ordenados = [documentos[chave] for chave in urls]

    cliente = criar_cliente(ler_chave_da_api(), TEMPO_LIMITE_DO_MODELO_MS)
    try:
        ficha, relatorio = analisar_edital(opcoes.chave, ordenados, opcoes.pagina, cliente, date.today(), opcoes.modelo)
    except FalhaNaAnalise as erro:
        sys.exit(f"Análise falhou: {erro}")

    destino = PASTA_DAS_FICHAS / f"{opcoes.chave}.json"
    destino.write_text(json.dumps(para_json(ficha), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (PASTA_DAS_FICHAS / f"{opcoes.chave}.relatorio.txt").write_text(relatorio.texto() + "\n", encoding="utf-8")
    atualizar_catalogo(CAMINHO_PADRAO)
    print(f"Ficha gravada em {destino.relative_to(RAIZ)}")
    print(f"{len(ficha.trechos)} trechos, {len(ficha.campos)} campos, {len(ficha.ramos)} ramos, {len(ficha.orientacoes)} orientações")
    print(relatorio.texto())


if __name__ == "__main__":
    main()
