# Publicação da Entrega 05

A UI e a API foram publicadas e integradas em **28 de outubro de 2026**. Este guia registra as configurações utilizadas, os endereços reais e as verificações realizadas.

## Endereços publicados

| Recurso | Endereço |
| --- | --- |
| Repositório | https://github.com/viviferr4z/INOVAPAN |
| UI na Vercel | https://inovapan.vercel.app |
| Login | https://inovapan.vercel.app/login.html |
| Base da API no Render | https://inovapan.onrender.com/api |
| Saúde da API | https://inovapan.onrender.com/api/health |
| Código de referência da publicação | [afb7d47](https://github.com/viviferr4z/INOVAPAN/commit/afb7d47f2eddb21b2ff300fb394c2477d2b1c358) |

A URL da API identifica o servidor e a base das rotas, não uma página de apresentação. Para conferir se a API está funcionando, utilize `/api/health`. Abrir somente a raiz do servidor pode retornar `Rota não encontrada` sem representar uma falha na implantação.

## 1 API no Render Free

O serviço foi criado manualmente como **Web Service**, ligado à branch `main` do repositório. A opção escolhida foi **Free**, sem disco persistente. O arquivo `render.yaml` descreve uma alternativa paga e não foi aplicado nesta configuração gratuita.

| Campo | Configuração utilizada |
| --- | --- |
| Runtime | Node.js |
| Branch | `main` |
| Root Directory | `backend` |
| Build Command | `npm_config_build_from_source=true npm ci --omit=dev --foreground-scripts` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Compute | Free |
| Persistent Disk | Não adicionado |

O comando de build acima é destinado ao Linux do Render. Ele força a compilação do SQLite no próprio ambiente, evitando o binário pré-compilado que apresentou `GLIBC_2.38 not found`. Após a correção, a compilação e a implantação foram concluídas com sucesso.

Se alterar o comando de build, salve e utilize **Manual Deploy → Clear build cache & deploy**, para que a nova implantação não reutilize os arquivos antigos.

### Variáveis da API

Em **Environment**, mantenha:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `ADMIN_USER` | `administrador`, ou o nome escolhido para acesso |
| `ADMIN_PASSWORD` | Senha exclusiva com pelo menos 12 caracteres |
| `AUTH_SECRET` | Chave aleatória com pelo menos 32 caracteres |
| `CORS_ORIGINS` | `https://inovapan.vercel.app` |

A senha e a chave devem permanecer somente no ambiente da API. Seus valores não devem ser publicados no GitHub ou anexados às evidências acadêmicas.

Para gerar uma nova chave no terminal do computador:

```text
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Na configuração gratuita utilizada, **`DB_PATH` foi omitido**. O banco é criado automaticamente em `backend/data/inovapan.db`, no armazenamento temporário do serviço. A porta é fornecida pelo Render; não é necessário cadastrar `PORT=3000` na publicação.

Ao alterar variáveis de ambiente, utilize **Save and deploy** ou a opção de salvar, recompilar e publicar. **Save only** não aplica a alteração ao processo que já está em execução.

## 2 UI na Vercel

A UI foi importada do mesmo repositório GitHub. A raiz utilizada corresponde à raiz do repositório, onde ficam o `package.json` da UI, as páginas HTML e `vercel.json`.

| Campo | Configuração utilizada |
| --- | --- |
| Framework Preset | `Other` |
| Root Directory | Vazio, indicando a raiz do repositório |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install --ignore-scripts --no-audit --no-fund`, definido em `vercel.json` |

O **Framework Preset da UI é `Other`**. O servidor Express é publicado no Render. O campo **Root Directory da Vercel não deve apontar para `backend`**: essa pasta é a raiz utilizada exclusivamente pelo serviço da API no Render.

Cadastre esta variável em **Environment Variables**, incluindo o ambiente **Production**:

| Key | Value |
| --- | --- |
| `INOVAPAN_API_URL` | `https://inovapan.onrender.com/api` |

O build gera `dist/js/config.js` com essa URL pública. A pasta `dist` contém os arquivos destinados ao navegador. As credenciais do administrador e a chave de assinatura não são variáveis da UI.

Após mudar as configurações da Vercel, salve e abra **Deployments → menu de três pontos da publicação → Redeploy**. Se necessário, desmarque **Use existing Build Cache**. A publicação deve terminar com status **Ready**.

## 3 Ligação entre UI e API

As duas variáveis possuem finalidades diferentes:

| Ambiente | Variável | Valor |
| --- | --- | --- |
| Vercel | `INOVAPAN_API_URL` | `https://inovapan.onrender.com/api` |
| Render | `CORS_ORIGINS` | `https://inovapan.vercel.app` |

Em `CORS_ORIGINS`, utilize apenas a origem da UI, **sem barra final e sem `/api`**. O valor provisório `https://example.invalid` deve ser substituído pela origem real antes de testar o login.

Se a URL da API mudar, atualize `INOVAPAN_API_URL` e publique novamente a UI. Se a URL da UI mudar, atualize `CORS_ORIGINS` e aplique a alteração no Render. Uma URL de preview diferente precisa de autorização própria para utilizar a API.

## 4 Verificações públicas realizadas

| Verificação em 28/10/2026 | Resultado |
| --- | --- |
| Página de login da Vercel | HTTP 200. |
| `js/config.js` publicado | HTTP 200, com a URL correta da API. |
| `GET /api/health` no Render | HTTP 200, `status: ok`, versão 2.0.0. |
| Preflight de login com origem da Vercel | HTTP 204 e origem `https://inovapan.vercel.app` autorizada. |
| `GET /api/clientes` sem token | HTTP 401. |
| Login e abertura do painel no site | Confirmados pela equipe. |

Os testes locais e seus resultados estão no [README.md](README.md). Os resultados públicos acima não substituem a conferência final das operações autenticadas de cadastro, pedidos e relatórios.

Para registrar essa conferência no site:

1. Entre em https://inovapan.vercel.app/login.html com o usuário e a senha configurados no Render.
2. Cadastre um cliente fictício e um produto com preço conhecido.
3. Crie um pedido e confira quantidade, valor unitário, itens em **Detalhes** e total.
4. Antes da conclusão, edite os itens e confira o recálculo.
5. Altere o pedido para **CONCLUIDO** e confira o relatório e o faturamento concluído no painel.
6. Saia do sistema e confirme que o acesso exige novo login.
7. Registre capturas com a barra de endereço visível, sem senha, chave ou token.

## 5 Limites da demonstração gratuita

A API utiliza **SQLite no armazenamento temporário do Render Free**. Clientes, produtos e pedidos podem ser perdidos quando o serviço suspender, reiniciar ou receber nova implantação. O serviço gratuito suspende após inatividade; a primeira requisição seguinte pode demorar enquanto a API volta a iniciar.

Essa configuração permite demonstrar o sistema publicado, mas não oferece armazenamento contínuo dos registros. Os dados cadastrados na instalação local do computador também não são enviados automaticamente para a API pública.

Se for necessário preservar dados continuamente, será preciso configurar uma solução persistente. O código atual utiliza SQLite e não inclui migração para banco externo. A alternativa de `render.yaml` requer serviço e disco pagos; antes de adotá-la, confira o custo, acrescente a compilação a partir do código-fonte ao build e configure o disco e `DB_PATH` para o mesmo caminho persistente. Não aplique esse arquivo para reproduzir a opção gratuita descrita neste guia.

## 6 Encerramento acadêmico

A equipe deve atualizar os cartões reais do [Trello](https://trello.com/b/zlxtIrdV/inovapan), conferir sua correspondência com as tarefas resumidas no [README.md](README.md) e anexar os links públicos e as evidências. A situação atual dos cartões não foi verificada nesta revisão.

Para o relatório ou envio da atividade, registre:

- UI: https://inovapan.vercel.app
- API: https://inovapan.onrender.com/api
- Saúde da API: https://inovapan.onrender.com/api/health
- Repositório: https://github.com/viviferr4z/INOVAPAN
- Código de referência da publicação: `afb7d47`.
- Login e painel públicos confirmados pela equipe.
- Resultados dos testes locais e capturas da conferência final no site.
- Uso do Render Free com SQLite temporário e sua limitação de persistência.

## Fontes oficiais consultadas em 28 de outubro de 2026

- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/deployments/managing-deployments
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/deploys
- https://render.com/docs/free
- https://render.com/docs/native-runtimes
- https://github.com/TryGhost/node-sqlite3#source-install
