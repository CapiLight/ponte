import unittest
from types import SimpleNamespace
from unittest.mock import patch

from streamlit.testing.v1 import AppTest

from ponte.coleta_ufac import FalhaConsulta, Link
from ponte.fontes import EDITAL_01_2026


SCRIPT = '''
import streamlit as st
from consulta_ui import conferir_fluxo_guiado, fluxo_liberado
conferir_fluxo_guiado()
st.button("Continuar teste", disabled=not fluxo_liberado())
'''


class TestBloqueioFontes(unittest.TestCase):
    def listagem(self, extra=()):
        return SimpleNamespace(links=tuple(
            Link(d.titulo, d.url) for d in EDITAL_01_2026.documentos.values()
        ) + extra)

    def conferir(self):
        app = AppTest.from_string(SCRIPT, default_timeout=10).run()
        app.button[0].click().run()
        self.assertFalse(app.exception)
        self.assertTrue(app.button[-1].disabled)
        self.assertTrue(app.error)
        return app

    def test_pdf_alterado_bloqueia_orientacao(self):
        with patch('consulta_ui.detalhes', return_value=self.listagem()), \
             patch('consulta_ui.verificar_pdf', return_value=SimpleNamespace(sha256='alterado')):
            app = self.conferir()
            self.assertIn('difere', app.error[0].value)

    def test_falha_na_rede_nao_libera_fontes(self):
        with patch('consulta_ui.detalhes', side_effect=FalhaConsulta('rede indisponível')):
            app = self.conferir()
            self.assertIn('rede indisponível', app.error[0].value)

    def test_novo_adendo_impede_uso_das_regras_antigas(self):
        adendo = Link('Adendo 01', EDITAL_01_2026.pagina_oficial + '/novo.pdf')
        with patch('consulta_ui.detalhes', return_value=self.listagem((adendo,))):
            app = self.conferir()
            self.assertIn('adendo', app.error[0].value)


if __name__ == '__main__':
    unittest.main()
