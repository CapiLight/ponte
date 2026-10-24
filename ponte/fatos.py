"""Fatos declarados sobre a situação do estudante.

Um fato registra o que a pessoa informou ou confirmou. Confirmar não comprova o
acontecimento: apenas registra a declaração atual. Só fatos confirmados ou
informados diretamente alimentam as regras; sugestões ainda não conferidas,
"não sei" e conflitos contam como desconhecidos.

Os campos de um caso vêm da ficha do edital escolhido (ponte/ficha.py).

Cada mudança no caso incrementa a revisão. Uma extração do relato só pode ser
aplicada se o caso continuar na revisão em que ela foi pedida e se o relato não
tiver mudado (ver resultado_ainda_vale).
"""

import hashlib
from dataclasses import dataclass, replace
from datetime import date
from enum import StrEnum

NAO_SEI = "nao_sei"
TIPOS_DE_CAMPO = ("escolha", "data", "texto")
PADRAO_DATA_DE_HOJE = "hoje"


class Estado(StrEnum):
    SEM_RESPOSTA = "Sem resposta"
    A_CONFERIR = "A conferir"
    CONFIRMADO = "Confirmado por você"
    INFORMADO = "Informado por você"
    NAO_SEI = "Não sei"
    PRECISA_ESCLARECER = "Precisa esclarecer"


class Origem(StrEnum):
    NENHUMA = "nenhuma"
    RELATO = "relato"
    PESSOA = "pessoa"
    SISTEMA = "sistema"


@dataclass(frozen=True)
class Campo:
    chave: str
    pergunta: str
    rotulo: str
    tipo: str = "escolha"
    opcoes: dict[str, str] | None = None
    extraivel: bool = True
    so_do_relato: bool = False
    padrao: str | None = None
    nota_padrao: str = ""
    por_evento: bool = False
    identifica_evento: bool = False
    dica: str = ""


ESTADOS_DECLARADOS = (Estado.CONFIRMADO, Estado.INFORMADO)
ESTADOS_DE_SUGESTAO = (Estado.A_CONFERIR, Estado.PRECISA_ESCLARECER)


@dataclass(frozen=True)
class Fato:
    valor: object = None
    estado: Estado = Estado.SEM_RESPOSTA
    origem: Origem = Origem.NENHUMA
    trecho: str = ""
    nota: str = ""

    @property
    def conhecido(self) -> bool:
        return self.estado in ESTADOS_DECLARADOS and self.valor not in (None, NAO_SEI)


def descrever_valor(campo: Campo, fato: Fato) -> str:
    if fato.valor is None:
        return "Sem resposta"
    if fato.valor == NAO_SEI:
        return "Não sei"
    if isinstance(fato.valor, date):
        return fato.valor.strftime("%d/%m/%Y")
    if campo.opcoes:
        return campo.opcoes.get(fato.valor, str(fato.valor))
    return str(fato.valor)


def versao_do_relato(relato: str) -> str:
    return hashlib.sha256(relato.strip().encode("utf-8")).hexdigest()[:16]


@dataclass(frozen=True)
class Caso:
    campos: dict[str, Campo]
    fatos: dict[str, Fato]
    revisao: int = 0
    versao_relato: str = ""

    @classmethod
    def novo(cls, campos: dict[str, Campo], hoje: date) -> "Caso":
        fatos = {}
        for chave, campo in campos.items():
            if campo.padrao == PADRAO_DATA_DE_HOJE:
                fatos[chave] = Fato(valor=hoje, estado=Estado.A_CONFERIR, origem=Origem.SISTEMA, nota=campo.nota_padrao)
            else:
                fatos[chave] = Fato()
        return cls(campos, fatos)

    def valor(self, chave: str) -> object | None:
        """Valor declarado do fato, ou None quando ele ainda é desconhecido."""
        fato = self.fatos[chave]
        return fato.valor if fato.conhecido else None

    def descrever(self, chave: str) -> str:
        return descrever_valor(self.campos[chave], self.fatos[chave])

    def informar(self, chave: str, valor: object) -> "Caso":
        estado = Estado.NAO_SEI if valor == NAO_SEI else Estado.INFORMADO
        return self._com_fato(chave, Fato(valor=valor, estado=estado, origem=Origem.PESSOA))

    def confirmar(self, chave: str) -> "Caso":
        fato = self.fatos[chave]
        if fato.estado is not Estado.A_CONFERIR:
            raise ValueError(f"{chave} não está aguardando conferência")
        estado = Estado.NAO_SEI if fato.valor == NAO_SEI else Estado.CONFIRMADO
        return self._com_fato(chave, replace(fato, estado=estado))

    def limpar(self, chave: str) -> "Caso":
        return self._com_fato(chave, Fato())

    def descartar_relato(self) -> "Caso":
        """Retira os fatos derivados do relato anterior; declarações diretas permanecem."""
        fatos = {
            chave: Fato() if fato.origem is Origem.RELATO else fato
            for chave, fato in self.fatos.items()
        }
        return replace(self, fatos=fatos, revisao=self.revisao + 1, versao_relato="")

    def aplicar_sugestoes(self, sugestoes: dict[str, Fato], versao_relato: str) -> "Caso":
        """Substitui os fatos do relato anterior pelas sugestões da nova análise.

        Campos sugeridos voltam a exigir conferência, inclusive os que tinham
        sido informados diretamente. Campos sem sugestão mantêm apenas
        declarações diretas.
        """
        sem_relato_anterior = self.descartar_relato()
        fatos = dict(sem_relato_anterior.fatos)
        for chave, sugestao in sugestoes.items():
            if chave not in self.campos or not self.campos[chave].extraivel:
                raise ValueError(f"{chave} não pode ser sugerido pelo relato")
            if sugestao.origem is not Origem.RELATO or sugestao.estado not in ESTADOS_DE_SUGESTAO:
                raise ValueError(f"sugestão inválida para {chave}")
            fatos[chave] = sugestao
        return replace(sem_relato_anterior, fatos=fatos, revisao=sem_relato_anterior.revisao + 1, versao_relato=versao_relato)

    def _com_fato(self, chave: str, fato: Fato) -> "Caso":
        if chave not in self.campos:
            raise KeyError(chave)
        return replace(self, fatos={**self.fatos, chave: fato}, revisao=self.revisao + 1)


def resultado_ainda_vale(caso: Caso, revisao_no_pedido: int, relato_no_pedido: str, relato_atual: str) -> bool:
    """Uma extração atrasada só vale se nada mudou desde o pedido."""
    return caso.revisao == revisao_no_pedido and versao_do_relato(relato_no_pedido) == versao_do_relato(relato_atual)
