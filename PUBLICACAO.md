# Publicação da Entrega 05

O código foi preparado para duas implantações independentes no mesmo repositório: a UI na Vercel e a API no Render. Os endereços abaixo descritos como pendentes não são publicações já realizadas. A execução dos procedimentos exige uma conta com acesso ao repositório e aos serviços.

## 1 Conferir os arquivos antes da publicação

O repositório de referência é https://github.com/viviferr4z/INOVAPAN. Em 28/10/2026, a branch main ainda corresponde à base da Entrega 04, commit ce5e348. O código da Entrega 05 foi validado em ambiente local e deve acompanhar a documentação quando o repositório for atualizado para essa versão.

Antes de iniciar as implantações, confira a presença de `vercel.json`, `render.yaml`, dos arquivos de build da UI e da API atualizada. Os arquivos `.env`, bancos de dados, `node_modules` e `dist` ficam fora do controle de versão conforme as regras do `.gitignore`. O banco e a configuração de acesso da instalação local devem ser preservados.

A revisão dos arquivos Markdown registra o estado do projeto; a conclusão da publicação depende das etapas seguintes e dos testes nos endereços públicos.

## 2 Preparar a API no Render

Para preservar SQLite entre reinícios e implantações, o Render requer um serviço compatível com disco persistente, atualmente pago. O arquivo `render.yaml` usa `starter` e disco de 1 GB. Confira o custo no painel antes de aplicá-lo; nenhum serviço foi contratado durante a preparação.

No Render, crie um Web Service pelo repositório ou use um Blueprint com `render.yaml`:

| Campo | Configuração |
| --- | --- |
| Runtime | Node.js 22 |
| Root Directory | `backend` |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Persistent Disk Mount Path | `/var/data` |
| Persistent Disk Size | 1 GB |

Configure as variáveis somente no ambiente da API:

| Variável | Valor a configurar |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DB_PATH` | `/var/data/inovapan.db` |
| `ADMIN_USER` | `administrador` ou o usuário escolhido |
| `ADMIN_PASSWORD` | Senha exclusiva com ao menos 12 caracteres |
| `AUTH_SECRET` | Chave aleatória com ao menos 32 caracteres; Blueprint pode gerar |
| `CORS_ORIGINS` | Origem HTTPS exata da UI, sem barra final e sem `/api` |

Para gerar a chave no seu computador:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

No primeiro provisionamento, se a URL da UI ainda não existir, use temporariamente `https://example.invalid` em `CORS_ORIGINS`. O login via UI só funcionará depois de substituir pela origem real da Vercel. O health check não precisa de login nem de origem de navegador.

Após a implantação, abra a URL real do serviço seguida de `/api/health`. A resposta deve conter `status: ok`. Anote a URL pública real da API e guarde os segredos fora dos documentos acadêmicos.

### Alternativa para demonstração gratuita

É possível criar manualmente um Web Service gratuito sem disco, com `DB_PATH` omitido. Não aplique `render.yaml` nessa alternativa. Os registros nesse modo são temporários e podem desaparecer ao reiniciar, suspender ou implantar novamente. Se a entrega exigir persistência contínua, essa alternativa não atende ao requisito; use disco ou planeje migração para banco externo persistente. O código atual utiliza SQLite e não inclui migração para PostgreSQL.

## 3 Publicar a UI na Vercel

Importe o mesmo repositório na Vercel. A raiz deve ser a raiz do repositório; não selecione `backend`.

| Campo | Configuração |
| --- | --- |
| Framework Preset | Other |
| Root Directory | Raiz do projeto |
| Node.js Version | 22.x |
| Install Command | `npm install --ignore-scripts --no-audit --no-fund` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| `INOVAPAN_API_URL` | URL HTTPS real do Render terminada em `/api` |

O `vercel.json` já define os comandos e a pasta pública. A única variável da UI é a URL pública da API; nunca cadastre `ADMIN_PASSWORD` ou `AUTH_SECRET` na UI. O build gera `dist/js/config.js` e falha na Vercel se não receber uma URL pública válida.

Depois da publicação, copie a origem real da UI e atualize `CORS_ORIGINS` no Render. Reimplante a API para aplicar o ambiente. Se a URL da API for alterada, atualize `INOVAPAN_API_URL` e reimplante a UI. URLs de preview também precisam de autorização exata em `CORS_ORIGINS` para acessar a API.

## 4 Validar na internet

1. Abra a UI na Vercel em uma janela privativa e realize o login.
2. Cadastre um cliente fictício e os produtos Bolo de Chocolate a R$25 e Pão Francês a R$1.
3. Crie um pedido com 1 bolo e 10 pães. Confirme o total de R$35.
4. Edite para 15 pães. Confirme o total de R$40 e os itens em Detalhes.
5. Conclua o pedido e confirme relatório e faturamento concluído de R$40.
6. Reinicie/reimplante a API e confirme que os dados permanecem quando houver disco persistente.
7. Saia do sistema e confirme que operações sem token recebem HTTP 401.
8. Registre capturas reais com a barra de endereço da Vercel/Render. Não exponha senha nem token.

## 5 Conferir o Trello e encerrar a entrega

A seção **Organização das tarefas** do [README.md](README.md) resume as implementações locais da API e da UI. Compare esse resumo com as sprints e os cartões reais do Trello, confira atividades adicionais e atualize cada cartão conforme as evidências disponíveis. Registre também os links públicos e o commit efetivamente enviado.

Preencha no relatório acadêmico:

- URL real da UI na Vercel: pendente.
- URL real da API no Render: pendente.
- Health check público validado: pendente.
- Commit remoto desta versão: pendente.
- Capturas da execução pública e atualização do Trello: pendentes.

A imagem da atividade mostra o período 30/11/2026 a 11/01/2027, mas informa encerramento da atividade em **10/01/2027 às 23h59**. Confirme o prazo no SIGAA e adote o encerramento mais cedo como referência até a confirmação.

## Fontes oficiais consultadas em 28 de outubro de 2026

- https://vercel.com/docs/git
- https://vercel.com/docs/project-configuration
- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/disks
- https://render.com/docs/blueprint-spec
