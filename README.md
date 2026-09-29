# InovaPan — Sistema de Gestão de Pedidos para Panificadora


O **InovaPan** é um Sistema de Gestão de Pedidos desenvolvido para apoiar as principais operações de uma panificadora, permitindo o gerenciamento de **clientes, produtos, pedidos, vendas e indicadores gerenciais**.

Esta versão corresponde à **Entrega 04 do projeto**, cujo objetivo principal foi realizar a integração entre a interface do sistema (**Front-end**), a API (**Back-end**) e o banco de dados **SQLite**.

O projeto foi desenvolvido no curso de **Tecnologia em Sistemas para Internet — UESPI / UAPI**.

---

## Objetivo

Neste projeto foram consolidadas as funcionalidades necessárias para permitir a comunicação completa entre a interface do usuário e o servidor.

As operações realizadas nas páginas do sistema são enviadas para uma API desenvolvida com **Node.js e Express**, que realiza o processamento das requisições e a comunicação com o banco de dados **SQLite**.

Com essa integração, informações cadastradas na interface passam a ser persistidas no banco de dados e utilizadas pelos demais módulos do sistema.

---

## Tecnologias utilizadas

### Front-end

- HTML5
- CSS3
- Bootstrap 5
- JavaScript
- Fetch API

### Back-end

- Node.js
- Express
- CORS
- SQLite

---

## Funcionalidades implementadas

### Clientes

O módulo de clientes permite:

- cadastrar clientes;
- consultar clientes cadastrados;
- pesquisar clientes;
- editar informações;
- excluir registros.

---

### Produtos

O módulo de produtos permite:

- cadastrar produtos;
- consultar produtos;
- editar informações;
- pesquisar produtos;
- controlar produtos ativos;
- inativar ou excluir produtos.

---

### Pedidos

O módulo de pedidos permite:

- criar novos pedidos;
- selecionar o cliente;
- adicionar produtos;
- definir quantidades;
- calcular os valores do pedido;
- consultar pedidos registrados;
- atualizar o status;
- excluir pedidos.

Os pedidos são registrados juntamente com seus respectivos itens e quantidades.

---

### Painel gerencial

O painel apresenta informações consolidadas obtidas através da API, permitindo acompanhar indicadores do sistema, como:

- quantidade de clientes;
- produtos ativos;
- pedidos realizados;
- vendas do dia;
- faturamento referente aos pedidos concluídos.

---

### Relatório de vendas

O sistema possui uma área de relatórios que permite consultar as vendas realizadas em determinado período.

O relatório apresenta informações como:

- pedidos encontrados;
- cliente;
- data;
- status;
- valor da venda;
- quantidade de vendas;
- valor total vendido no período.

---

## Integração entre Front-end e Back-end

A comunicação entre as páginas do sistema e a API foi centralizada no arquivo:

```text
js/api.js
```

Esse arquivo é responsável por intermediar as requisições realizadas pelos módulos de clientes, produtos, pedidos, painel e relatórios.

O fluxo básico de funcionamento do sistema é:

```text
Usuário
   ↓
Interface HTML
   ↓
JavaScript / Fetch API
   ↓
API Node.js + Express
   ↓
SQLite
   ↓
Resposta JSON
   ↓
Atualização da interface
```

Quando o usuário realiza uma ação na interface, o JavaScript prepara os dados e envia uma requisição HTTP para a API.

O Express recebe a solicitação, realiza as validações necessárias e consulta ou grava as informações no banco SQLite.

Em seguida, a API retorna uma resposta em formato JSON, utilizada pelo Front-end para atualizar as informações apresentadas ao usuário.

---

# Como executar o projeto

Para executar o InovaPan localmente são necessários **dois terminais**:

- um para executar a API;
- outro para executar o Front-end.

## 1. Pré-requisitos

Antes de iniciar, é necessário ter instalado:

- Node.js;
- npm;
- navegador web;
- terminal ou PowerShell.

Para verificar se o Node.js está instalado:

```bash
node --version
```

Para verificar o npm:

```bash
npm --version
```

---

## 2. Executar o Back-end

Abra um terminal na pasta do projeto e acesse:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Depois execute:

```bash
npm start
```

A API ficará disponível em:

```text
http://localhost:3000
```

 **Mantenha esse terminal aberto enquanto estiver utilizando o sistema.**

---

## 3. Executar o Front-end

Abra **outro terminal**.

O segundo terminal deve estar na **raiz do projeto `INOVAPAN`**, e não dentro da pasta `backend`.

