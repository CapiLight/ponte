import hashlib
import io
import unittest
from datetime import datetime, timezone

from pypdf import PdfWriter

from ponte.coleta_ufac import (
    ClienteUFAC, FalhaConsulta, ORIGEM, _Redirecionamento, classificar, ler_links, url_oficial,
)


def html(conteudo):
    return (f'<nav><a href="{ORIGEM}/proaes/2026/nao-incluir">Menu global</a></nav>'
            f'<div id="content-core">{conteudo}</div>'
            '<footer><a href="/rodape">Rodapé</a></footer>').encode()


class TestColetaUFAC(unittest.TestCase):
    def cliente(self, paginas, robots=b"User-agent: *\nDisallow:\n"):
        chamadas = []

        def transporte(url):
            chamadas.append(url)
            if url.endswith('/robots.txt'):
                return robots, 'text/plain'
            valor = paginas[url]
            if isinstance(valor, Exception):
                raise valor
            return valor

        return ClienteUFAC(transporte, intervalo=0), chamadas

    def test_exclui_menu_e_rodape_preserva_rotulo_com_tags(self):
        links = ler_links(html('<a href="edital.pdf"><b>Edital</b> principal</a>').decode(), ORIGEM + '/pasta/')
        self.assertEqual([(x.titulo, x.url) for x in links], [('Edital principal', ORIGEM + '/pasta/edital.pdf')])

    def test_detecta_mudanca_no_layout(self):
        with self.assertRaises(FalhaConsulta):
            ler_links('<html>Site indisponível</html>', ORIGEM)

    def test_paginacao_remove_duplicatas_e_nao_entra_em_ciclo(self):
        base = ORIGEM + '/proaes/2026/selecionado'
        segunda = base + '?b_start:int=20'
        c, chamadas = self.cliente({
            base: (html(f'<a href="{base}/edital.pdf">Edital</a><a href="{segunda}">Próximos</a>'), 'text/html'),
            segunda: (html(f'<a href="{base}/edital.pdf">Edital</a><a href="{base}/adendo.pdf">Adendo 01</a>'
                           f'<a href="{segunda}">Atual</a><a href="{base}">Voltar</a>'), 'text/html'),
        })
        lista = c.listar(base)
        self.assertEqual(lista.paginas, 2)
        self.assertEqual(len(lista.links), 2)
        self.assertEqual(chamadas.count(segunda), 1)

    def test_falha_na_segunda_pagina_nao_publica_listagem_parcial(self):
        base = ORIGEM + '/proaes/2026/selecao'
        segunda = base + '?b_start:int=20'
        c, _ = self.cliente({
            base: (html(f'<a href="{base}/edital.pdf">Edital</a><a href="{segunda}">Próximos</a>'), 'text/html'),
            segunda: FalhaConsulta('rede indisponível'),
        })
        with self.assertRaises(FalhaConsulta):
            c.listar(base)

    def test_catalogo_nao_inclui_pdf_como_selecao(self):
        ano = datetime.now(timezone.utc).year
        base = f'{ORIGEM}/proaes/{ano}'
        c, _ = self.cliente({base: (html(f'<a href="{base}/edital-real">Seleção publicada</a>'
                                        f'<a href="{base}/aviso.pdf">Arquivo</a>'), 'text/html')})
        self.assertEqual([x.titulo for x in c.catalogo(ano).links], ['Seleção publicada'])

    def test_dominios_e_redirecionamentos_externos_bloqueados(self):
        for url in ['http://www3.ufac.br/a', 'https://www3.ufac.br.exemplo.org/a',
                    'https://www3.ufac.br@127.0.0.1/a', 'https://www3.ufac.br:444/a',
                    'https://www3.ufac.br:invalido/a']:
            with self.subTest(url=url), self.assertRaises(FalhaConsulta):
                url_oficial(url)
        with self.assertRaises(FalhaConsulta):
            _Redirecionamento().redirect_request(None, None, 302, '', {}, 'https://127.0.0.1/a')

    def test_respeita_robots(self):
        c, chamadas = self.cliente({}, robots=b'User-agent: *\nDisallow: /proaes/\n')
        with self.assertRaises(FalhaConsulta):
            c.listar(ORIGEM + '/proaes/2026')
        self.assertEqual(len(chamadas), 1)

    def test_extensao_pdf_nao_basta(self):
        url = ORIGEM + '/proaes/2026/falso.pdf'
        c, _ = self.cliente({url: (b'<html>Login</html>', 'text/html')})
        with self.assertRaises(FalhaConsulta):
            c.documento(url)

    def test_pdf_sem_extensao_e_sem_texto_marca_ocr(self):
        buffer = io.BytesIO()
        writer = PdfWriter()
        writer.add_blank_page(width=100, height=100)
        writer.write(buffer)
        dados = buffer.getvalue()
        url = ORIGEM + '/proaes/2026/documento/download'
        c, _ = self.cliente({url: (dados, 'application/octet-stream')})
        documento = c.documento(url)
        self.assertTrue(documento.precisa_ocr)
        self.assertEqual(len(documento.paginas), 1)
        self.assertEqual(documento.sha256, hashlib.sha256(dados).hexdigest())

    def test_resultado_retificado_nao_se_torna_alteracao_de_regra(self):
        self.assertEqual(classificar('Retificação do Resultado Final'), 'Resultado ou lista')
        self.assertEqual(classificar('Adendo nº 02'), 'Alteração indicada no portal')
        self.assertEqual(classificar('Anexos'), 'Anexos indicados no portal')


if __name__ == '__main__':
    unittest.main()
