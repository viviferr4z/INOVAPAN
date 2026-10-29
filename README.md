# InovaPan — Entrega 05

Sistema de gestão de pedidos para panificadora desenvolvido na disciplina **Projeto Integrador II**, do curso de **Tecnologia em Sistemas para Internet da UESPI/UAPI**, Polo Jerumenha, em 2026.

A Entrega 05 dá continuidade à integração da Entrega 04 e reúne a finalização das funcionalidades, os testes e a publicação da interface (UI) na **Vercel** e da API no **Render**.

**Versão de demonstração publicada em 28/10/2026.** A validação realizada pela equipe no site registrou cliente, produtos, pedido concluído e o valor de **R$ 16,50** no relatório e no painel. O registro das atividades e das evidências específicas da Entrega 05 no Trello permanece pendente.

## Acessos do projeto

| Recurso | Endereço |
| --- | --- |
| Sistema publicado | [inovapan.vercel.app](https://inovapan.vercel.app) |
| Tela de login | [inovapan.vercel.app/login.html](https://inovapan.vercel.app/login.html) |
| Base da API | [inovapan.onrender.com/api](https://inovapan.onrender.com/api) |
| Verificação de saúde da API | [inovapan.onrender.com/api/health](https://inovapan.onrender.com/api/health) |
| Repositório | [viviferr4z/INOVAPAN](https://github.com/viviferr4z/INOVAPAN) |
| Planejamento | [Quadro InovaPan no Trello](https://trello.com/b/zlxtIrdV/inovapan) |

O acesso ao sistema utiliza o administrador configurado no ambiente da API. O código utilizado na publicação tem como referência o [commit afb7d47](https://github.com/viviferr4z/INOVAPAN/commit/afb7d47f2eddb21b2ff300fb394c2477d2b1c358).

## Funcionalidades

| Módulo | Operações disponíveis |
| --- | --- |
| Acesso | Login validado pela API, sessão com duração de 8 horas e saída do sistema. |
| Clientes | Cadastro, consulta, pesquisa, edição e exclusão; preservação de clientes com pedidos vinculados. |
| Produtos | Cadastro, consulta, pesquisa, edição e exclusão; inativação de produtos já utilizados em pedidos. |
| Pedidos | Criação, consulta dos itens, edição de cliente, itens e observação, alteração de status e exclusão. |
| Painel | Quantidade de clientes, produtos ativos e pedidos do dia; vendas do dia e faturamento dos pedidos concluídos. |
| Relatórios | Consulta de vendas por período, quantidade de pedidos e valor total. |

A API calcula o total dos pedidos com os preços cadastrados. A edição dos itens de pedidos abertos ou em preparo recalcula o total com os preços atuais. Pedidos concluídos ou cancelados preservam seus itens, e pedidos cancelados são excluídos das vendas. As consultas de datas consideram o horário de Brasília.

## Tecnologias e estrutura

| Camada | Tecnologias |
| --- | --- |
| UI | HTML5, CSS3, JavaScript, Fetch API e Bootstrap 5.3.3. |
| API | Node.js, Express 4.22.3 e CORS 2.8.5. |
| Banco de dados | SQLite, com driver sqlite3 6.0.1. |
| Versionamento e planejamento | Git, GitHub e Trello. |
| Hospedagem | Vercel para a UI e Render Free para a API de demonstração. |

A UI envia requisições HTTP à API, que valida os dados, acessa o SQLite e retorna JSON. As gravações dos pedidos usam transações isoladas e uma fila de escrita para tratar requisições simultâneas.

| Caminho | Finalidade |
| --- | --- |
| Páginas HTML da raiz | Início, login, painel, clientes, produtos, pedidos e relatórios. |
| `css/` e `js/` | Estilos e comportamento da interface; comunicação com a API centralizada em `js/api.js`. |
| `vendor/` | Arquivos locais do Bootstrap e sua licença. |
| `backend/` | Servidor, autenticação, acesso ao banco e testes da API. |
| `scripts/` | Geração e testes da UI; a publicação utiliza os arquivos gerados em `dist/`. |
| `vercel.json` | Configuração de publicação da UI. |
| `render.yaml` | Alternativa com serviço e disco pagos; a demonstração gratuita foi configurada manualmente. |

## Executar localmente

Requisitos: **Node.js 22 ou 24** e npm. Os testes locais foram executados com Node.js 24; a API publicada utiliza Node.js 22.

### 1. Configurar a API

Abra um terminal na raiz do projeto e entre na pasta da API:

```bat
cd backend
```

Gere uma chave de assinatura:

```bat
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Crie o arquivo `backend/.env`. No Windows, com o terminal na pasta `backend`, utilize:

```bat
notepad .env
```

Preencha e salve o arquivo com a seguinte configuração:

```dotenv
PORT=3000
ADMIN_USER=administrador
ADMIN_PASSWORD=
AUTH_SECRET=
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Em `ADMIN_PASSWORD`, informe uma senha exclusiva com pelo menos 12 caracteres. Em `AUTH_SECRET`, cole a chave gerada. O arquivo `.env` preenchido deve permanecer somente no ambiente da API.

### 2. Iniciar a API

No terminal da pasta `backend`, execute:

```bat
npm ci
npm start
```

A mensagem esperada é `InovaPan API na porta 3000`. A saúde da API pode ser consultada em [localhost:3000/api/health](http://localhost:3000/api/health).

### 3. Iniciar a UI

Abra um segundo terminal **na raiz do projeto**, onde está o `package.json` da UI:

```bat
npm ci
npm run build
npx http-server dist -p 5500
```

Se o npm solicitar a instalação de `http-server`, confirme. Abra [localhost:5500](http://localhost:5500) e entre com o usuário e a senha definidos no `.env`. Mantenha os dois terminais em execução durante o uso.

O build local utiliza `http://localhost:3000/api` como padrão. Na Vercel, a variável `INOVAPAN_API_URL` define a URL HTTPS da API publicada, terminada em `/api`.

### Banco e atualização de uma instalação existente

O banco local é criado em `backend/data/inovapan.db`, salvo quando outro caminho é definido em `DB_PATH`. Preserve o banco e o `.env` ao atualizar uma instalação existente e encerre a API antes de executar `npm ci` novamente.

Para aproveitar um banco da Entrega 04 localizado em `backend/inovapan.db`, encerre a API, faça um backup e configure `DB_PATH` para o arquivo existente ou copie-o para o novo caminho antes de iniciar o sistema.

## Testes e validação

Na raiz do projeto, execute:

```bat
npm test
npm --prefix backend test
```

O primeiro comando testa a preparação da UI; o segundo executa os testes da API. Para consultar a auditoria das dependências da API:

```bat
npm --prefix backend audit
```

### Resultados locais registrados em 28/10/2026

| Verificação | Resultado |
| --- | --- |
| Testes automatizados da API | 14 aprovados. |
| Testes do build da UI | 2 aprovados. |
| Verificações pelo navegador no ambiente local | 12 aprovadas. |
| Auditoria de dependências | Zero vulnerabilidades conhecidas reportadas pelo npm audit na consulta dessa data. |
| Execução no Windows com Node.js 24.18.0 | Instalação concluída, 14 testes da API aprovados e servidor iniciado. |

Os testes da API cobrem autenticação, token inválido, CORS, validações dos cadastros, cálculo e edição dos pedidos, preservação de vínculos, status, relatórios, datas, exclusão em cascata e leitura do banco após reinício. Também verificam rollback sem registros parciais e o isolamento de oito pedidos simultâneos válidos e um inválido. O cenário de edição automatizada altera um pedido de R$ 35,00 para R$ 40,00 e confere os resultados após a conclusão.

Os testes automatizados utilizam um banco temporário separado dos registros da instalação. A verificação local pelo navegador incluiu edição, detalhes dos pedidos, relatório, painel, saída da sessão, apresentação em largura de 390 pixels e tratamento de texto com marcação HTML. O build foi verificado quanto à configuração da API e à geração de arquivos públicos em `dist/`.

### Validação no sistema publicado em 28/10/2026

As capturas registradas pela equipe apresentam os seguintes resultados:

| Tela | Evidência registrada |
| --- | --- |
| Clientes | Cliente de demonstração Arthur cadastrado e listado. |
| Produtos | Três produtos ativos: Bolo de Chocolate por R$ 10,00, Pão Francês por R$ 5,00 e Água por R$ 1,50. |
| Pedidos | Pedido nº 1 do cliente Arthur com status `CONCLUIDO` e total de R$ 16,50. |
| Relatórios | Uma venda e total de R$ 16,50, correspondentes ao pedido concluído. |
| Painel | Um cliente, três produtos ativos, um pedido no dia, vendas de R$ 16,50 e faturamento concluído de R$ 16,50. |

A equipe também confirmou o login e a abertura do painel pelo site. As verificações técnicas da publicação registraram HTTP 200 na página de login, na configuração pública da UI e em `GET /api/health`; HTTP 204 no preflight de login com a origem da Vercel autorizada; e HTTP 401 em `GET /api/clientes` sem token.

As capturas documentam a conferência do pedido, do relatório e do painel no ambiente publicado. Os testes de edição e exclusão constam da validação local. Os registros de demonstração podem precisar ser recriados devido à limitação de armazenamento do Render Free.

## Organização das tarefas

O planejamento é acompanhado no [Trello](https://trello.com/b/zlxtIrdV/inovapan). Na consulta de 28/10/2026, o quadro apresentava 30 cartões na lista **FEITO**. O registro específico das atividades e das evidências da Entrega 05 ainda precisa ser atualizado.

| Atividade da Entrega 05 | Situação em 28/10/2026 |
| --- | --- |
| Finalização das implementações da UI e da API | Implementadas e testadas localmente. |
| Publicação da UI na Vercel | Realizada. |
| Publicação da API no Render | Realizada. |
| Login e comunicação entre UI e API | Verificados no ambiente publicado. |
| Conferência do pedido concluído, relatório e painel no site | Registrada pela equipe, com total de R$ 16,50. |
| Atualização dos cartões da Entrega 05 e anexação das evidências no Trello | Pendente. |

## Publicação e limites da demonstração

| Projeto | Configuração utilizada |
| --- | --- |
| UI na Vercel | Framework `Other`, Root Directory vazio (raiz do repositório), instalação `npm install --ignore-scripts --no-audit --no-fund`, build `npm run build` e saída `dist`. |
| API no Render Free | Runtime Node.js 22, branch `main`, raiz `backend`, build `npm_config_build_from_source=true npm ci --omit=dev --foreground-scripts`, início `npm start` e saúde `/api/health`. |
| Comunicação | `INOVAPAN_API_URL=https://inovapan.onrender.com/api` na Vercel e `CORS_ORIGINS=https://inovapan.vercel.app` no Render. |

Para reproduzir a publicação:

1. No Render, crie um **Web Service** conectado ao repositório, selecione **Free** e utilize as configurações da API indicadas acima. O build compila o SQLite no ambiente do serviço.
2. Nas variáveis de ambiente do Render, cadastre `NODE_ENV=production`, `NODE_VERSION=22`, `ADMIN_USER`, `ADMIN_PASSWORD`, `AUTH_SECRET` e `CORS_ORIGINS`. Utilize o usuário escolhido, uma senha com pelo menos 12 caracteres e a chave gerada na configuração da API. Na demonstração gratuita, `DB_PATH` foi omitido e a porta é fornecida pelo Render.
3. Na Vercel, importe o mesmo repositório e utilize as configurações da UI indicadas acima. Cadastre `INOVAPAN_API_URL` no ambiente **Production**, com a URL HTTPS da API terminada em `/api`, e publique a interface.
4. No Render, configure `CORS_ORIGINS` com a origem real da UI, sem barra final e sem `/api`. Aplique as alterações ao serviço e confira o login, um pedido concluído, o relatório e o painel no site.

A senha e a chave de assinatura permanecem somente no ambiente da API. Alterações em `INOVAPAN_API_URL` exigem uma nova publicação da UI; alterações nas variáveis da API precisam ser aplicadas ao serviço do Render. Para verificar a API, utilize a rota `/api/health`; a base `/api` não possui uma página de apresentação.

**A API utiliza SQLite no armazenamento temporário do Render Free, sem disco persistente.** Os registros podem ser perdidos após suspensão, reinício ou nova implantação. A primeira requisição após um período de inatividade pode demorar enquanto o serviço inicia novamente. Os dados da instalação local não são transferidos automaticamente para a publicação.

Essa configuração atende à demonstração do sistema publicado. A preservação contínua dos dados exige uma solução persistente; o código atual não inclui migração para banco externo. A alternativa descrita em `render.yaml` utiliza serviço e disco pagos.

## Equipe

- Hellem da Silva Rodrigues
- Maria Eli Gomes da Silva
- Maria Heloisa Sena Dias
- Shili Samara Alencar Sandes
- Vivianne Martins Ferraz

| Identificação acadêmica | Informação |
| --- | --- |
| Instituição | Universidade Estadual do Piauí — UESPI/UAPI |
| Curso | Tecnologia em Sistemas para Internet |
| Disciplina | Projeto Integrador II |
| Professor | Pedro Alex |
| Polo | Jerumenha, PI |
| Ano | 2026 |

## Documentação de referência

- [Bootstrap](https://getbootstrap.com/docs/5.3/)
- [Express](https://expressjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Node.js](https://nodejs.org/docs/latest-v22.x/api/)
- [SQLite](https://www.sqlite.org/docs.html)
- [Vercel](https://vercel.com/docs)
- [Render](https://render.com/docs)
