"""Motor que aplica a ficha de um edital aos fatos declarados.

Um ramo reúne os requisitos de uma situação do edital. Cada requisito pode
estar atendido, faltando (fato desconhecido), contrariado por uma resposta ou
depender de esclarecimento da instituição. Só um ramo sem faltas, contrariedades
ou pendências permite orientações personalizadas. Fato desconhecido nunca
contraria um requisito.

O motor não chama o modelo e não decide elegibilidade, dispensa ou
suficiência documental: apenas instancia as orientações cujas condições a ficha
declara.
"""

import re
from dataclasses import dataclass
from datetime import date, timedelta
from enum import StrEnum

from ponte.fatos import Caso
from ponte.ficha import MARCADOR, Ficha, ModeloDeOrientacao, Ramo
from ponte.plano import Orientacao, Plano


class EstadoDoPrazo(StrEnum):
    DESCONHECIDO = "desconhecido"
    DATA_POSTERIOR = "data_posterior"
    DENTRO = "dentro"
    FORA = "fora"


@dataclass(frozen=True)
class AvaliacaoDoPrazo:
    estado: EstadoDoPrazo
    limite: int
    dias: int | None = None
    data_final: date | None = None


@dataclass(frozen=True)
class AvaliacaoDoRamo:
    ramo: Ramo
    faltando: tuple[str, ...]
    contrarios: tuple[tuple[str, str], ...]
    a_esclarecer: tuple[str, ...]
    prazo: AvaliacaoDoPrazo | None

    @property
    def personalizavel(self) -> bool:
        return not self.faltando and not self.contrarios and not self.a_esclarecer

    def motivo_geral(self, caso: Caso) -> str:
        textos = self.ramo.textos
        if self.contrarios:
            return f"{textos['sem_relacao']} " + " ".join(frase for _, frase in self.contrarios)
        if self.faltando:
            rotulos = ", ".join(caso.campos[chave].rotulo.lower() for chave in dict.fromkeys(self.faltando))
            return textos["faltando"].replace("{campos}", rotulos)
        return textos["a_esclarecer"]


def avaliar_prazo(ramo: Ramo, caso: Caso) -> AvaliacaoDoPrazo:
    prazo = ramo.prazo
    inicio = caso.valor(prazo.inicio)
    fim = caso.valor(prazo.fim)
    if not isinstance(inicio, date) or not isinstance(fim, date):
        return AvaliacaoDoPrazo(EstadoDoPrazo.DESCONHECIDO, prazo.dias)
    dias = (fim - inicio).days
    data_final = inicio + timedelta(days=prazo.dias)
    if dias < 0:
        return AvaliacaoDoPrazo(EstadoDoPrazo.DATA_POSTERIOR, prazo.dias, dias, data_final)
    estado = EstadoDoPrazo.DENTRO if dias <= prazo.dias else EstadoDoPrazo.FORA
    return AvaliacaoDoPrazo(estado, prazo.dias, dias, data_final)


def avaliar_ramo(ramo: Ramo, caso: Caso) -> AvaliacaoDoRamo:
    faltando: list[str] = []
    contrarios: list[tuple[str, str]] = []
    a_esclarecer: list[str] = []
    for requisito in ramo.requisitos:
        valor = caso.valor(requisito.campo)
        if valor is None:
            faltando.append(requisito.campo)
        elif valor in requisito.contraria:
            contrarios.append((requisito.campo, requisito.contraria[valor]))
        elif valor in requisito.a_esclarecer:
            a_esclarecer.append(requisito.campo)
        elif valor not in requisito.atende:
            a_esclarecer.append(requisito.campo)

    prazo = None
    if ramo.prazo is not None:
        prazo = avaliar_prazo(ramo, caso)
        if prazo.estado is EstadoDoPrazo.DESCONHECIDO:
            faltando.extend(chave for chave in (ramo.prazo.inicio, ramo.prazo.fim) if caso.valor(chave) is None)
        elif prazo.estado is EstadoDoPrazo.DATA_POSTERIOR:
            faltando.extend((ramo.prazo.inicio, ramo.prazo.fim))
        elif prazo.estado is EstadoDoPrazo.FORA:
            frase = ramo.prazo.frase_fora.replace("{dias}", str(prazo.dias)).replace("{limite}", str(prazo.limite))
            contrarios.append((ramo.prazo.inicio, frase))

    return AvaliacaoDoRamo(ramo, tuple(faltando), tuple(contrarios), tuple(a_esclarecer), prazo)


