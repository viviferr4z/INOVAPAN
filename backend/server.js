const express = require('express');
const cors = require('cors');
const { db, all, get, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ok = (res, data, status = 200) => res.status(status).json(data);
const fail = (res, message, status = 400) => res.status(status).json({ erro: message });
const text = value => typeof value === 'string' ? value.trim() : '';

app.get('/api/health', (req, res) => ok(res, { status: 'ok', sistema: 'InovaPan API' }));

// CLIENTES 
app.get('/api/clientes', async (req, res) => {
  try {
    const q = text(req.query.q);
    const rows = q
      ? await all(`SELECT * FROM clientes WHERE nome LIKE ? OR telefone LIKE ? OR email LIKE ? ORDER BY nome`, [`%${q}%`, `%${q}%`, `%${q}%`])
      : await all('SELECT * FROM clientes ORDER BY nome');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const nome = text(req.body.nome);
    const telefone = text(req.body.telefone);
    const email = text(req.body.email);
    const endereco = text(req.body.endereco);
    if (!nome || !telefone) return fail(res, 'Nome e telefone são obrigatórios.');
    const r = await run('INSERT INTO clientes (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)', [nome, telefone, email, endereco]);
    ok(res, await get('SELECT * FROM clientes WHERE id = ?', [r.id]), 201);
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nome = text(req.body.nome);
    const telefone = text(req.body.telefone);
    if (!nome || !telefone) return fail(res, 'Nome e telefone são obrigatórios.');
    const r = await run('UPDATE clientes SET nome=?, telefone=?, email=?, endereco=? WHERE id=?', [nome, telefone, text(req.body.email), text(req.body.endereco), id]);
    if (!r.changes) return fail(res, 'Cliente não encontrado.', 404);
    ok(res, await get('SELECT * FROM clientes WHERE id=?', [id]));
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vinculo = await get('SELECT COUNT(*) AS total FROM pedidos WHERE cliente_id=?', [id]);
    if (vinculo?.total) return fail(res, 'Cliente possui pedidos vinculados e não pode ser excluído.', 409);
    const r = await run('DELETE FROM clientes WHERE id=?', [id]);
    if (!r.changes) return fail(res, 'Cliente não encontrado.', 404);
    ok(res, { mensagem: 'Cliente excluído com sucesso.' });
  } catch (e) { fail(res, e.message, 500); }
});

// PRODUTOS 
app.get('/api/produtos', async (req, res) => {
  try {
    const q = text(req.query.q);
    const rows = q
      ? await all('SELECT * FROM produtos WHERE nome LIKE ? OR descricao LIKE ? ORDER BY nome', [`%${q}%`, `%${q}%`])
      : await all('SELECT * FROM produtos ORDER BY nome');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/produtos', async (req, res) => {
  try {
    const nome = text(req.body.nome);
    const preco = Number(req.body.preco);
    if (!nome || !Number.isFinite(preco) || preco < 0) return fail(res, 'Nome e preço válido são obrigatórios.');
    const r = await run('INSERT INTO produtos (nome, descricao, preco, ativo) VALUES (?, ?, ?, ?)', [nome, text(req.body.descricao), preco, req.body.ativo === false ? 0 : 1]);
    ok(res, await get('SELECT * FROM produtos WHERE id=?', [r.id]), 201);
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/produtos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nome = text(req.body.nome);
    const preco = Number(req.body.preco);
    if (!nome || !Number.isFinite(preco) || preco < 0) return fail(res, 'Nome e preço válido são obrigatórios.');
    const r = await run('UPDATE produtos SET nome=?, descricao=?, preco=?, ativo=? WHERE id=?', [nome, text(req.body.descricao), preco, req.body.ativo === false ? 0 : 1, id]);
    if (!r.changes) return fail(res, 'Produto não encontrado.', 404);
    ok(res, await get('SELECT * FROM produtos WHERE id=?', [id]));
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vinculo = await get('SELECT COUNT(*) AS total FROM itens_pedido WHERE produto_id=?', [id]);
    if (vinculo?.total) {
      await run('UPDATE produtos SET ativo=0 WHERE id=?', [id]);
      return ok(res, { mensagem: 'Produto inativado porque possui pedidos vinculados.' });
    }
    const r = await run('DELETE FROM produtos WHERE id=?', [id]);
    if (!r.changes) return fail(res, 'Produto não encontrado.', 404);
    ok(res, { mensagem: 'Produto excluído com sucesso.' });
  } catch (e) { fail(res, e.message, 500); }
});

// PEDIDOS 
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await all(`
      SELECT p.id, p.cliente_id, c.nome AS cliente, p.data_pedido, p.status, p.total, p.observacao
      FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
      ORDER BY p.data_pedido DESC, p.id DESC`);
    for (const p of pedidos) {
      p.itens = await all(`
        SELECT i.id, i.produto_id, pr.nome AS produto, i.quantidade, i.valor_unitario, i.valor_total
        FROM itens_pedido i JOIN produtos pr ON pr.id=i.produto_id
        WHERE i.pedido_id=? ORDER BY i.id`, [p.id]);
    }
    ok(res, pedidos);
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/pedidos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pedido = await get(`SELECT p.*, c.nome AS cliente FROM pedidos p JOIN clientes c ON c.id=p.cliente_id WHERE p.id=?`, [id]);
    if (!pedido) return fail(res, 'Pedido não encontrado.', 404);
    pedido.itens = await all(`SELECT i.*, pr.nome AS produto FROM itens_pedido i JOIN produtos pr ON pr.id=i.produto_id WHERE i.pedido_id=?`, [id]);
    ok(res, pedido);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/pedidos', async (req, res) => {
  const clienteId = Number(req.body.cliente_id);
  const itens = Array.isArray(req.body.itens) ? req.body.itens : [];
  if (!clienteId || !itens.length) return fail(res, 'Cliente e pelo menos um item são obrigatórios.');

  db.serialize(async () => {
    try {
      await run('BEGIN TRANSACTION');
      const cliente = await get('SELECT id FROM clientes WHERE id=?', [clienteId]);
      if (!cliente) throw new Error('Cliente não encontrado.');

      let total = 0;
      const calculados = [];
      for (const item of itens) {
        const produto = await get('SELECT id, nome, preco, ativo FROM produtos WHERE id=?', [Number(item.produto_id)]);
        const quantidade = Number(item.quantidade);
        if (!produto || !produto.ativo) throw new Error('Produto inválido ou inativo.');
        if (!Number.isInteger(quantidade) || quantidade <= 0) throw new Error('Quantidade inválida.');
        const valorTotal = Number((produto.preco * quantidade).toFixed(2));
        total += valorTotal;
        calculados.push({ produto_id: produto.id, quantidade, valor_unitario: produto.preco, valor_total: valorTotal });
      }
      total = Number(total.toFixed(2));
      const r = await run('INSERT INTO pedidos (cliente_id, status, total, observacao) VALUES (?, ?, ?, ?)', [clienteId, 'ABERTO', total, text(req.body.observacao)]);
      for (const item of calculados) {
        await run('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?)', [r.id, item.produto_id, item.quantidade, item.valor_unitario, item.valor_total]);
      }
      await run('COMMIT');
      const novo = await get('SELECT * FROM pedidos WHERE id=?', [r.id]);
      ok(res, novo, 201);
    } catch (e) {
      try { await run('ROLLBACK'); } catch (_) {}
      fail(res, e.message, 400);
    }
  });
});

