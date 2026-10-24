"""Ficha de um edital: tudo o que a Ponte precisa para orientar sobre ele.

Reúne metadados, documentos com hash, trechos literais com página, os campos
(fatos) que o edital pede, os ramos com seus requisitos e os modelos de
orientação. O motor (ponte/motor.py) interpreta qualquer ficha; nada neste
módulo é específico de um edital.

A ficha pode ter sido montada à mão ou gerada pelo Gemma. A origem fica em
`geracao` e aparece no resumo entregue ao estudante.

Condições aceitas em `quando`:
  {"todos": [...]}, {"algum": [...]}, {"nao": {...}}
  {"campo": c, "igual": v}, {"campo": c, "diferente": v}, {"campo": c, "desconhecido": true}
  {"ramo": r, "estado": "personalizavel" | "nao_personalizavel" | "com_contrarios"}
  {"prazo": r, "estado": "dentro" | "fora" | "data_posterior" | "desconhecido"}

Marcadores aceitos nos textos das orientações:
  {valor:c} {valor_min:c} {texto:c|padrão} {nota:c}
  {prazo:dias} {prazo:limite} {prazo:data_final} {ramo:contrarios} {ramo:motivo_geral}
"""

import json
import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from ponte.fatos import NAO_SEI, PADRAO_DATA_DE_HOJE, TIPOS_DE_CAMPO, Campo
from ponte.plano import Tipo

RAIZ = Path(__file__).resolve().parent.parent
PASTA_DAS_FICHAS = RAIZ / "fichas"

ESTADOS_DE_RAMO = ("personalizavel", "nao_personalizavel", "com_contrarios")
ESTADOS_DE_PRAZO = ("dentro", "fora", "data_posterior", "desconhecido")
MARCADOR = re.compile(r"\{(valor|valor_min|texto|nota|prazo|ramo):([\w.]+)(?:\|([^}]*))?\}")
MARCADORES_DE_PRAZO = ("dias", "limite", "data_final")
MARCADORES_DE_RAMO = ("contrarios", "motivo_geral")
DEPENDENCIAS_DO_RAMO = ("ramo:campos", "ramo:contrarios")
TEXTOS_DO_RAMO = ("sem_relacao", "faltando", "a_esclarecer")


class FichaInvalida(Exception):
    def __init__(self, problemas: list[str]):
        super().__init__("; ".join(problemas))
        self.problemas = problemas


@dataclass(frozen=True)
class Documento:
    chave: str
    titulo: str
    url: str
    arquivo_local: str
    sha256: str
    paginas: int
    consultado_em: date


@dataclass(frozen=True)
class Trecho:
    chave: str
    rotulo: str
    documento: str
    pagina: int
    texto: str
    observacao: str = ""


@dataclass(frozen=True)
class Edital:
    instituicao: str
    orgao: str
    numero: str
    processo: str
    objeto: str
    assinado_em: date
    pagina_oficial: str
    canais_de_duvida: tuple[str, ...]
    conferencia_de_alteracoes: str


@dataclass(frozen=True)
class Requisito:
    campo: str
    atende: tuple[str, ...]
    contraria: dict[str, str]
    a_esclarecer: tuple[str, ...] = ()


@dataclass(frozen=True)
class Prazo:
    inicio: str
    fim: str
    dias: int
    frase_fora: str


@dataclass(frozen=True)
class Ramo:
    chave: str
    descricao: str
    requisitos: tuple[Requisito, ...]
    prazo: Prazo | None
    textos: dict[str, str]

    @property
    def campos(self) -> tuple[str, ...]:
        campos = [requisito.campo for requisito in self.requisitos]
        if self.prazo is not None:
            campos += [self.prazo.inicio, self.prazo.fim]
        return tuple(dict.fromkeys(campos))


@dataclass(frozen=True)
class ModeloDeOrientacao:
    chave: str
    tipo: Tipo
    quando: dict
    titulo: str
    instrucao: str
    motivo: str
    fontes: tuple[str, ...]
    depende_de: tuple[str, ...] | None = None
    pendencia: str = ""
    ramo: str | None = None


@dataclass(frozen=True)
class Geracao:
    modo: str
    descricao: str
    modelo: str = ""
    gerada_em: date | None = None

    @property
    def automatica(self) -> bool:
        return self.modo == "gemma"


@dataclass(frozen=True)
class Ficha:
    chave: str
    versao: int
    geracao: Geracao
    edital: Edital
    limite: str
    documentos: dict[str, Documento]
    trechos: dict[str, Trecho]
    campos: dict[str, Campo]
    ramos: dict[str, Ramo]
    orientacoes: tuple[ModeloDeOrientacao, ...]

    def citar(self, chave: str) -> str:
        trecho = self.trechos[chave]
        documento = self.documentos[trecho.documento]
        return f"{trecho.rotulo} ({documento.titulo}, p. {trecho.pagina})"


