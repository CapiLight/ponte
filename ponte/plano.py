"""Tipos do plano apresentado ao estudante."""

from dataclasses import dataclass
from enum import StrEnum


class Tipo(StrEnum):
    PASSO = "Passos relacionados às informações confirmadas"
    ESCLARECER = "Informações que você ainda pode esclarecer"
    PERGUNTA_PROAES = "Perguntas para a Proaes"
    REFERENCIA = "Informações gerais do edital"
    NAO_AVALIADO = "Não avaliado neste recorte"


@dataclass(frozen=True)
class Orientacao:
    chave: str
    tipo: Tipo
    titulo: str
    instrucao: str
    motivo: str
    fontes: tuple[str, ...]
    depende_de: tuple[str, ...] = ()
    pendencia: str = ""


@dataclass(frozen=True)
class Plano:
    orientacoes: tuple[Orientacao, ...]

    def do_tipo(self, tipo: Tipo) -> list[Orientacao]:
        return [orientacao for orientacao in self.orientacoes if orientacao.tipo is tipo]

    def chaves(self) -> set[str]:
        return {orientacao.chave for orientacao in self.orientacoes}
