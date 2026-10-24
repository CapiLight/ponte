"""Telas de consulta a fontes públicas; cache temporário sem dados de estudantes."""

from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

import streamlit as st

from ponte.coleta_ufac import ClienteUFAC, FalhaConsulta, classificar
from ponte.fontes import EDITAL_01_2026
from ponte.leitura_edital import analisar_publicacao

FUSO = timezone(timedelta(hours=-5))


def horario(valor):
    return valor.astimezone(FUSO).strftime("%d/%m/%Y às %H:%M:%S (Rio Branco)")


@st.cache_data(ttl=300, max_entries=10, show_spinner=False)
def catalogo(ano):
    return ClienteUFAC().catalogo(ano)


@st.cache_data(ttl=300, max_entries=2, show_spinner=False)
def indice_geral():
    return ClienteUFAC().catalogo_portal()


@st.cache_data(ttl=300, max_entries=2, show_spinner=False)
def setores_portal():
    return ClienteUFAC().secoes()


@st.cache_data(ttl=300, max_entries=24, show_spinner=False)
def ler_publicacao(url):
    return ClienteUFAC().ler_publicacao(url)


@st.cache_data(ttl=300, max_entries=40, show_spinner=False)
def detalhes(url):
    return ClienteUFAC().listar(url)


@st.cache_data(ttl=300, max_entries=40, show_spinner=False)
def verificar_pdf(url):
    return ClienteUFAC().documento(url)


def limpar_consultas():
    indice_geral.clear()
    setores_portal.clear()
    ler_publicacao.clear()
    catalogo.clear()
    detalhes.clear()
    verificar_pdf.clear()
    st.session_state.pop("fontes_verificadas_em", None)


def fluxo_liberado():
    quando = st.session_state.get("fontes_verificadas_em")
    return quando is not None and (datetime.now(timezone.utc) - quando).total_seconds() < 300


def conferir_fluxo_guiado():
    st.markdown("#### Conferência atual das fontes")
    st.caption("As regras deste fluxo foram revisadas para versões específicas dos PDFs. "
               "A consulta compara os arquivos publicados agora e procura alterações na listagem completa.")
    if st.button("Conferir fontes na UFAC", key="conferir_guiado"):
        st.session_state.pop("fontes_verificadas_em", None)
        try:
            with st.spinner("Consultando a pasta oficial, paginação e PDFs..."):
                # Esta ação explícita deve refazer a consulta, mesmo dentro do TTL.
                detalhes.clear()
                verificar_pdf.clear()
                listagem = detalhes(EDITAL_01_2026.pagina_oficial)
                urls = {link.url for link in listagem.links}
                alteracoes = [link for link in listagem.links
                              if classificar(link.titulo) == "Alteração indicada no portal"]
                if alteracoes:
                    raise FalhaConsulta("Há adendo ou retificação na pasta oficial. As regras precisam "
                                        "de revisão antes de liberar a orientação personalizada.")
                for documento in EDITAL_01_2026.documentos.values():
                    if documento.url not in urls:
                        raise FalhaConsulta("Um documento revisado não está mais na listagem oficial.")
                    atual = verificar_pdf(documento.url)
                    if atual.sha256 != documento.sha256:
                        raise FalhaConsulta("Um PDF publicado difere da versão revisada. "
                                            "Consulte a fonte oficial; a orientação fica suspensa até revisão.")
                st.session_state.fontes_verificadas_em = datetime.now(timezone.utc)
        except FalhaConsulta as erro:
            st.error(str(erro))
    if fluxo_liberado():
        st.success("Os PDFs publicados coincidem com as versões revisadas. "
                   "Não foi identificado adendo ou retificação pelos títulos da listagem consultada.")
        st.caption(f"Conferência: {horario(st.session_state.fontes_verificadas_em)}. "
                   "Válida por 5 minutos. Isso não certifica inscrições abertas nem ausência de alterações mal rotuladas.")
    else:
        st.info("Confira as fontes para iniciar ou retomar o fluxo guiado. "
                "Falha de acesso não será substituída por dados demonstrativos.")