def carregar_ficha(chave: str, pasta: Path = PASTA_DAS_FICHAS) -> Ficha:
    return ler_ficha(json.loads((pasta / f"{chave}.json").read_text(encoding="utf-8")))


def ler_ficha(dados: dict) -> Ficha:
    """Converte o JSON em Ficha e recusa a ficha se houver qualquer referência inválida."""
    try:
        ficha = _converter(dados)
    except (KeyError, TypeError, ValueError) as erro:
        raise FichaInvalida([f"estrutura inválida: {erro!r}"]) from erro
    problemas = validar(ficha)
    if problemas:
        raise FichaInvalida(problemas)
    return ficha


def _converter(dados: dict) -> Ficha:
    edital = dados["edital"]
    geracao = dados["geracao"]
    return Ficha(
        chave=dados["chave"],
        versao=int(dados["versao"]),
        geracao=Geracao(
            modo=geracao["modo"],
            descricao=geracao["descricao"],
            modelo=geracao.get("modelo", ""),
            gerada_em=date.fromisoformat(geracao["gerada_em"]) if geracao.get("gerada_em") else None,
        ),
        edital=Edital(
            instituicao=edital["instituicao"],
            orgao=edital["orgao"],
            numero=edital["numero"],
            processo=edital["processo"],
            objeto=edital["objeto"],
            assinado_em=date.fromisoformat(edital["assinado_em"]),
            pagina_oficial=edital["pagina_oficial"],
            canais_de_duvida=tuple(edital["canais_de_duvida"]),
            conferencia_de_alteracoes=edital["conferencia_de_alteracoes"],
        ),
        limite=dados["limite"],
        documentos={
            documento["chave"]: Documento(**{**documento, "consultado_em": date.fromisoformat(documento["consultado_em"])})
            for documento in dados["documentos"]
        },
        trechos={trecho["chave"]: Trecho(**trecho) for trecho in dados["trechos"]},
        campos={campo["chave"]: Campo(**campo) for campo in dados["campos"]},
        ramos={
            ramo["chave"]: Ramo(
                chave=ramo["chave"],
                descricao=ramo["descricao"],
                requisitos=tuple(
                    Requisito(
                        campo=requisito["campo"],
                        atende=tuple(requisito["atende"]),
                        contraria=dict(requisito.get("contraria", {})),
                        a_esclarecer=tuple(requisito.get("a_esclarecer", ())),
                    )
                    for requisito in ramo["requisitos"]
                ),
                prazo=Prazo(**ramo["prazo"]) if ramo.get("prazo") else None,
                textos=dict(ramo["textos"]),
            )
            for ramo in dados["ramos"]
        },
        orientacoes=tuple(
            ModeloDeOrientacao(
                chave=modelo["chave"],
                tipo=Tipo[modelo["tipo"].upper()],
                quando=modelo["quando"],
                titulo=modelo["titulo"],
                instrucao=modelo["instrucao"],
                motivo=modelo["motivo"],
                fontes=tuple(modelo["fontes"]),
                depende_de=tuple(modelo["depende_de"]) if "depende_de" in modelo else None,
                pendencia=modelo.get("pendencia", ""),
                ramo=modelo.get("ramo"),
            )
            for modelo in dados["orientacoes"]
        ),
    )


def validar(ficha: Ficha) -> list[str]:
    problemas = []
    for trecho in ficha.trechos.values():
        documento = ficha.documentos.get(trecho.documento)
        if documento is None:
            problemas.append(f"trecho {trecho.chave}: documento {trecho.documento} inexistente")
        elif not 1 <= trecho.pagina <= documento.paginas:
            problemas.append(f"trecho {trecho.chave}: página {trecho.pagina} fora do documento")
        if not trecho.texto.strip():
            problemas.append(f"trecho {trecho.chave}: texto vazio")

    for campo in ficha.campos.values():
        if campo.tipo not in TIPOS_DE_CAMPO:
            problemas.append(f"campo {campo.chave}: tipo {campo.tipo} desconhecido")
        if campo.tipo == "escolha" and not campo.opcoes:
            problemas.append(f"campo {campo.chave}: escolha sem opções")
        if campo.padrao not in (None, PADRAO_DATA_DE_HOJE) or (campo.padrao and campo.tipo != "data"):
            problemas.append(f"campo {campo.chave}: padrão {campo.padrao} inválido")

    for ramo in ficha.ramos.values():
        for requisito in ramo.requisitos:
            valores = [*requisito.atende, *requisito.contraria, *requisito.a_esclarecer]
            problemas += _conferir_valores(ficha, requisito.campo, valores, f"ramo {ramo.chave}")
        if ramo.prazo is not None:
            for chave in (ramo.prazo.inicio, ramo.prazo.fim):
                if ficha.campos.get(chave) is None or ficha.campos[chave].tipo != "data":
                    problemas.append(f"ramo {ramo.chave}: prazo usa {chave}, que não é campo de data")
        for chave in TEXTOS_DO_RAMO:
            if chave not in ramo.textos:
                problemas.append(f"ramo {ramo.chave}: falta o texto {chave}")

    for modelo in ficha.orientacoes:
        contexto = f"orientação {modelo.chave}"
        if modelo.ramo is not None and modelo.ramo not in ficha.ramos:
            problemas.append(f"{contexto}: ramo {modelo.ramo} inexistente")
        if not modelo.fontes:
            problemas.append(f"{contexto}: sem fonte")
        problemas += [f"{contexto}: fonte {fonte} inexistente" for fonte in modelo.fontes if fonte not in ficha.trechos]
        problemas += _conferir_condicao(ficha, modelo.quando, contexto)
        for dependencia in modelo.depende_de or ():
            if dependencia in DEPENDENCIAS_DO_RAMO:
                if modelo.ramo is None:
                    problemas.append(f"{contexto}: {dependencia} sem ramo")
            elif dependencia not in ficha.campos:
                problemas.append(f"{contexto}: depende de campo inexistente {dependencia}")
        for texto in (modelo.titulo, modelo.instrucao, modelo.motivo, modelo.pendencia):
            problemas += _conferir_marcadores(ficha, modelo, texto, contexto)
    return problemas


