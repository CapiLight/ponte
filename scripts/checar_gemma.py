"""Confere o acesso ao Gemma pela Gemini API e o que o modelo aceita.

Uso:
    .venv/bin/python scripts/checar_gemma.py [nome-do-modelo]

A chave vem de GEMINI_API_KEY ou de .streamlit/secrets.toml. O script nunca
imprime a chave. O relato usado nas chamadas é fictício.
"""

import os
import sys
import time
import tomllib
from pathlib import Path

from google import genai
from google.genai import types

RAIZ = Path(__file__).resolve().parent.parent
TEMPO_LIMITE_MS = 30_000
RELATO_FICTICIO = (
    "No dia 10 de outubro de 2026, minha casa foi alagada. "
    "Precisei sair da minha residência e perdi meus documentos pessoais."
)
ESQUEMA_DE_TESTE = {
    "type": "object",
    "properties": {
        "saiu_da_residencia": {"type": "string", "enum": ["sim", "nao", "nao_sei"]},
        "trecho": {"type": "string"},
    },
    "required": ["saiu_da_residencia", "trecho"],
}


def ler_chave() -> str:
    chave = os.environ.get("GEMINI_API_KEY", "")
    segredos = RAIZ / ".streamlit" / "secrets.toml"
    if not chave and segredos.exists():
        chave = tomllib.loads(segredos.read_text(encoding="utf-8")).get("GEMINI_API_KEY", "")
    if not chave:
        sys.exit("Defina GEMINI_API_KEY ou preencha .streamlit/secrets.toml.")
    return chave


def listar_modelos_gemma(cliente: genai.Client) -> list[str]:
    nomes = []
    for modelo in cliente.models.list():
        if "gemma" not in modelo.name.lower():
            continue
        nomes.append(modelo.name)
        print(
            f"  {modelo.name} | entrada {modelo.input_token_limit} | "
            f"saída {modelo.output_token_limit} | ações {modelo.supported_actions}"
        )
    return nomes


def escolher_modelo(nomes: list[str]) -> str:
    if len(sys.argv) > 1:
        return sys.argv[1]
    for nome in nomes:
        if "gemma-4" in nome:
            return nome
    if nomes:
        return nomes[0]
    sys.exit("Nenhum modelo Gemma disponível para esta chave.")


def testar(cliente: genai.Client, modelo: str, descricao: str, conteudo: str, configuracao=None) -> None:
    inicio = time.perf_counter()
    try:
        resposta = cliente.models.generate_content(model=modelo, contents=conteudo, config=configuracao)
    except Exception as erro:  # noqa: BLE001 - o objetivo é registrar qualquer recusa da API
        segundos = time.perf_counter() - inicio
        mensagem = str(erro).splitlines()[0][:200]
        print(f"[falhou] {descricao} ({segundos:.1f}s): {type(erro).__name__}: {mensagem}")
        return
    segundos = time.perf_counter() - inicio
    texto = (resposta.text or "").strip().replace("\n", " ")
    print(f"[ok]     {descricao} ({segundos:.1f}s): {texto[:200]}")


def main() -> None:
    cliente = genai.Client(
        api_key=ler_chave(),
        http_options=types.HttpOptions(timeout=TEMPO_LIMITE_MS),
    )
    print("Modelos Gemma disponíveis:")
    modelo = escolher_modelo(listar_modelos_gemma(cliente))
    print(f"\nModelo testado: {modelo}\n")

    pergunta = (
        "A pessoa que escreveu o relato precisou sair da própria residência? "
        "Responda em JSON com os campos saiu_da_residencia (sim, nao ou nao_sei) "
        "e trecho (frase literal do relato que sustenta a resposta).\n\n"
        f"Relato: {RELATO_FICTICIO}"
    )
    for repeticao in range(1, 4):
        testar(cliente, modelo, f"chamada simples {repeticao}/3", "Responda apenas: OK")
    testar(cliente, modelo, "JSON pedido no prompt", pergunta)
    testar(
        cliente,
        modelo,
        "system_instruction",
        pergunta,
        types.GenerateContentConfig(system_instruction="Responda somente com JSON válido."),
    )
    testar(
        cliente,
        modelo,
        "response_mime_type JSON",
        pergunta,
        types.GenerateContentConfig(response_mime_type="application/json"),
    )
    testar(
        cliente,
        modelo,
        "response_json_schema",
        pergunta,
        types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=ESQUEMA_DE_TESTE,
        ),
    )


if __name__ == "__main__":
    main()
