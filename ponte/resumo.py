"""Resumo copiável, derivado apenas do estado atual do caso."""

from ponte.fatos import Caso, Estado
from ponte.ficha import Ficha
from ponte.plano import Orientacao, Plano, Tipo


def gerar_resumo(ficha: Ficha, caso: Caso, plano: Plano) -> str:
    edital = ficha.edital
    linhas = [
        "Resumo preparado com a Ponte (protótipo independente, sem vínculo oficial com a Ufac)",
        "",
        f"Edital: {edital.instituicao}, {edital.orgao}, Edital nº {edital.numero}, processo {edital.processo}.",
        f"Fontes consultadas em {_data_de_consulta(ficha)}. Situação das inscrições: consulte a página oficial.",
        _origem_da_ficha(ficha),
        "",
        "Informações declaradas",
    ]
    declarados, pendentes = [], []
    for chave, fato in caso.fatos.items():
        if fato.estado is Estado.SEM_RESPOSTA:
            continue
        estado = "" if fato.estado is Estado.NAO_SEI else f" ({fato.estado.value.lower()})"
        linha = f"- {caso.campos[chave].rotulo}: {caso.descrever(chave)}{estado}"
        (declarados if fato.conhecido else pendentes).append(linha)
    linhas += declarados or ["- Nenhuma informação confirmada."]
    linhas += ["", "Informações desconhecidas ou a conferir"]
    sem_resposta = [
        f"- {caso.campos[chave].rotulo}: sem resposta"
        for chave, fato in caso.fatos.items()
        if fato.estado is Estado.SEM_RESPOSTA and not caso.campos[chave].so_do_relato and caso.campos[chave].tipo != "texto"
    ]
    linhas += pendentes + sem_resposta or ["- Nenhuma."]

    for tipo in Tipo:
        orientacoes = plano.do_tipo(tipo)
        if orientacoes:
            linhas += ["", tipo.value]
            linhas += [_linha_da_orientacao(numero, orientacao, ficha) for numero, orientacao in enumerate(orientacoes, 1)]

    linhas += ["", "Documentos oficiais"]
    linhas += [f"- Página do edital: {edital.pagina_oficial}"]
    linhas += [f"- {documento.titulo}: {documento.url}" for documento in ficha.documentos.values()]
    linhas += [f"- Dúvidas: {', '.join(edital.canais_de_duvida)}"]
    linhas += ["", f"Limite: {ficha.limite}"]
    return "\n".join(linhas)


def _origem_da_ficha(ficha: Ficha) -> str:
    if ficha.geracao.automatica:
        gerada_em = f" em {ficha.geracao.gerada_em:%d/%m/%Y}" if ficha.geracao.gerada_em else ""
        return (
            f"As orientações vêm de uma leitura automática do edital feita pelo modelo {ficha.geracao.modelo}"
            f"{gerada_em}, sem revisão humana. Confira cada fonte citada."
        )
    return "As orientações vêm de uma leitura do edital feita pela equipe da Ponte."


def _linha_da_orientacao(numero: int, orientacao: Orientacao, ficha: Ficha) -> str:
    partes = [f"{numero}. {orientacao.titulo}. {orientacao.instrucao}"]
    if orientacao.pendencia:
        partes.append(f"Observação: {orientacao.pendencia}")
    partes.append("Fonte: " + "; ".join(ficha.citar(chave) for chave in orientacao.fontes) + ".")
    return " ".join(partes)


def _data_de_consulta(ficha: Ficha) -> str:
    datas = sorted({documento.consultado_em for documento in ficha.documentos.values()})
    return ", ".join(f"{data:%d/%m/%Y}" for data in datas)