def pagina_catalogo(chave="", modelo="models/gemma-4-26b-a4b-it"):
    st.subheader("Editais reais da UFAC")
    st.write("Busca geral no Portal de Editais: ensino, pesquisa, extensão, assistência estudantil, "
             "concursos e demais seleções publicadas. Os registros são obtidos da UFAC, sem exemplos fictícios.")
    if st.button("Atualizar consulta na UFAC", on_click=limpar_consultas):
        st.session_state.pop("pdf_consultado", None)
    modo = st.radio("Como deseja consultar?", ["Buscar editais", "Explorar setores e pastas"], horizontal=True)
    try:
        with st.spinner("Consultando o portal oficial da UFAC..."):
            lista = indice_geral() if modo == "Buscar editais" else setores_portal()
    except FalhaConsulta as erro:
        st.error(str(erro))
        st.link_button("Abrir Portal de Editais", "https://www3.ufac.br/editais")
        return
    st.caption(f"Obtido em {horario(lista.consultado_em)}. Cache de até 5 minutos; "
               "o botão de atualização refaz a consulta. Nenhum prazo é inferido da data de publicação.")
    if modo == "Buscar editais":
        st.caption("Cobertura: índice de navegação publicado pelo portal, incluindo anos anteriores. "
                   "A busca não baixa todos os documentos. Use o explorador para abrir outras pastas oficiais.")
        orgaos = sorted({item.orgao for item in lista.links})
        orgao = st.selectbox("Órgão ou centro", ["Todos"] + orgaos)
        anos = sorted({item.ano for item in lista.links if item.ano}, reverse=True)
        opcoes_anos = ["Todos"] + [str(ano) for ano in anos] + ["Ano não identificado"]
        atual = str(datetime.now(FUSO).year)
        ano = st.selectbox("Ano identificado", opcoes_anos, index=opcoes_anos.index(atual) if atual in opcoes_anos else 0)
        filtro = st.text_input("Buscar no título", placeholder="Ex.: mestrado, monitoria, professor, extensão")
        registros = [item for item in lista.links
                     if (orgao == "Todos" or item.orgao == orgao)
                     and (ano == "Todos" or (ano == "Ano não identificado" and item.ano is None) or str(item.ano) == ano)
                     and filtro.casefold() in item.titulo.casefold()]
        st.caption(f"{len(registros)} registro(s) para os filtros; {len(lista.links)} no índice obtido.")
        st.dataframe([{"Título": item.titulo, "Órgão/centro": item.orgao, "Ano identificado": item.ano,
                       "Página oficial": item.url} for item in registros], hide_index=True, width="stretch",
                     column_config={"Página oficial": st.column_config.LinkColumn("Página oficial")})
    else:
        registros = list(lista.links)
        st.caption("Navegue pelas seções reais do portal e abra subpastas, sem restringir a consulta a uma pró-reitoria.")
    if not registros:
        st.info("Nenhum título corresponde à busca. Tente outro termo.")
        return
    por_url = {item.url: item for item in registros}
    selecionada = st.selectbox("Seleção" if modo == "Buscar editais" else "Setor do portal",
                              list(por_url), format_func=lambda valor: por_url[valor].titulo)
    if st.session_state.get("raiz_exploracao") != selecionada:
        st.session_state.raiz_exploracao = selecionada
        st.session_state.pasta_explorada = selecionada
    url = st.session_state.get("pasta_explorada", selecionada)
    if url != selecionada and st.button("Voltar à seleção inicial"):
        st.session_state.pasta_explorada = selecionada
        st.rerun()
    st.link_button("Abrir pasta oficial", url)
    st.info("Situação das inscrições: ainda não revisada pela Ponte. "
            "Confira o edital, as chamadas e alterações na pasta oficial.")
    try:
        with st.spinner("Lendo os documentos e as páginas seguintes da seleção..."):
            pasta = detalhes(url)
    except FalhaConsulta as erro:
        st.warning(str(erro))
        pasta = None
    if pasta is not None:
        st.caption(f"Pasta consultada em {horario(pasta.consultado_em)}; "
                   f"{pasta.paginas} página(s) de listagem percorrida(s).")
    st.markdown("#### Publicações da seleção")
    st.caption("A classificação usa o título publicado, não uma interpretação do conteúdo. "
               "Resultados e listas não se tornam requisitos documentais.")
    publicacoes = list(pasta.links) if pasta else []
    st.dataframe([{"Publicação": item.titulo, "Tipo indicado": classificar(item.titulo), "Fonte oficial": item.url}
                  for item in publicacoes], hide_index=True, width="stretch",
                 column_config={"Fonte oficial": st.column_config.LinkColumn("Fonte oficial")})
    documentos = {item.url: item.titulo for item in publicacoes}
    documentos.setdefault(url, "Texto da própria página")
    escolhido = st.selectbox("Publicação para ler", list(documentos), format_func=lambda valor: documentos[valor])
    st.link_button("Abrir publicação oficial", escolhido)
    if (escolhido != url and not urlsplit(escolhido).path.lower().endswith((".pdf", ".docx", ".doc", ".xls", ".xlsx"))
            and st.button("Explorar esta subpasta")):
        st.session_state.pasta_explorada = escolhido
        st.rerun()
    resultado = classificar(documentos[escolhido]) == "Resultado ou lista"
    if resultado:
        st.caption("Este arquivo pode conter dados de candidatos. Prefira abrir diretamente a fonte oficial; "
                   "ele não deve alimentar as regras da preparação.")
    if st.button("Ler publicação no site da UFAC"):
        st.session_state.pop("pdf_consultado", None)
        try:
            with st.spinner("Obtendo e lendo a publicação oficial..."):
                ler_publicacao.clear()
                st.session_state.pdf_consultado = ler_publicacao(escolhido)
                st.session_state.pop("leitura_ia", None)
        except FalhaConsulta as erro:
            st.error(str(erro))
    documento = st.session_state.get("pdf_consultado")
    if documento is not None and documento.url == escolhido:
        st.success(f"Publicação obtida do portal oficial ({documento.formato}). O conteúdo ainda exige revisão para gerar orientações.")
        st.caption(f"Consulta: {horario(documento.consultado_em)} · "
                   f"{len(documento.paginas)} página(s)/bloco(s) · {documento.tamanho:,} bytes")
        st.write("Processo identificado:", documento.processo or "Não identificado no texto extraído")
        st.code(documento.sha256, language=None)
        st.link_button("Abrir documento oficial", documento.url)
        if documento.precisa_ocr:
            st.warning("Há página sem texto suficiente. OCR ou conferência visual são necessários; "
                       "nenhum requisito será inferido da ausência de texto.")
        with st.expander("Conferir texto por página"):
            pagina = st.number_input("Página", 1, len(documento.paginas), 1, key=f"pagina_{documento.sha256}")
            st.text(documento.paginas[pagina - 1] or "Sem texto extraível nesta página.")
        st.caption("Texto extraído não comprova interpretação correta. O rótulo do link pode divergir do conteúdo.")
        if not resultado:
            st.markdown("#### Ler informações do documento com Gemma")
            st.caption("Extrai objeto, público, prazos, valores, documentos e passos, cada um com trecho e página. "
                       "A leitura abrange este arquivo, não consolida automaticamente anexos e retificações. "
                       "HTML e DOCX têm blocos de texto, sem paginação física preservada.")
            intervalo = st.slider("Páginas/blocos para análise", 1, max(2, len(documento.paginas)),
                                  (1, len(documento.paginas)) if len(documento.paginas) > 1 else (1, 1),
                                  key=f"intervalo_{documento.sha256}") if len(documento.paginas) > 1 else (1, 1)
            if st.button("Extrair informações com Gemma", disabled=not bool(chave)):
                st.session_state.pop("leitura_ia", None)
                try:
                    with st.spinner("Lendo o texto e conferindo as evidências..."):
                        paginas = documento.paginas[intervalo[0] - 1:intervalo[1]]
                        itens, descartes = analisar_publicacao(paginas, chave, modelo)
                        st.session_state.leitura_ia = (documento.sha256, itens, descartes, intervalo[0] - 1)
                except FalhaConsulta as erro:
                    st.error(str(erro))
            if not chave:
                st.caption("Configure GEMINI_API_KEY nos secrets para usar a leitura com IA. A consulta e o texto não dependem da chave.")
            leitura = st.session_state.get("leitura_ia")
            if leitura and leitura[0] == documento.sha256:
                st.warning("Informações extraídas por IA, ainda não revisadas. A presença do trecho não comprova "
                           "a interpretação nem a cobertura de todos os requisitos.")
                st.caption(f"Documento: {documento.url}. A análise começa na página/bloco {leitura[3] + 1}.")
                for item in leitura[1]:
                    with st.container(border=True):
                        st.caption(item["campo"].capitalize())
                        st.write(item["descricao"])
                        with st.expander(f"Evidência, página/bloco {item['pagina'] + leitura[3]}"):
                            st.text(item["trecho"])
                st.caption(f"{len(leitura[1])} informação(ões) com trecho localizado; {leitura[2]} descartada(s).")