Execute:

```bash
npx http-server . -p 5500
```

> Durante a execução poderá ser solicitada a instalação do pacote `http-server`. Caso apareça a confirmação, autorize a execução.

O Front-end ficará disponível em:

```text
http://localhost:5500
```

Abra esse endereço no navegador.

---

## Importante

A aplicação utiliza duas portas diferentes:

```text
Front-end → http://localhost:5500
Back-end  → http://localhost:3000
```

Os **dois servidores precisam permanecer em execução simultaneamente** para que a integração UI/API funcione corretamente.

---

# Principais endpoints da API

### Clientes

```http
GET    /api/clientes
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
```

### Produtos

```http
GET    /api/produtos
POST   /api/produtos
PUT    /api/produtos/:id
DELETE /api/produtos/:id
```

### Pedidos

```http
GET    /api/pedidos
POST   /api/pedidos
GET    /api/pedidos/:id
PUT    /api/pedidos/:id
DELETE /api/pedidos/:id
```

### Dashboard

```http
GET /api/dashboard
```

### Relatório de vendas

```http
GET /api/relatorios/vendas?inicio=AAAA-MM-DD&fim=AAAA-MM-DD
```

Exemplo:

```text
/api/relatorios/vendas?inicio=2026-09-01&fim=2026-09-30
```

---

# Validação funcional

Após a integração entre Front-end, API e banco de dados, foram realizados testes funcionais em ambiente local.

Durante os testes foram validados:

- cadastro e consulta de clientes;
- cadastro e consulta de produtos;
- criação de pedidos;
- atualização do status dos pedidos;
- geração do relatório de vendas;
- atualização dos indicadores do painel.

Como cenário de validação, foi cadastrado um cliente e dois produtos e posteriormente criado um pedido no valor de **R$ 35,00**.

Após a conclusão do pedido, as informações foram corretamente refletidas no relatório de vendas e nos indicadores do painel, demonstrando a comunicação entre a interface, a API e a persistência dos dados.

---

# Tarefas API — Sprint de Integração

1. Validação das requisições e tratamento de erros.
2. CRUD completo de clientes.
3. CRUD completo de produtos.
4. Registro de pedidos e respectivos itens.
5. Consulta detalhada dos pedidos.
6. Atualização de status e exclusão de pedidos.
7. Disponibilização de indicadores para o painel.
8. Relatório de vendas por período.

---

# Tarefas UI — Sprint de Integração

1. Centralização da comunicação com a API em `js/api.js`.
2. Integração do módulo de clientes.
3. Integração do módulo de produtos.
4. Implementação da criação de novos pedidos.
5. Consulta e gerenciamento dos pedidos.
6. Atualização dinâmica dos indicadores do painel.
7. Implementação do relatório de vendas.
8. Inclusão de mensagens de retorno, validações e feedback das operações.

---

# Banco de dados

O projeto utiliza **SQLite** para persistência das informações.

O banco utilizado durante o desenvolvimento é um arquivo local e não precisa ser versionado juntamente com o código-fonte.

Por esse motivo, o arquivo:

```text
inovapan.db
```

está incluído no `.gitignore`.

Também não é enviada ao GitHub a pasta:

```text
node_modules/
```

As dependências podem ser instaladas novamente através do comando:

```bash
npm install
```

---


Projeto desenvolvido para o curso de:

**Tecnologia em Sistemas para Internet**

**Universidade Estadual do Piauí — UESPI**  
**Universidade Aberta do Piauí — UAPI**

Projeto:

**Sistema de Gestão de Pedidos para Panificadora — InovaPan**

Polo:

**Jerumenha — PI**

Ano:

**2026**

---

# Equipe

- Hellem da Silva Rodrigues
- Maria Eli Gomes da Silva
- Maria Heloisa Sena Dias
- Shili Samara Alencar Sandes
- Vivianne Martins Ferraz

---

# Gerenciamento do projeto

As atividades e tarefas das sprints foram organizadas através do **Trello**.

Trello:

https://trello.com/b/zlxtIrdV/inovapan

---

# Referências

- Bootstrap — https://getbootstrap.com
- Express — https://expressjs.com
- MDN Web Docs — https://developer.mozilla.org
- Node.js — https://nodejs.org
- SQLite — https://www.sqlite.org/docs.html
- SOMMERVILLE, Ian. *Engenharia de Software*. 10. ed. São Paulo: Pearson, 2018.