app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = text(req.body.status).toUpperCase();
    const permitidos = ['ABERTO', 'EM_PREPARO', 'CONCLUIDO', 'CANCELADO'];
    if (!permitidos.includes(status)) return fail(res, 'Status inválido.');
    const r = await run('UPDATE pedidos SET status=?, observacao=COALESCE(?, observacao) WHERE id=?', [status, req.body.observacao ?? null, id]);
    if (!r.changes) return fail(res, 'Pedido não encontrado.', 404);
    ok(res, await get('SELECT * FROM pedidos WHERE id=?', [id]));
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const r = await run('DELETE FROM pedidos WHERE id=?', [Number(req.params.id)]);
    if (!r.changes) return fail(res, 'Pedido não encontrado.', 404);
    ok(res, { mensagem: 'Pedido excluído com sucesso.' });
  } catch (e) { fail(res, e.message, 500); }
});

// DASHBOARD E RELATÓRIOS 
app.get('/api/dashboard', async (req, res) => {
  try {
    const clientes = await get('SELECT COUNT(*) AS total FROM clientes');
    const produtos = await get('SELECT COUNT(*) AS total FROM produtos WHERE ativo=1');
    const pedidosHoje = await get("SELECT COUNT(*) AS total, COALESCE(SUM(total),0) AS valor FROM pedidos WHERE date(data_pedido)=date('now','localtime') AND status <> 'CANCELADO'");
    const faturamento = await get("SELECT COALESCE(SUM(total),0) AS valor FROM pedidos WHERE status='CONCLUIDO'");
    ok(res, {
      clientes: clientes.total,
      produtos: produtos.total,
      pedidos_hoje: pedidosHoje.total,
      vendas_hoje: Number(pedidosHoje.valor || 0),
      faturamento_total: Number(faturamento.valor || 0)
    });
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/relatorios/vendas', async (req, res) => {
  try {
    const inicio = text(req.query.inicio);
    const fim = text(req.query.fim);
    const filtros = [];
    const params = [];
    if (inicio) { filtros.push('date(p.data_pedido) >= date(?)'); params.push(inicio); }
    if (fim) { filtros.push('date(p.data_pedido) <= date(?)'); params.push(fim); }
    filtros.push("p.status <> 'CANCELADO'");
    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    const vendas = await all(`SELECT p.id, p.data_pedido, c.nome AS cliente, p.status, p.total FROM pedidos p JOIN clientes c ON c.id=p.cliente_id ${where} ORDER BY p.data_pedido DESC`, params);
    const resumo = vendas.reduce((acc, v) => { acc.quantidade += 1; acc.total += Number(v.total); return acc; }, { quantidade: 0, total: 0 });
    resumo.total = Number(resumo.total.toFixed(2));
    ok(res, { resumo, vendas });
  } catch (e) { fail(res, e.message, 500); }
});

app.use((req, res) => fail(res, 'Rota não encontrada.', 404));
app.use((err, req, res, next) => fail(res, err.message || 'Erro interno.', 500));

app.listen(PORT, () => {
  console.log(`InovaPan API disponível em http://localhost:${PORT}`);
});
