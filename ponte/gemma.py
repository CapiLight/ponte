"""Chamada ao Gemma pela Gemini API, com nova tentativa limitada.

O serviço alterna respostas rápidas, erros 500 imediatos e esperas longas que
terminam em 504. Erro rápido é repetido. Erro lento só é repetido quando quem
chama aceita esperar, como a análise de edital feita uma vez fora do app.
"""

import re
import time

from google import genai
from google.genai import errors, types

MODELO_PADRAO = "models/gemma-4-26b-a4b-it"
FALHA_RAPIDA_EM_SEGUNDOS = 5
LIMITE_DE_USO = 429
ESPERA_PADRAO_DA_COTA = 30
ESPERA_MAXIMA_DA_COTA = 120


class FalhaNoModelo(Exception):
    """O modelo não devolveu uma resposta utilizável."""


def segundos_ate_liberar(erro: errors.APIError) -> float:
    """Tempo sugerido pela API em retryDelay, com piso e teto."""
    encontrado = re.search(r"retryDelay['\"]?\s*:\s*['\"]?(\d+(?:\.\d+)?)s", str(erro))
    segundos = float(encontrado.group(1)) + 1 if encontrado else ESPERA_PADRAO_DA_COTA
    return min(max(segundos, 1), ESPERA_MAXIMA_DA_COTA)


def criar_cliente(chave: str, tempo_limite_ms: int) -> genai.Client:
    return genai.Client(api_key=chave, http_options=types.HttpOptions(timeout=tempo_limite_ms))


def gerar_json(
    cliente: genai.Client,
    instrucoes: str,
    conteudo: str,
    *,
    modelo: str = MODELO_PADRAO,
    esquema: dict | None = None,
    tentativas: int = 3,
    repetir_falhas_lentas: bool = False,
    esperar_cota: bool = False,
    esperar=time.sleep,
) -> str:
    """Pede uma resposta JSON. Com esperar_cota, o erro 429 aguarda o tempo indicado pela API e tenta de novo."""
    configuracao = types.GenerateContentConfig(
        system_instruction=instrucoes,
        response_mime_type="application/json",
        response_json_schema=esquema,
        temperature=0,
    )
    for tentativa in range(1, tentativas + 1):
        ultima = tentativa == tentativas
        inicio = time.perf_counter()
        try:
            resposta = cliente.models.generate_content(model=modelo, contents=conteudo, config=configuracao)
        except errors.ClientError as erro:
            if erro.code == LIMITE_DE_USO and esperar_cota and not ultima:
                esperar(segundos_ate_liberar(erro))
                continue
            raise FalhaNoModelo(f"a requisição foi recusada com erro {erro.code}") from erro
        except errors.ServerError as erro:
            rapida = time.perf_counter() - inicio < FALHA_RAPIDA_EM_SEGUNDOS
            if not ultima and (rapida or repetir_falhas_lentas):
                continue
            raise FalhaNoModelo(f"o serviço do modelo respondeu com erro {erro.code}") from erro
        except Exception as erro:  # noqa: BLE001 - tempo esgotado e falhas de rede seguem o mesmo caminho
            if not ultima and repetir_falhas_lentas:
                continue
            raise FalhaNoModelo(f"falha de comunicação: {type(erro).__name__}") from erro
        if not resposta.text:
            if not ultima:
                continue
            raise FalhaNoModelo("o modelo não devolveu conteúdo")
        return resposta.text
    raise FalhaNoModelo(f"o modelo falhou {tentativas} vezes")
