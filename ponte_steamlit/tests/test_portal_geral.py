import io
import json
import unittest
import zipfile

from ponte.coleta_ufac import ClienteUFAC, FalhaConsulta, ORIGEM
from ponte.leitura_edital import validar_leitura


class TestPortalGeral(unittest.TestCase):
    def cliente(self, corpo, tipo='text/html'):
        def transporte(url):
            if url.endswith('robots.txt'):
                return b'User-agent: *\nDisallow:\n', 'text/plain'
            return corpo, tipo
        return ClienteUFAC(transporte, intervalo=0)

    def test_indice_transversal_identifica_orgaos_e_nao_inventa_ano(self):
        html = f'''<ul id="portal-globalnav">
            <li><a href="{ORIGEM}/proex">Proex</a>
              <a href="{ORIGEM}/proex/2026/edital-extensao">Edital de extensão</a></li>
            <li><a href="{ORIGEM}/propeg">Proppi</a>
              <a href="{ORIGEM}/propeg/edital-2025">Edital 02/2025 pesquisa</a>
              <a href="{ORIGEM}/propeg/sem-ano">Edital sem ano informado</a>
              <a href="{ORIGEM}/propeg/resultado">Resultado do Edital 02/2025</a></li>
            </ul><a href="{ORIGEM}/falso/edital">Edital fora do índice</a>'''
        lista = self.cliente(html.encode()).catalogo_portal()
        self.assertEqual(len(lista.links), 3)
        self.assertEqual([(x.orgao, x.ano) for x in lista.links],
                         [('Proex', 2026), ('Proppi', 2025), ('Proppi', None)])

    def test_html_lido_sem_executar_script_ou_incluir_menu(self):
        html = b'<nav>MENU</nav><div id="content-core"><p>Norma publicada.</p><script>IGNORAR</script></div>'
        doc = self.cliente(html).ler_publicacao(ORIGEM + '/proex/edital')
        self.assertEqual(doc.formato, 'HTML')
        self.assertIn('Norma publicada.', doc.paginas[0])
        self.assertNotIn('IGNORAR', doc.paginas[0])
        self.assertNotIn('MENU', doc.paginas[0])

    def test_docx_leitura_por_conteudo_sem_depender_da_extensao(self):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as arquivo:
            arquivo.writestr('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                             '<w:body><w:p><w:r><w:t>Declaração oficial.</w:t></w:r></w:p></w:body></w:document>')
        doc = self.cliente(buffer.getvalue(), 'application/octet-stream').ler_publicacao(ORIGEM + '/prograd/download')
        self.assertEqual(doc.formato, 'DOCX')
        self.assertIn('Declaração oficial.', doc.paginas[0])

    def test_citacao_inventada_ou_pagina_errada_descartada(self):
        dados = {'informacoes': [
            {'campo': 'publico', 'descricao': 'Graduação', 'pagina': 1, 'trecho': 'estudantes de graduação'},
            {'campo': 'valor', 'descricao': 'R$ 950', 'pagina': 1, 'trecho': 'R$ 950'},
            {'campo': 'publico', 'descricao': 'Graduação', 'pagina': 2, 'trecho': 'estudantes de graduação'},
        ]}
        itens, descartes = validar_leitura(json.dumps(dados), ('A seleção atende estudantes de graduação.',))
        self.assertEqual(len(itens), 1)
        self.assertEqual(descartes, 2)

    def test_texto_da_resposta_nao_pode_autenticar_citacao(self):
        dados = {'textoEdital': 'Prazo inventado', 'informacoes': [
            {'campo': 'prazo', 'descricao': 'Prazo inventado', 'pagina': 1, 'trecho': 'Prazo inventado'},
        ]}
        itens, descartes = validar_leitura(json.dumps(dados), ('Documento obtido independentemente.',))
        self.assertEqual(itens, [])
        self.assertEqual(descartes, 1)

    def test_formato_nao_suportado_nao_finge_leitura(self):
        with self.assertRaises(FalhaConsulta):
            self.cliente(b'arquivo binario', 'application/octet-stream').ler_publicacao(ORIGEM + '/arquivo.doc')


if __name__ == '__main__':
    unittest.main()
