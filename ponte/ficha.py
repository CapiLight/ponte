"""Ficha de um edital: tudo o que a Ponte precisa para orientar sobre ele.

Reúne metadados, documentos com hash, trechos literais com página, os campos
(fatos) que o edital pede, os ramos com seus requisitos e os modelos de
orientação. O motor (ponte/motor.py) interpreta qualquer ficha; nada neste
módulo é específico de um edital.

A ficha pode ter sido montada à mão ou gerada pelo Gemma (ponte/analise.py).
A origem fica em `geracao` e aparece no resumo entregue ao estudante.

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
from dataclasses import MISSING, dataclass, fields
from datetime import date
from pathlib import Path

from ponte.fatos import NAO_SEI, PADRAO_DATA_DE_HOJE, TIPOS_DE_CAMPO, Campo
from ponte.plano import Tipo

RAIZ = Path(__file__).resolve().parent.parent
PASTA_DAS_FICHAS = RAIZ / "fichas"
CHAVE_DOS_EVENTOS = "eventos"

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
    assinado_em: date | None
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
    fontes: tuple[str, ...] = ()

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
        ficha = Ficha(
            chave=dados["chave"],
            versao=int(dados["versao"]),
            geracao=converter_geracao(dados["geracao"]),
            edital=converter_edital(dados["edital"]),
            limite=dados["limite"],
            documentos={d["chave"]: converter_documento(d) for d in dados["documentos"]},
            trechos={t["chave"]: converter_trecho(t) for t in dados["trechos"]},
            campos={c["chave"]: converter_campo(c) for c in dados["campos"]},
            ramos={r["chave"]: converter_ramo(r) for r in dados["ramos"]},
            orientacoes=tuple(converter_orientacao(o) for o in dados["orientacoes"]),
        )
    except (KeyError, TypeError, ValueError, AttributeError) as erro:
        raise FichaInvalida([f"estrutura inválida: {erro!r}"]) from erro
    problemas = validar(ficha)
    if problemas:
        raise FichaInvalida(problemas)
    return ficha


def _data_opcional(texto: str | None) -> date | None:
    return date.fromisoformat(texto) if texto else None


def converter_geracao(dados: dict) -> Geracao:
    return Geracao(
        modo=dados["modo"],
        descricao=dados["descricao"],
        modelo=dados.get("modelo", ""),
        gerada_em=_data_opcional(dados.get("gerada_em")),
    )


def converter_edital(dados: dict) -> Edital:
    return Edital(
        instituicao=str(dados["instituicao"]),
        orgao=str(dados["orgao"]),
        numero=str(dados["numero"]),
        processo=str(dados.get("processo", "")),
        objeto=str(dados["objeto"]),
        assinado_em=_data_opcional(dados.get("assinado_em")),
        pagina_oficial=str(dados.get("pagina_oficial", "")),
        canais_de_duvida=tuple(str(canal) for canal in dados.get("canais_de_duvida", ())),
        conferencia_de_alteracoes=str(dados.get("conferencia_de_alteracoes", "")),
    )


def converter_documento(dados: dict) -> Documento:
    return Documento(**{**dados, "consultado_em": date.fromisoformat(dados["consultado_em"])})


def converter_trecho(dados: dict) -> Trecho:
    return Trecho(
        chave=str(dados["chave"]),
        rotulo=str(dados["rotulo"]),
        documento=str(dados["documento"]),
        pagina=int(dados["pagina"]),
        texto=str(dados["texto"]),
        observacao=str(dados.get("observacao") or ""),
    )


def converter_campo(dados: dict) -> Campo:
    conhecidos = {campo.name for campo in fields(Campo)}
    return Campo(**{chave: valor for chave, valor in dados.items() if chave in conhecidos})


def converter_requisito(dados: dict) -> Requisito:
    return Requisito(
        campo=dados["campo"],
        atende=tuple(dados["atende"]),
        contraria=dict(dados.get("contraria") or {}),
        a_esclarecer=tuple(dados.get("a_esclarecer") or ()),
    )


def converter_prazo(dados: dict) -> Prazo:
    return Prazo(inicio=dados["inicio"], fim=dados["fim"], dias=int(dados["dias"]), frase_fora=dados["frase_fora"])


def converter_ramo(dados: dict) -> Ramo:
    return Ramo(
        chave=dados["chave"],
        descricao=dados["descricao"],
        requisitos=tuple(converter_requisito(requisito) for requisito in dados["requisitos"]),
        prazo=converter_prazo(dados["prazo"]) if dados.get("prazo") else None,
        textos=dict(dados["textos"]),
        fontes=tuple(dados.get("fontes", ())),
    )


def converter_orientacao(dados: dict) -> ModeloDeOrientacao:
    return ModeloDeOrientacao(
        chave=dados["chave"],
        tipo=Tipo[dados["tipo"].upper()],
        quando=dados["quando"],
        titulo=dados["titulo"],
        instrucao=dados["instrucao"],
        motivo=dados["motivo"],
        fontes=tuple(dados["fontes"]),
        depende_de=tuple(dados["depende_de"]) if dados.get("depende_de") is not None else None,
        pendencia=dados.get("pendencia") or "",
        ramo=dados.get("ramo"),
    )


def para_json(ficha: Ficha) -> dict:
    """Serializa a ficha no mesmo formato lido por ler_ficha."""

    def data(valor: date | None) -> str:
        return valor.isoformat() if valor else ""

    def sem_vazios(dados: dict, padroes: dict) -> dict:
        return {chave: valor for chave, valor in dados.items() if chave not in padroes or valor != padroes[chave]}

    padroes_do_campo = {campo.name: campo.default for campo in fields(Campo) if campo.default is not MISSING}
    return {
        "chave": ficha.chave,
        "versao": ficha.versao,
        "geracao": {**vars(ficha.geracao), "gerada_em": data(ficha.geracao.gerada_em)},
        "edital": {**vars(ficha.edital), "assinado_em": data(ficha.edital.assinado_em), "canais_de_duvida": list(ficha.edital.canais_de_duvida)},
        "limite": ficha.limite,
        "documentos": [{**vars(documento), "consultado_em": data(documento.consultado_em)} for documento in ficha.documentos.values()],
        "trechos": [sem_vazios(vars(trecho), {"observacao": ""}) for trecho in ficha.trechos.values()],
        "campos": [sem_vazios(vars(campo), padroes_do_campo) for campo in ficha.campos.values()],
        "ramos": [
            {
                "chave": ramo.chave,
                "descricao": ramo.descricao,
                "fontes": list(ramo.fontes),
                "requisitos": [
                    {"campo": r.campo, "atende": list(r.atende), "contraria": r.contraria, "a_esclarecer": list(r.a_esclarecer)}
                    for r in ramo.requisitos
                ],
                **({"prazo": vars(ramo.prazo)} if ramo.prazo else {}),
                "textos": ramo.textos,
            }
            for ramo in ficha.ramos.values()
        ],
        "orientacoes": [
            sem_vazios(
                {
                    **vars(modelo),
                    "tipo": modelo.tipo.name.lower(),
                    "fontes": list(modelo.fontes),
                    "depende_de": list(modelo.depende_de) if modelo.depende_de is not None else None,
                },
                {"depende_de": None, "pendencia": "", "ramo": None},
            )
            for modelo in ficha.orientacoes
        ],
    }


def validar(ficha: Ficha) -> list[str]:
    problemas = []
    for trecho in ficha.trechos.values():
        problemas += problemas_do_trecho(ficha, trecho)
    for campo in ficha.campos.values():
        problemas += problemas_do_campo(campo)
    for ramo in ficha.ramos.values():
        problemas += problemas_do_ramo(ficha, ramo)
    for modelo in ficha.orientacoes:
        problemas += problemas_da_orientacao(ficha, modelo)
    return problemas


def problemas_do_trecho(ficha: Ficha, trecho: Trecho) -> list[str]:
    problemas = []
    documento = ficha.documentos.get(trecho.documento)
    if documento is None:
        problemas.append(f"trecho {trecho.chave}: documento {trecho.documento} inexistente")
    elif not 1 <= trecho.pagina <= documento.paginas:
        problemas.append(f"trecho {trecho.chave}: página {trecho.pagina} fora do documento")
    if not trecho.texto.strip():
        problemas.append(f"trecho {trecho.chave}: texto vazio")
    return problemas


def problemas_do_campo(campo: Campo) -> list[str]:
    problemas = []
    if campo.tipo not in TIPOS_DE_CAMPO:
        problemas.append(f"campo {campo.chave}: tipo {campo.tipo} desconhecido")
    if campo.tipo == "escolha" and not campo.opcoes:
        problemas.append(f"campo {campo.chave}: escolha sem opções")
    if campo.padrao not in (None, PADRAO_DATA_DE_HOJE) or (campo.padrao and campo.tipo != "data"):
        problemas.append(f"campo {campo.chave}: padrão {campo.padrao} inválido")
    if campo.chave == CHAVE_DOS_EVENTOS:
        problemas.append(f"campo {campo.chave}: nome reservado")
    if campo.identifica_evento and not campo.por_evento:
        problemas.append(f"campo {campo.chave}: identifica evento sem pertencer ao evento")
    if campo.por_evento and not campo.extraivel:
        problemas.append(f"campo {campo.chave}: campo de evento precisa ser extraível")
    return problemas


def problemas_do_requisito(ficha: Ficha, requisito: Requisito, contexto: str) -> list[str]:
    valores = [*requisito.atende, *requisito.contraria, *requisito.a_esclarecer]
    return _conferir_valores(ficha, requisito.campo, valores, contexto)


def problemas_do_prazo(ficha: Ficha, prazo: Prazo, contexto: str) -> list[str]:
    problemas = []
    for chave in (prazo.inicio, prazo.fim):
        if ficha.campos.get(chave) is None or ficha.campos[chave].tipo != "data":
            problemas.append(f"{contexto}: prazo usa {chave}, que não é campo de data")
    if prazo.dias <= 0:
        problemas.append(f"{contexto}: prazo de {prazo.dias} dias")
    return problemas


def problemas_do_ramo(ficha: Ficha, ramo: Ramo) -> list[str]:
    contexto = f"ramo {ramo.chave}"
    problemas = []
    for requisito in ramo.requisitos:
        problemas += problemas_do_requisito(ficha, requisito, contexto)
    if ramo.prazo is not None:
        problemas += problemas_do_prazo(ficha, ramo.prazo, contexto)
    problemas += [f"{contexto}: falta o texto {chave}" for chave in TEXTOS_DO_RAMO if chave not in ramo.textos]
    problemas += [f"{contexto}: fonte {fonte} inexistente" for fonte in ramo.fontes if fonte not in ficha.trechos]
    return problemas


def problemas_da_orientacao(ficha: Ficha, modelo: ModeloDeOrientacao) -> list[str]:
    contexto = f"orientação {modelo.chave}"
    problemas = []
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
        elif tipo == "ramo" and (argumento not in MARCADORES_DE_RAMO or ramo is None):
            problemas.append(f"{contexto}: marcador ramo:{argumento} sem ramo")
    sobra = MARCADOR.sub("", texto)
    if "{" in sobra or "}" in sobra:
        problemas.append(f"{contexto}: marcador desconhecido em “{texto[:60]}”")
    return problemas