def gerar_plano(ficha: Ficha, caso: Caso) -> Plano:
    avaliacoes = {chave: avaliar_ramo(ramo, caso) for chave, ramo in ficha.ramos.items()}
    return Plano(
        tuple(
            _instanciar(modelo, caso, avaliacoes)
            for modelo in ficha.orientacoes
            if _atende(modelo.quando, caso, avaliacoes)
        )
    )


def _atende(condicao: dict, caso: Caso, avaliacoes: dict[str, AvaliacaoDoRamo]) -> bool:
    if "todos" in condicao:
        return all(_atende(parte, caso, avaliacoes) for parte in condicao["todos"])
    if "algum" in condicao:
        return any(_atende(parte, caso, avaliacoes) for parte in condicao["algum"])
    if "nao" in condicao:
        return not _atende(condicao["nao"], caso, avaliacoes)
    if "campo" in condicao:
        valor = caso.valor(condicao["campo"])
        if "igual" in condicao:
            return valor == condicao["igual"]
        if "diferente" in condicao:
            return valor != condicao["diferente"]
        return valor is None
    if "ramo" in condicao:
        avaliacao = avaliacoes[condicao["ramo"]]
        return {
            "personalizavel": avaliacao.personalizavel,
            "nao_personalizavel": not avaliacao.personalizavel,
            "com_contrarios": bool(avaliacao.contrarios),
        }[condicao["estado"]]
    if "prazo" in condicao:
        return avaliacoes[condicao["prazo"]].prazo.estado == condicao["estado"]
    raise ValueError(f"condição desconhecida: {condicao}")


def _instanciar(modelo: ModeloDeOrientacao, caso: Caso, avaliacoes: dict[str, AvaliacaoDoRamo]) -> Orientacao:
    avaliacao = avaliacoes[modelo.ramo] if modelo.ramo else None

    def preencher(texto: str) -> str:
        return MARCADOR.sub(lambda marcador: _resolver(marcador, caso, avaliacao), texto)

    return Orientacao(
        chave=modelo.chave,
        tipo=modelo.tipo,
        titulo=preencher(modelo.titulo),
        instrucao=preencher(modelo.instrucao),
        motivo=preencher(modelo.motivo),
        fontes=modelo.fontes,
        depende_de=_dependencias(modelo, avaliacoes),
        pendencia=preencher(modelo.pendencia),
    )


def _resolver(marcador: re.Match, caso: Caso, avaliacao: AvaliacaoDoRamo | None) -> str:
    tipo, argumento, padrao = marcador.groups()
    if tipo == "valor":
        return caso.descrever(argumento)
    if tipo == "valor_min":
        return caso.descrever(argumento).lower()
    if tipo == "texto":
        valor = caso.valor(argumento)
        return str(valor) if valor is not None else (padrao or "")
    if tipo == "nota":
        nota = caso.fatos[argumento].nota
        return f" {nota}" if nota else ""
    if tipo == "prazo":
        prazo = avaliacao.prazo
        return {
            "dias": str(prazo.dias),
            "limite": str(prazo.limite),
            "data_final": f"{prazo.data_final:%d/%m/%Y}" if prazo.data_final else "",
        }[argumento]
    if argumento == "contrarios":
        return " ".join(frase for _, frase in avaliacao.contrarios)
    return avaliacao.motivo_geral(caso)


def _dependencias(modelo: ModeloDeOrientacao, avaliacoes: dict[str, AvaliacaoDoRamo]) -> tuple[str, ...]:
    """Fatos de que a orientação depende: os declarados na ficha ou, na falta, os da condição."""
    if modelo.depende_de is None:
        return _campos_da_condicao(modelo.quando, avaliacoes)
    avaliacao = avaliacoes[modelo.ramo] if modelo.ramo else None
    dependencias = []
    for item in modelo.depende_de:
        if item == "ramo:campos":
            dependencias += avaliacao.ramo.campos
        elif item == "ramo:contrarios":
            dependencias += [chave for chave, _ in avaliacao.contrarios]
        else:
            dependencias.append(item)
    return tuple(dict.fromkeys(dependencias))


def _campos_da_condicao(condicao: dict, avaliacoes: dict[str, AvaliacaoDoRamo]) -> tuple[str, ...]:
    if "todos" in condicao or "algum" in condicao:
        partes = condicao.get("todos", condicao.get("algum"))
        return tuple(dict.fromkeys(campo for parte in partes for campo in _campos_da_condicao(parte, avaliacoes)))
    if "nao" in condicao:
        return _campos_da_condicao(condicao["nao"], avaliacoes)
    if "campo" in condicao:
        return (condicao["campo"],)
    return avaliacoes[condicao.get("ramo") or condicao["prazo"]].ramo.campos
