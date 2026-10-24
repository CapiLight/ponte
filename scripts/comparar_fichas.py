"""Compara uma ficha gerada pelo Gemma com uma ficha de referência montada à mão.

Uso:
    .venv/bin/python scripts/comparar_fichas.py ufac-proaes-01-2026 ufac-proaes-01-2026-gemma [--com-relatos]

Mede quantos trechos da referência a ficha gerada também copiou, se o prazo
foi identificado e o que a validação descartou. Com --com-relatos, passa
relatos fictícios pela extração e pelo motor usando a ficha gerada.
"""

import argparse
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from ponte.analise import normalizar  # noqa: E402
from ponte.extracao import FalhaNaExtracao, extrair  # noqa: E402
from ponte.fatos import Caso, Estado  # noqa: E402
from ponte.ficha import PASTA_DAS_FICHAS, Ficha, Trecho, carregar_ficha  # noqa: E402
from ponte.motor import gerar_plano  # noqa: E402
from ponte.plano import Tipo  # noqa: E402

SOBREPOSICAO_MINIMA = 0.6
RELATOS = {
    "dentro do recorte": "No dia 10 de outubro de 2026, minha casa foi alagada. Precisei sair da minha residência e perdi meus documentos pessoais.",
    "sem saída de casa": "Teve alagação no meu bairro dia 12 de outubro de 2026, mas eu não precisei sair de casa.",
}


def palavras(texto: str) -> set[str]:
    return set(re.findall(r"\w+", normalizar(texto).casefold()))


def correspondem(referencia: Trecho, gerado: Trecho) -> bool:
    if referencia.documento != gerado.documento:
        return False
    a, b = normalizar(referencia.texto), normalizar(gerado.texto)
    if a in b or b in a:
        return True
    palavras_da_referencia = palavras(referencia.texto)
    return len(palavras_da_referencia & palavras(gerado.texto)) / max(len(palavras_da_referencia), 1) >= SOBREPOSICAO_MINIMA


def comparar(referencia: Ficha, gerada: Ficha) -> list[str]:
    linhas = [f"Referência: {referencia.chave}  |  Gerada: {gerada.chave} ({gerada.geracao.modelo}, {gerada.geracao.gerada_em})", ""]
    cobertos = {r.chave: [g.chave for g in gerada.trechos.values() if correspondem(r, g)] for r in referencia.trechos.values()}
    encontrados = [chave for chave, achados in cobertos.items() if achados]
    linhas.append(f"Trechos da referência também copiados: {len(encontrados)} de {len(cobertos)}")
    linhas += [f"  ok    {chave} -> {', '.join(achados)}" for chave, achados in cobertos.items() if achados]
    linhas += [f"  falta {chave}" for chave, achados in cobertos.items() if not achados]
    extras = [g.chave for g in gerada.trechos.values() if not any(correspondem(r, g) for r in referencia.trechos.values())]
    linhas.append(f"Trechos só na ficha gerada (fora do recorte da referência ou novos): {len(extras)}")

    prazos_ref = sorted({r.prazo.dias for r in referencia.ramos.values() if r.prazo})
    prazos_ger = sorted({r.prazo.dias for r in gerada.ramos.values() if r.prazo})
    linhas.append(f"Prazos em dias: referência {prazos_ref}, gerada {prazos_ger}")
    linhas.append(f"Campos: referência {len(referencia.campos)}, gerada {len(gerada.campos)} ({', '.join(gerada.campos)})")
    linhas.append(f"Ramos gerados: {len(gerada.ramos)}")
    linhas += [f"  {ramo.chave}: {ramo.descricao} (requisitos: {', '.join(r.campo for r in ramo.requisitos)})" for ramo in gerada.ramos.values()]
    tipos = Counter(modelo.tipo.name.lower() for modelo in gerada.orientacoes)
    linhas.append(f"Orientações geradas: {len(gerada.orientacoes)} {dict(tipos)}")

    relatorio = PASTA_DAS_FICHAS / f"{gerada.chave}.relatorio.txt"
    if relatorio.exists():
        texto = relatorio.read_text(encoding="utf-8")
        descartes = re.search(r"Descartes \((\d+)\)", texto)
        correcoes = re.search(r"Correções \((\d+)\)", texto)
        linhas.append(f"Validação: {descartes.group(1) if descartes else '?'} descartes, {correcoes.group(1) if correcoes else '?'} correções de página")
    return linhas


def rodar_relatos(gerada: Ficha, chave_da_api: str) -> list[str]:
    linhas = ["", "Relatos fictícios com a ficha gerada (todas as sugestões confirmadas):"]
    for nome, relato in RELATOS.items():
        try:
            extracao = extrair(gerada, relato, chave_da_api)
        except FalhaNaExtracao as erro:
            linhas.append(f"  {nome}: extração falhou ({erro})")
            continue
        caso = Caso.novo(gerada.campos, date.today())
        indice = 0 if extracao.eventos else None
        sugestoes = {k: f for k, f in extracao.sugestoes(indice).items()}
        caso = caso.aplicar_sugestoes(sugestoes, "comparacao")
        for chave, fato in caso.fatos.items():
            if fato.estado is Estado.A_CONFERIR:
                caso = caso.confirmar(chave)
        plano = gerar_plano(gerada, caso)
        passos = [o.titulo for o in plano.do_tipo(Tipo.PASSO)]
        linhas.append(f"  {nome}: {len(extracao.eventos)} evento(s), {len(sugestoes)} sugestões, {len(passos)} passos personalizados")
        linhas += [f"    - {titulo}" for titulo in passos]
    return linhas


def main() -> None:
    argumentos = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    argumentos.add_argument("referencia")
    argumentos.add_argument("gerada")
    argumentos.add_argument("--com-relatos", action="store_true")
    opcoes = argumentos.parse_args()
    referencia, gerada = carregar_ficha(opcoes.referencia), carregar_ficha(opcoes.gerada)
    linhas = comparar(referencia, gerada)
    if opcoes.com_relatos:
        from analisar_edital import ler_chave_da_api

        linhas += rodar_relatos(gerada, ler_chave_da_api())
    print("\n".join(linhas))


if __name__ == "__main__":
    main()
