"""Consulta pública do Portal de Editais da UFAC, sem catálogo demonstrativo."""

from __future__ import annotations

import hashlib
import io
import re
import time
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urldefrag, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from urllib.robotparser import RobotFileParser

ORIGEM = "https://www3.ufac.br"
AGENTE = "PonteUFAC/1.0 (consulta de editais publicos)"
MAX_BYTES = 12 * 1024 * 1024
MAX_PAGINAS = 20


class FalhaConsulta(RuntimeError):
    """A consulta não pode ser apresentada como completa ou verificada."""


def url_oficial(url: str) -> str:
    try:
        partes = urlsplit(url)
        porta = partes.port
    except ValueError as erro:
        raise FalhaConsulta("Endereço inválido para a coleta.") from erro
    if (partes.scheme != "https" or partes.hostname != "www3.ufac.br"
            or partes.username or partes.password or porta not in (None, 443)):
        raise FalhaConsulta("O endereço de coleta não pertence ao portal oficial permitido.")
    return urldefrag(url)[0]


class _Redirecionamento(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        url_oficial(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


@dataclass(frozen=True)
class Link:
    titulo: str
    url: str


@dataclass(frozen=True)
class RegistroEdital(Link):
    orgao: str
    ano: int | None


@dataclass(frozen=True)
class Listagem:
    url: str
    consultado_em: datetime
    links: tuple[Link, ...]
    paginas: int


@dataclass(frozen=True)
class DocumentoVerificado:
    url: str
    consultado_em: datetime
    sha256: str
    tamanho: int
    paginas: tuple[str, ...]
    processo: str | None
    formato: str = "PDF"

    @property
    def precisa_ocr(self) -> bool:
        return self.formato == "PDF" and any(len(re.sub(r"\s", "", pagina)) < 40 for pagina in self.paginas)


class _LinksConteudo(HTMLParser):
    """Só extrai o conteúdo da seleção, excluindo o menu global do Plone."""

    VAZIAS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self, identificador="content-core"):
        super().__init__(convert_charrefs=True)
        self.pilha = []
        self.profundidade = None
        self.encontrou = False
        self.atual = None
        self.links = []
        self.textos = []
        self.identificador = identificador

    def handle_starttag(self, tag, attrs):
        atributos = dict(attrs)
        if tag not in self.VAZIAS:
            self.pilha.append(tag)
        if atributos.get("id") == self.identificador:
            self.profundidade = len(self.pilha)
            self.encontrou = True
        if self.profundidade is not None and tag == "a":
            self.atual = [atributos.get("href", ""), []]

    def handle_data(self, data):
        if self.profundidade is not None and not any(t in self.pilha for t in ("script", "style")):
            if data.strip():
                self.textos.append(data.strip())
        if self.atual is not None:
            self.atual[1].append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.atual is not None:
            href, partes = self.atual
            titulo = " ".join(" ".join(partes).split())
            if href and titulo:
                self.links.append(Link(titulo, href))
            self.atual = None
        if tag in self.pilha:
            indice = len(self.pilha) - 1 - self.pilha[::-1].index(tag)
            del self.pilha[indice:]
        if self.profundidade is not None and len(self.pilha) < self.profundidade:
            self.profundidade = None


def ler_links(html: str, base: str) -> tuple[Link, ...]:
    parser = _LinksConteudo()
    parser.feed(html)
    if not parser.encontrou:
        raise FalhaConsulta("A estrutura do portal mudou: a área de conteúdo não foi encontrada.")
    return tuple(Link(link.titulo, urljoin(base, link.url)) for link in parser.links)


def classificar(titulo: str) -> str:
    texto = "".join(c for c in unicodedata.normalize("NFKD", titulo.lower()) if not unicodedata.combining(c))
    if any(p in texto for p in ("resultado", "homolog", "inscritos", "classifica")):
        return "Resultado ou lista"
    if any(p in texto for p in ("adendo", "retifica")):
        return "Alteração indicada no portal"
    if "anexo" in texto:
        return "Anexos indicados no portal"
    if any(p in texto for p in ("chamada", "chamamento")):
        return "Chamada ou chamamento"
    if "inscri" in texto or "documenta" in texto:
        return "Acesso à inscrição"
    if "edital" in texto:
        return "Edital indicado no portal"
    return "Documento a classificar"


class ClienteUFAC:
    def __init__(self, transporte=None, intervalo=0.25):
        self.transporte = transporte or self._http
        self.intervalo = intervalo
        self.ultimo_acesso = 0.0
        self.robos = None

    def _http(self, url):
        try:
            req = Request(url, headers={"User-Agent": AGENTE, "Accept-Encoding": "identity"})
            with build_opener(_Redirecionamento()).open(req, timeout=15) as resposta:
                url_oficial(resposta.url)
                dados = resposta.read(MAX_BYTES + 1)
                if len(dados) > MAX_BYTES:
                    raise FalhaConsulta("O arquivo excede o limite de 12 MiB.")
                return dados, resposta.headers.get_content_type()
        except HTTPError as erro:
            raise FalhaConsulta(f"O portal respondeu HTTP {erro.code}. Tente atualizar a consulta.") from erro
        except (URLError, TimeoutError, OSError) as erro:
            raise FalhaConsulta("Não foi possível acessar a UFAC dentro do tempo de espera.") from erro

    def obter(self, url):
        url = url_oficial(url)
        if self.robos is None:
            dados, _ = self.transporte(f"{ORIGEM}/robots.txt")
            self.robos = RobotFileParser()
            self.robos.parse(dados.decode("utf-8", errors="replace").splitlines())
        if not self.robos.can_fetch(AGENTE, url):
            raise FalhaConsulta("O robots.txt do portal não permite esta consulta automatizada.")
        time.sleep(max(0, self.intervalo - (time.monotonic() - self.ultimo_acesso)))
        try:
            dados, tipo = self.transporte(url)
            if len(dados) > MAX_BYTES:
                raise FalhaConsulta("O arquivo excede o limite de 12 MiB.")
            return dados, tipo
        finally:
            self.ultimo_acesso = time.monotonic()

    def listar(self, pagina: str) -> Listagem:
        raiz = url_oficial(pagina).rstrip("/")
        pendentes, visitadas, documentos = [raiz], set(), {}
        while pendentes:
            url = pendentes.pop(0)
            if url in visitadas:
                continue
            if len(visitadas) >= MAX_PAGINAS:
                raise FalhaConsulta("A listagem excedeu o limite de páginas; a consulta não está completa.")
            dados, tipo = self.obter(url)
            if tipo not in ("text/html", "application/xhtml+xml"):
                raise FalhaConsulta("A página da seleção não retornou HTML.")
            visitadas.add(url)
            for link in ler_links(dados.decode("utf-8", errors="replace"), url):
                partes = urlsplit(link.url)
                if partes.hostname != "www3.ufac.br":
                    continue
                url_oficial(link.url)
                if partes.path.rstrip("/") == urlsplit(raiz).path:
                    consulta = parse_qs(partes.query)
                    if set(consulta) == {"b_start:int"} and consulta["b_start:int"][0].isdigit():
                        if link.url not in visitadas and link.url not in pendentes:
                            pendentes.append(link.url)
                    continue
                if partes.path.startswith(urlsplit(raiz).path + "/") and not partes.query:
                    documentos[link.url] = link
        if not documentos:
            raise FalhaConsulta("Nenhum registro foi encontrado. O portal pode ter mudado de estrutura.")
        return Listagem(raiz, datetime.now(timezone.utc), tuple(documentos.values()), len(visitadas))

    def catalogo(self, ano: int) -> Listagem:
        if not 2000 <= ano <= datetime.now(timezone.utc).year:
            raise FalhaConsulta("Ano de consulta inválido.")
        pagina = self.listar(f"{ORIGEM}/proaes/{ano}")
        prefixo = f"/proaes/{ano}/"
        links = tuple(link for link in pagina.links
                      if urlsplit(link.url).path.startswith(prefixo)
                      and "/" not in urlsplit(link.url).path[len(prefixo):]
                      and not urlsplit(link.url).path.endswith((".pdf", ".jpg", ".png")))
        if not links:
            raise FalhaConsulta("Não foi possível identificar as seleções na página do ano.")
        return Listagem(pagina.url, pagina.consultado_em, links, pagina.paginas)

    def catalogo_portal(self) -> Listagem:
        """Lê o índice transversal que o próprio portal publica na navegação.

        Evita milhares de downloads ao abrir a tela. Pastas ausentes desse índice
        continuam acessíveis pelo explorador de setores e suas subpastas.
        """
        url = f"{ORIGEM}/editais"
        dados, tipo = self.obter(url)
        if tipo not in ("text/html", "application/xhtml+xml"):
            raise FalhaConsulta("O índice geral da UFAC não retornou HTML.")
        parser = _LinksConteudo("portal-globalnav")
        parser.feed(dados.decode("utf-8", errors="replace"))
        if not parser.encontrou:
            raise FalhaConsulta("O índice de navegação do portal mudou de estrutura.")
        links = {}
        for link in parser.links:
            destino = urljoin(url, link.url)
            partes = urlsplit(destino)
            if partes.hostname == "www3.ufac.br" and not partes.query:
                url_oficial(destino)
                links[destino.rstrip("/")] = Link(link.titulo, destino.rstrip("/"))
        registros = []
        for destino, link in links.items():
            caminho = urlsplit(destino).path.strip("/").split("/")
            texto = "".join(c for c in unicodedata.normalize("NFKD", link.titulo.casefold())
                            if not unicodedata.combining(c))
            if len(caminho) < 2 or classificar(link.titulo) in (
                "Resultado ou lista", "Alteração indicada no portal", "Anexos indicados no portal",
                "Acesso à inscrição",
            ):
                continue
            if not re.search(r"edital|selec|concurso|chamamento|chamada|ingresso|matricula", texto):
                continue
            # Centros, programas e campi podem ter um órgão intermediário.
            prefixo = caminho[:2] if caminho[0] in ("centros", "campi") else caminho[:1]
            orgao_url = ORIGEM + "/" + "/".join(prefixo)
            orgao = links.get(orgao_url, Link(prefixo[-1], orgao_url)).titulo
            anos_path = re.findall(r"(?:^|/)(20\d{2})(?:/|$)", urlsplit(destino).path)
            anos_titulo = re.findall(r"\b(20\d{2})\b", link.titulo)
            ano = int((anos_path or anos_titulo)[0]) if anos_path or anos_titulo else None
            registros.append(RegistroEdital(link.titulo, destino, orgao, ano))
        if not registros:
            raise FalhaConsulta("Nenhuma seleção foi identificada no índice geral; consulte o portal oficial.")
        return Listagem(url, datetime.now(timezone.utc), tuple(registros), 1)

    def secoes(self) -> Listagem:
        url = f"{ORIGEM}/editais"
        dados, tipo = self.obter(url)
        if tipo != "text/html":
            raise FalhaConsulta("O portal geral não retornou HTML.")
        encontrados = {}
        for link in ler_links(dados.decode("utf-8", errors="replace"), url):
            partes = urlsplit(link.url)
            if (partes.hostname == "www3.ufac.br" and not partes.query
                    and not partes.path.startswith("/author/")
                    and link.titulo not in ("Leia mais…", "Leia mais...", "Anterior", "Próximos")):
                encontrados.setdefault(link.url, link)
        return Listagem(url, datetime.now(timezone.utc), tuple(encontrados.values()), 1)

    def ler_publicacao(self, url: str) -> DocumentoVerificado:
        """Leitura geral de PDF, HTML e DOCX. O formato vem dos bytes obtidos."""
        dados, tipo = self.obter(url)
        if dados.startswith(b"%PDF"):
            return self._pdf(url, dados)
        if tipo in ("text/html", "application/xhtml+xml"):
            parser = _LinksConteudo()
            parser.feed(dados.decode("utf-8", errors="replace"))
            if not parser.encontrou or not parser.textos:
                raise FalhaConsulta("A publicação HTML não contém texto identificável na área principal.")
            paginas, formato = ("\n".join(parser.textos),), "HTML"
        elif dados.startswith(b"PK"):
            try:
                with zipfile.ZipFile(io.BytesIO(dados)) as pacote:
                    info = pacote.getinfo("word/document.xml")
                    if info.file_size > MAX_BYTES:
                        raise FalhaConsulta("O texto descompactado excede o limite de leitura.")
                    xml = ET.fromstring(pacote.read(info))
                ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                texto = "\n".join("".join(t.text or "" for t in p.findall('.//w:t', ns))
                                  for p in xml.findall('.//w:p', ns))
                paginas, formato = (texto,), "DOCX"
            except (KeyError, zipfile.BadZipFile, ET.ParseError, RuntimeError) as erro:
                raise FalhaConsulta("O arquivo não é um DOCX legível. Consulte a fonte oficial.") from erro
        else:
            raise FalhaConsulta("Este formato ainda não tem leitor na Ponte. Abra o arquivo oficial para consultar.")
        processo = re.search(r"23107\.\d{6}/\d{4}-\d{2}", " ".join(paginas))
        return DocumentoVerificado(url, datetime.now(timezone.utc), hashlib.sha256(dados).hexdigest(),
                                   len(dados), paginas, processo.group(0) if processo else None, formato)

    def documento(self, url: str) -> DocumentoVerificado:
        dados, _ = self.obter(url)
        if not dados.startswith(b"%PDF"):
            raise FalhaConsulta("O link não retornou um PDF. Abra a página oficial para conferir o conteúdo.")
        return self._pdf(url, dados)

    def _pdf(self, url, dados):
        from pypdf import PdfReader

        try:
            pdf = PdfReader(io.BytesIO(dados))
            if pdf.is_encrypted or not len(pdf.pages) or len(pdf.pages) > 200:
                raise FalhaConsulta("PDF protegido, sem páginas ou acima do limite de 200 páginas.")
            paginas = tuple(pagina.extract_text() or "" for pagina in pdf.pages)
        except FalhaConsulta:
            raise
        except Exception as erro:
            raise FalhaConsulta("O PDF foi obtido, mas não pôde ser lido. Consulte o arquivo oficial.") from erro
        processo = re.search(r"23107\.\d{6}/\d{4}-\d{2}", " ".join(paginas))
        return DocumentoVerificado(url, datetime.now(timezone.utc), hashlib.sha256(dados).hexdigest(),
                                   len(dados), paginas, processo.group(0) if processo else None)