def _conferir_valores(ficha: Ficha, chave: str, valores: list, contexto: str) -> list[str]:
    campo = ficha.campos.get(chave)
    if campo is None:
        return [f"{contexto}: campo {chave} inexistente"]
    if campo.tipo != "escolha":
        return []
    validos = set(campo.opcoes) | {NAO_SEI}
    return [f"{contexto}: valor {valor} não existe em {chave}" for valor in valores if valor not in validos]


def _conferir_condicao(ficha: Ficha, condicao: object, contexto: str) -> list[str]:
    if not isinstance(condicao, dict) or len(condicao) == 0:
        return [f"{contexto}: condição vazia ou malformada"]
    if "todos" in condicao or "algum" in condicao:
        partes = condicao.get("todos", condicao.get("algum"))
        if not isinstance(partes, list) or not partes:
            return [f"{contexto}: lista de condições vazia"]
        return [problema for parte in partes for problema in _conferir_condicao(ficha, parte, contexto)]
    if "nao" in condicao:
        return _conferir_condicao(ficha, condicao["nao"], contexto)
    if "campo" in condicao:
        if "igual" in condicao:
            return _conferir_valores(ficha, condicao["campo"], [condicao["igual"]], contexto)
        if "diferente" in condicao:
            return _conferir_valores(ficha, condicao["campo"], [condicao["diferente"]], contexto)
        if condicao.get("desconhecido") is True:
            return _conferir_valores(ficha, condicao["campo"], [], contexto)
        return [f"{contexto}: condição de campo sem operador"]
    if "ramo" in condicao:
        if condicao["ramo"] not in ficha.ramos:
            return [f"{contexto}: ramo {condicao['ramo']} inexistente"]
        if condicao.get("estado") not in ESTADOS_DE_RAMO:
            return [f"{contexto}: estado de ramo {condicao.get('estado')} inválido"]
        return []
    if "prazo" in condicao:
        ramo = ficha.ramos.get(condicao["prazo"])
        if ramo is None or ramo.prazo is None:
            return [f"{contexto}: ramo {condicao['prazo']} sem prazo"]
        if condicao.get("estado") not in ESTADOS_DE_PRAZO:
            return [f"{contexto}: estado de prazo {condicao.get('estado')} inválido"]
        return []
    return [f"{contexto}: condição desconhecida {sorted(condicao)}"]


def _conferir_marcadores(ficha: Ficha, modelo: ModeloDeOrientacao, texto: str, contexto: str) -> list[str]:
    problemas = []
    ramo = ficha.ramos.get(modelo.ramo) if modelo.ramo else None
    for tipo, argumento, _ in MARCADOR.findall(texto):
        if tipo in ("valor", "valor_min", "texto", "nota") and argumento not in ficha.campos:
            problemas.append(f"{contexto}: marcador {tipo}:{argumento} usa campo inexistente")
        elif tipo == "prazo" and (argumento not in MARCADORES_DE_PRAZO or ramo is None or ramo.prazo is None):
            problemas.append(f"{contexto}: marcador prazo:{argumento} sem ramo com prazo")
        elif tipo == "ramo" and (argumento not in MARCADORES_DE_RAMO or modelo.ramo is None):
            problemas.append(f"{contexto}: marcador ramo:{argumento} sem ramo")
    sobra = MARCADOR.sub("", texto)
    if "{" in sobra or "}" in sobra:
        problemas.append(f"{contexto}: marcador desconhecido em “{texto[:60]}”")
    return problemas
