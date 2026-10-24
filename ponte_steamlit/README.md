# Ponte — versão Streamlit

Esta pasta contém a aplicação Streamlit da Ponte, com busca geral no Portal de Editais da UFAC, leitura de publicações e o fluxo guiado para o Edital Proaes nº 01/2026. Ela reaproveita os módulos Python de fatos, regras, fontes, extração Gemma e resumo do repositório original.

## Consulta real à UFAC

A área “Editais UFAC” obtém o índice publicado em `https://www3.ufac.br/editais`, sem lista fixa de órgãos ou registros fictícios. A busca reúne seleções de ensino, pesquisa, extensão, assistência, concursos, centros e outros setores, com filtros por órgão/centro, ano identificado e título. O nome do setor é obtido da navegação oficial; o ano vem do caminho ou do título, permanecendo desconhecido quando ausente.

A cobertura da busca corresponde ao índice de navegação servido pelo portal, não a uma garantia de exaustividade de todo o arquivo da universidade. “Explorar setores e pastas” permite navegar a partir das seções da página geral e abrir subpastas que não apareçam no índice. Ao selecionar uma publicação, a aplicação percorre a paginação da pasta e mostra documentos, anexos, chamadas, alterações e resultados. Fontes fora de `www3.ufac.br` não são coletadas pelo servidor.

“Ler publicação no site da UFAC” obtém o arquivo em memória e identifica PDF, HTML ou DOCX pelo conteúdo. Calcula o SHA-256 e extrai texto por página em PDFs; HTML e DOCX são exibidos em bloco, sem paginação física preservada. PDFs com páginas sem texto suficiente são sinalizados para OCR ou conferência visual. DOC, XLS, imagens e demais formatos sem leitor continuam disponíveis pelo link oficial, sem simular leitura. O tipo indicado pelo título do portal pode divergir do conteúdo; extração não representa revisão administrativa.

Com GEMINI_API_KEY configurada, “Extrair informações com Gemma” lê o intervalo de páginas/blocos escolhido e propõe objeto, público, prazos, valores, documentos, passos e pendências. Toda informação precisa trazer trecho literal e página; a validação confronta a resposta com o texto obtido independentemente pela coleta, nunca com texto inventado pelo próprio modelo. Sugestões sem evidência são descartadas. A presença do trecho não prova interpretação correta, e a tela marca a leitura como ainda não revisada. O arquivo isolado não consolida anexos e retificações nem permite afirmar elegibilidade, completude ou inscrições abertas. A análise tem limite de 100 mil caracteres e não deve ser usada para listar pessoas em resultados.

Há cache de até cinco minutos para evitar requisições a cada interação. A tela informa o horário da obtenção, e “Atualizar consulta na UFAC” limpa o cache e consulta novamente. Uma falha de rede ou mudança de estrutura mostra erro, sem substituir a resposta por exemplos ou cópias locais. Resultados podem conter dados de candidatos e não alimentam regras de preparação.

O coletor respeita `robots.txt`, identifica o User-Agent, limita requisições por cliente, tamanho dos arquivos e paginação, e só acessa HTTPS no host `www3.ufac.br`, inclusive em redirecionamentos. Não faz login nem envia dados do estudante à UFAC. As fontes não são gravadas em disco pelo coletor. Quando a leitura com Gemma é solicitada, o texto público selecionado é enviado à Gemini API.

Antes do fluxo guiado, “Conferir fontes na UFAC” percorre a pasta oficial e compara os PDFs atuais com os hashes das versões revisadas. PDF diferente, ausência de documento, alteração indicada no portal ou falha de acesso bloqueia a orientação até revisão. A checagem expira em cinco minutos, preservando as respostas do estudante. Títulos incorretos no site podem impedir a identificação de uma alteração; a aplicação declara essa limitação. As regras curadas continuam específicas ao edital 01/2026; o catálogo não gera automaticamente regras para outros editais.

## O que foi convertido

- Fluxo em quatro etapas: contexto do edital, entrada de situação, conferência e próximos passos.
- Entrada por relato com chamada real ao Gemma 4 pela Gemini API.
- Alternativa por perguntas diretas quando não houver chave ou quando a API falhar.
- Sugestões com trechos de origem, confirmação e edição de fatos.
- Recalculo das orientações após alterações e resumo copiável/baixável.
- Trechos e links das fontes oficiais do edital.

Esta versão mantém o escopo do MVP revisado. Não inclui o catálogo de exemplos fictícios nem as perguntas genéricas simuladas do protótipo React, porque elas não são regras revisadas de editais reais. Não inclui SQLite, login, upload de documentos, OCR ou histórico.

## Executar localmente

Requer Python 3.11 ou superior.

    cd ponte_steamlit
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    $env:GEMINI_API_KEY="sua-chave"
    streamlit run streamlit_app.py

A chave é opcional para a entrada manual. Não a coloque no código nem no Git. Para Streamlit Community Cloud, configure GEMINI_API_KEY em App settings → Secrets. O modelo padrão é models/gemma-4-26b-a4b-it; se necessário, defina GEMMA_MODEL como secret ou variável de ambiente.

## Dados e privacidade

A aplicação não tem banco de casos, cadastro ou upload. As respostas e o relato permanecem no estado da sessão processado pelo servidor Streamlit enquanto o fluxo está aberto; a sessão pode ser perdida ao atualizar ou reconectar. O botão Apagar sessão limpa o estado da aplicação.

Quando a pessoa escolhe Analisar relato com Gemma, o texto é enviado à Gemini API. A cota gratuita da API tem termos que permitem uso do conteúdo para melhoria dos serviços e revisão humana. Por isso, esta versão orienta usar somente dados fictícios na demonstração e não afirma que nenhum dado é processado ou recebido por fornecedores. A chave não é enviada ao navegador pelo código da aplicação.

A aplicação não salva relatos em arquivos, SQLite ou logs próprios. Isso não constitui uma auditoria dos logs ou políticas do provedor de hospedagem e da Gemini API.

## Limites do produto

A Ponte relaciona fatos informados pela pessoa a um recorte revisado do edital. Ela não confirma acontecimentos, não verifica autenticidade documental, não decide elegibilidade e não determina que a documentação é suficiente para concluir a inscrição. A decisão cabe à Proaes. Confira sempre a página oficial e alterações do edital.

## Publicação

Para Streamlit Community Cloud, publique esta pasta em um repositório GitHub e selecione streamlit_app.py como arquivo principal. Configure GEMINI_API_KEY nos secrets do app. A pasta SQLite foi deixada de fora conforme o escopo atual; esta versão não persiste formulários gerados nem respostas.

Arquivos do edital incluídos em fontes/ufac-proaes-01-2026/ são cópias de documentos públicos citados pelo código-fonte original. A licença MIT da aplicação não altera os direitos ou termos dos documentos e do modelo.

## Testes da coleta

Na pasta desta aplicação, após instalar as dependências, execute `python -m unittest discover -s tests -v`. Os testes verificam paginação, escopo dos seletores HTML, índice transversal de órgãos, falhas parciais, restrição de domínio, robots.txt, formatos, hashes, sinalização de OCR, bloqueio de fontes alteradas e rejeição de citações inventadas. A consulta ao site real deve ser verificada separadamente; os testes locais não comprovam disponibilidade da UFAC nem qualidade semântica do modelo.

