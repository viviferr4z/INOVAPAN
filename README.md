# InovaPan

Sistema de Gestão de Pedidos para Panificadora desenvolvido no curso de **Tecnologia em Sistemas para Internet da UESPI/UAPI**, Polo Jerumenha, em 2026.

Este documento apresenta a **Entrega 05**, desenvolvida a partir da integração realizada na **Entrega 04**, com finalização das funcionalidades, testes e publicação da UI na Vercel e da API no Render.

**Situação em 28 de outubro de 2026:** código da Entrega 05 enviado ao GitHub, UI publicada na Vercel e API publicada no Render. A página de login, a configuração pública da API, a rota de saúde, a autorização da origem da Vercel e a proteção de uma rota sem autenticação foram verificadas nos endereços publicados. A equipe confirmou o login e a abertura do painel pelo site. A configuração gratuita do Render utiliza banco temporário; a conferência final dos fluxos públicos e dos cartões reais do Trello deve ser registrada pela equipe.

## Acessos do projeto

| Recurso | Endereço ou situação |
| --- | --- |
| Repositório | [viviferr4z/INOVAPAN](https://github.com/viviferr4z/INOVAPAN) |
| Código de referência da publicação | [Commit afb7d47](https://github.com/viviferr4z/INOVAPAN/commit/afb7d47f2eddb21b2ff300fb394c2477d2b1c358) |
| Planejamento | [Quadro InovaPan no Trello](https://trello.com/b/zlxtIrdV/inovapan) |
| UI na Vercel | [https://inovapan.vercel.app](https://inovapan.vercel.app) |
| Login público | [https://inovapan.vercel.app/login.html](https://inovapan.vercel.app/login.html) |
| API no Render | [https://inovapan.onrender.com/api](https://inovapan.onrender.com/api) |
| Saúde da API | [https://inovapan.onrender.com/api/health](https://inovapan.onrender.com/api/health) |

## Funcionalidades

| Módulo | Operações disponíveis |
| --- | --- |
| Acesso | Login validado pela API, sessão com duração de 8 horas e saída pelo navegador. |
| Clientes | Cadastro, consulta, pesquisa, edição e exclusão; clientes com pedidos vinculados são preservados. |
| Produtos | Cadastro, consulta, pesquisa e edição; produtos vinculados a pedidos são inativados ao solicitar exclusão. |
| Pedidos | Criação, consulta detalhada dos itens, edição de cliente/itens/observação, alteração de status e exclusão. |
| Painel | Total de clientes, produtos ativos, pedidos e vendas do dia e faturamento de pedidos concluídos. |
| Relatórios | Consulta de vendas por período, quantidade de pedidos e valor total; pedidos cancelados não entram nas vendas. |

O total do pedido é calculado pela API com os preços do cadastro. Na edição dos itens de um pedido aberto ou em preparo, o total é recalculado com os preços atuais. Pedidos concluídos ou cancelados preservam seus itens. A consulta de datas do painel e dos relatórios considera o horário de Brasília.

O acesso utiliza um administrador configurado no ambiente. Perfis distintos e recuperação de senha não fazem parte desta versão. Alterar `AUTH_SECRET` invalida as sessões existentes.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| UI | HTML5, CSS3, JavaScript, Fetch API e Bootstrap 5.3.3 incluído localmente. |
| API | Node.js, Express 4.22.3 e CORS 2.8.5. |
| Persistência | SQLite, com driver sqlite3 6.0.1. |
| Versionamento e planejamento | Git, GitHub e Trello. |
| Publicação | Vercel para a UI e Render Free para a API de demonstração. |

O projeto requer **Node.js 22 ou 24** e npm. Os testes locais foram executados com Node.js 24. A API publicada utiliza Node.js 22.

## Organização dos arquivos

| Caminho | Finalidade |
| --- | --- |
| Páginas HTML da raiz | Início, login, painel, clientes, produtos, pedidos e relatórios. |
| `css/` e `js/` | Estilos e comportamento da interface; requisições centralizadas em `js/api.js`. |
| `vendor/` | Arquivos do Bootstrap e sua licença. |
| `backend/` | Servidor, autenticação, banco de dados, dependências e testes da API. |
| `scripts/` | Geração e testes da UI publicada em `dist`. |
| `vercel.json` | Comandos e arquivos públicos da UI na Vercel. |
| `render.yaml` | Alternativa de implantação com serviço e disco pagos; a demonstração gratuita foi configurada manualmente. |
| `PUBLICACAO.md` | Procedimento de publicação e validação pública. |

A UI solicita as operações à API por HTTP. A API valida os dados, consulta ou grava no SQLite e retorna JSON para atualizar as telas. As gravações de pedidos usam transações isoladas e uma fila de escrita para tratar requisições simultâneas.

## Executar localmente

São utilizados **dois terminais**: um para a API e outro para a UI. Os dois devem permanecer em execução durante o uso.

### 1 Configurar uma instalação nova

Na raiz do projeto, abra um terminal. No Windows:

```bat
cd backend
```

Gere uma chave de assinatura:

```bat
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Abra o arquivo de configuração:

```bat
notepad .env
```

Se o arquivo ainda não existir, confirme sua criação. Cole esta base e substitua os campos vazios pela senha escolhida e pela chave gerada:

```dotenv
PORT=3000
ADMIN_USER=administrador
ADMIN_PASSWORD=
AUTH_SECRET=
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Preencha as variáveis e salve o arquivo:

| Variável | Configuração local |
| --- | --- |
| `PORT` | `3000` |
| `ADMIN_USER` | Nome do administrador; a configuração acima utiliza `administrador`. |
| `ADMIN_PASSWORD` | Senha exclusiva com pelo menos 12 caracteres. |
| `AUTH_SECRET` | Chave aleatória gerada no terminal, com pelo menos 32 caracteres. |
| `CORS_ORIGINS` | `http://localhost:5500,http://127.0.0.1:5500` |
| `DB_PATH` | Opcional localmente; sem essa variável, o banco é criado em `backend/data/inovapan.db`. |

Se a aplicação já estiver configurada, preserve seu `.env` e o banco existentes. Caso sua cópia inclua `.env.example`, ele também pode ser utilizado como modelo; o `.env` preenchido fica somente no ambiente de execução.

### 2 Iniciar a API

No terminal da pasta `backend`, execute:

```bat
npm ci
npm start
```

A API informa `InovaPan API na porta 3000`. A verificação de saúde fica em [http://localhost:3000/api/health](http://localhost:3000/api/health).

### 3 Iniciar a UI

Abra outro terminal **na raiz do projeto**, onde está o `package.json` da UI:

```bat
npm run build
npx http-server dist -p 5500
```

Caso o npm solicite instalar `http-server`, confirme para iniciar o servidor estático. Abra [http://localhost:5500](http://localhost:5500) e entre com o usuário e a senha definidos no ambiente da API.

O build local usa `http://localhost:3000/api` quando não recebe `INOVAPAN_API_URL`. No build da Vercel, essa variável é obrigatória e deve conter a URL HTTPS real do Render terminada em `/api`.

## Banco e atualização de uma instalação existente

O banco fica fora de `node_modules` e do controle de versão. A pasta `backend/data` deve ser preservada na cópia utilizada para registrar clientes, produtos e pedidos.

Na Entrega 04, o caminho padrão era `backend/inovapan.db`. Para continuar utilizando um banco desse formato, pare a API, faça um backup e defina `DB_PATH` para o arquivo existente ou copie o banco para o novo caminho antes de iniciar. Faça a cópia somente com a API encerrada, para que os registros pendentes tenham sido gravados.

Para atualizar as bibliotecas de uma cópia que já funciona, mantenha `.env` e o banco, substitua os arquivos de dependências e encerre a API antes de executar `npm ci`. Se o Windows informar `EPERM` no arquivo `node_sqlite3.node`, confira se uma instância anterior da API continua usando o arquivo.

Os registros cadastrados pertencem à instalação local. Ao atualizar os arquivos do projeto, preserve o banco e o `.env` utilizados nessa instalação. Os arquivos de documentação podem ser substituídos independentemente da execução do sistema.

## Testes e resultados

Na raiz, execute os testes de preparação da UI:

```bat
npm test
```

Na raiz, execute os testes da API:

```bat
npm --prefix backend test
```

Na pasta `backend`, a auditoria das dependências pode ser consultada com:

```bat
npm audit
```

Resultados registrados em **28 de outubro de 2026**:

- **14 testes da API aprovados**, incluindo autenticação, cadastros, pedidos, rollback, concorrência, relatórios e persistência após reinício.
- **2 testes do build da UI aprovados**, verificando a configuração da API e a exclusão de arquivos privados da pasta pública.
- **12 verificações pelo navegador aprovadas** no ambiente local de preparação.
- **Zero vulnerabilidades conhecidas reportadas pelo npm audit** após a atualização das dependências, na consulta dessa data.
- Execução confirmada pela equipe em **Windows com Node.js 24.18.0**: instalação concluída, 14 testes da API aprovados e servidor iniciado na porta 3000.

Os testes automatizados usam banco temporário, separado dos registros cadastrados durante o uso. A API foi verificada quanto a login e token inválido, CORS, validação dos cadastros e preços, cálculo e edição dos pedidos, rollback sem gravação parcial, oito pedidos simultâneos válidos e um inválido, preservação de vínculos, status, calendário, horário de Brasília, exclusão em cascata e leitura dos registros após reinício.

O build foi verificado quanto à URL pública da API e à geração da pasta `dist` com arquivos destinados ao navegador. Banco, credenciais e código do servidor ficaram fora dessa pasta.

| Cenário | Composição | Resultado registrado |
| --- | --- | --- |
| Pedido automatizado | 1 bolo de R$25,00 e 10 pães de R$1,00. | R$35,00 calculados pela API. |
| Edição automatizada | 1 bolo de R$25,00 e 15 pães de R$1,00. | R$40,00, com itens, relatório e faturamento conferidos após a conclusão. |
| Pedido manual no Windows | 4 bolos de R$9,92. | R$39,68, status CONCLUIDO e uma venda no relatório. |

A conferência pelo navegador incluiu login, sessão protegida, cadastros, edição, detalhes dos pedidos, relatório, painel, saída da sessão, apresentação em largura de 390 pixels e exibição de texto com marcação HTML sem execução. Não foram observadas exceções JavaScript nesse fluxo.

Os resultados acima foram obtidos no ambiente local. A publicação recebeu também as verificações públicas abaixo, sem utilizar senha ou token de acesso nas requisições de conferência.

### Verificação da publicação em 28/10/2026

| Verificação | Resultado |
| --- | --- |
| Página de login na Vercel | HTTP 200. |
| Configuração pública da UI | `https://inovapan.onrender.com/api`, recebida por HTTP 200 em `js/config.js`. |
| `GET /api/health` no Render | HTTP 200, `status: ok`, sistema InovaPan API, versão 2.0.0. |
| Preflight de login a partir da Vercel | HTTP 204, com `Access-Control-Allow-Origin: https://inovapan.vercel.app`. |
| `GET /api/clientes` sem token | HTTP 401, mantendo a operação protegida. |
| Login e abertura do painel no site | Confirmados pela equipe durante a publicação. |

O cadastro, a edição e a conclusão de pedidos e a conferência dos relatórios foram testados localmente. A repetição do fluxo completo no site publicado e suas capturas finais devem ser registradas pela equipe. A permanência dos dados após suspensão, reinício ou nova implantação não está disponível no armazenamento temporário escolhido para o Render Free.

## Principais endpoints

`GET /api/health` e `POST /api/auth/login` são públicos. As demais operações abaixo exigem o token de acesso no cabeçalho `Authorization: Bearer TOKEN`.

| Método | Caminho | Operação |
| --- | --- | --- |
| POST | `/api/auth/login` | Entrar com `usuario` e `senha`. |
| GET | `/api/clientes?q=texto` | Listar e pesquisar clientes. |
| POST | `/api/clientes` | Cadastrar cliente. |
| PUT / DELETE | `/api/clientes/:id` | Editar ou excluir cliente. |
| GET | `/api/produtos?q=texto` | Listar e pesquisar produtos. |
| POST | `/api/produtos` | Cadastrar produto. |
| PUT / DELETE | `/api/produtos/:id` | Editar, excluir ou inativar produto. |
| GET | `/api/pedidos` e `/api/pedidos/:id` | Consultar pedidos e seus itens. |
| POST | `/api/pedidos` | Registrar pedido. |
| PUT | `/api/pedidos/:id` | Editar pedido ou atualizar status. |
| DELETE | `/api/pedidos/:id` | Excluir pedido. |
| GET | `/api/dashboard` | Consultar indicadores do painel. |
| GET | `/api/relatorios/vendas?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Consultar vendas por período. |

## Organização das tarefas

A Entrega 04 documentou oito tarefas da API e oito da UI para integrar clientes, produtos, pedidos, painel e relatórios. A Entrega 05 mantém essa base e acrescenta acesso autenticado, edição dos itens, validações e publicação. As implementações estão resumidas abaixo.

| Área | Implementação na API | Implementação na UI |
| --- | --- | --- |
| Acesso e comunicação | Login, token, proteção de rotas e tratamento de erros. | Login, sessão e comunicação centralizada com a API. |
| Clientes | Cadastro, consulta, pesquisa, edição e exclusão com proteção dos vínculos. | Formulários, pesquisa e listagem integrados. |
| Produtos | Cadastro, consulta, pesquisa, edição e exclusão ou inativação. | Formulários, listagem e controle de disponibilidade. |
| Novo pedido | Registro dos itens e cálculo do total no servidor. | Seleção de cliente, produtos e quantidades. |
| Gerenciamento de pedidos | Consulta dos detalhes, edição, status e exclusão. | Listagem, detalhes dos itens e ações de gerenciamento. |
| Painel | Indicadores de clientes, produtos, pedidos e faturamento. | Apresentação dos indicadores obtidos da API. |
| Relatórios | Consulta por período e resumo das vendas. | Filtros, listagem e total consolidado. |
| Validação e consistência | Regras de entrada, transações e preservação dos dados. | Mensagens das operações, validações e tratamento de textos recebidos. |

As tarefas e evidências devem ser acompanhadas no [Trello](https://trello.com/b/zlxtIrdV/inovapan). A equipe deve conferir a correspondência com os cartões reais, registrar a conclusão das atividades implementadas e anexar os links públicos e as capturas. Esta revisão não confirma a situação atual dos cartões.

| Atividade de encerramento | Situação em 28/10/2026 |
| --- | --- |
| Implementação e validação local da UI e da API | Confirmadas. |
| Envio do código da Entrega 05 ao GitHub | Confirmado; referência do código publicado: `afb7d47`. |
| Publicação da UI na Vercel e da API no Render | Confirmada nos endereços acima. |
| Comunicação entre UI/API e login no site | CORS verificado; login e abertura do painel confirmados pela equipe. |
| Fluxo completo de cadastros, pedidos e relatórios no site | Conferência final e capturas a registrar pela equipe. |
| Persistência contínua no Render Free | Não disponível com o SQLite no armazenamento temporário escolhido. |
| Conferência dos cartões do Trello e registro das evidências públicas | Pendentes. |

Os serviços exigidos estão publicados e o acesso integrado ao painel foi confirmado. Para o encerramento acadêmico, a equipe deve registrar a conferência final dos fluxos no site, atualizar os cartões do Trello e anexar as evidências correspondentes. A limitação do armazenamento gratuito deve acompanhar a apresentação do projeto.

## Publicação da Entrega 05

As configurações utilizadas e o procedimento para reproduzir a publicação estão em [PUBLICACAO.md](PUBLICACAO.md).

| Projeto | Plataforma | Configuração |
| --- | --- | --- |
| UI | Vercel | Framework `Other`; Root Directory vazio; `npm run build`; saída `dist`; `INOVAPAN_API_URL=https://inovapan.onrender.com/api`. |
| API | Render Free | Raiz `backend`; build `npm_config_build_from_source=true npm ci --omit=dev --foreground-scripts`; início `npm start`; saúde `/api/health`. |
| Autorização de origem | Ambiente da API | `CORS_ORIGINS=https://inovapan.vercel.app`, sem barra final e sem `/api`. |
| Banco de demonstração | SQLite no Render Free | `DB_PATH` omitido e sem disco persistente; banco criado automaticamente em `backend/data/inovapan.db`. |

O SQLite é compilado no ambiente do Render para evitar a incompatibilidade do binário pré-compilado que apresentou `GLIBC_2.38 not found`. A compilação foi concluída no Render e o serviço ficou Live.

O Render Free pode suspender a API após inatividade, fazendo a primeira requisição demorar enquanto o serviço inicia novamente. Clientes, produtos e pedidos gravados no SQLite temporário são perdidos após suspensão, reinício ou nova implantação. Os registros da instalação local no computador não são transferidos automaticamente para a publicação. Para manter dados de forma contínua, será necessário configurar uma solução persistente; o projeto atual não inclui migração para banco externo.

O arquivo `render.yaml` prevê uma alternativa com serviço e disco pagos e não representa a configuração gratuita publicada. Caso essa alternativa seja utilizada futuramente, a compilação do SQLite também deve ser forçada a partir do código-fonte, e o custo e o caminho do disco devem ser conferidos antes da contratação.

## Equipe

- Hellem da Silva Rodrigues
- Maria Eli Gomes da Silva
- Maria Heloisa Sena Dias
- Shili Samara Alencar Sandes
- Vivianne Martins Ferraz

| Identificação acadêmica | Informação |
| --- | --- |
| Instituição | Universidade Estadual do Piauí, UESPI/UAPI |
| Curso | Tecnologia em Sistemas para Internet |
| Polo | Jerumenha, PI |
| Ano | 2026 |

## Referências

- [Bootstrap](https://getbootstrap.com)
- [Express](https://expressjs.com)
- [MDN Web Docs](https://developer.mozilla.org)
- [Node.js](https://nodejs.org)
- [SQLite](https://www.sqlite.org/docs.html)
- [Vercel](https://vercel.com/docs)
- [Render](https://render.com/docs)
- SOMMERVILLE, Ian. *Engenharia de Software*. 10. ed. São Paulo: Pearson, 2018.
