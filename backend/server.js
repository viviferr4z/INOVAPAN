const express = require('express');
const cors = require('cors');
const { db, ready, all, get, run, transaction } = require('./db');
const { createAuth } = require('./auth');
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const { login, requireAuth } = createAuth();
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500').split(',').map(s => s.trim()).filter(Boolean);
if (origins.includes('*')) throw new Error('CORS_ORIGINS deve conter origens exatas, sem *.');
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' }); next(); });
app.use(cors({ origin(origin, callback) {
  if (!origin || origins.includes(origin)) return callback(null, true);
  callback(Object.assign(new Error('Origem não autorizada.'), { status: 403 }));
}, allowedHeaders: ['Content-Type', 'Authorization'], methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => { if (req.body == null) req.body = {}; next(); });
const route = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const text = (value, field, max = 200, required = false) => {
  if (value != null && typeof value !== 'string') throw error(`${field} deve ser texto.`);
  const result = (value || '').trim();
  if ((required && !result) || result.length > max) throw error(`${field} inválido (máximo ${max} caracteres).`);
  return result;
};
const idValue = value => {
  const id = Number(value);
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(id)) throw error('Identificador inválido.');
  return id;
};
const customer = body => {
  const nome = text(body.nome, 'Nome', 120, true), telefone = text(body.telefone, 'Telefone', 30, true);
  const email = text(body.email, 'E-mail', 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw error('E-mail inválido.');
  return [nome, telefone, email, text(body.endereco, 'Endereço', 300)];
};
const product = body => {
  const raw = body.preco, preco = Number(raw);
  if (raw === '' || raw == null || typeof raw === 'boolean' || !Number.isFinite(preco) || preco < 0 || preco > 1000000 || Math.abs(preco * 100 - Math.round(preco * 100)) > 1e-6) throw error('Preço inválido. Use até duas casas decimais.');
  if (body.ativo != null && typeof body.ativo !== 'boolean') throw error('Ativo deve ser verdadeiro ou falso.');
  return [text(body.nome, 'Nome', 120, true), text(body.descricao, 'Descrição', 500), preco, body.ativo === false ? 0 : 1];
};
app.get('/api/health', route(async (req, res) => { await ready; await get('SELECT 1'); res.json({ status: 'ok', sistema: 'InovaPan API', versao: '2.0.0' }); }));
app.post('/api/auth/login', login);
app.use('/api', requireAuth, (req, res, next) => ready.then(() => next(), next));
app.param('id', (req, res, next, value) => { try { req.recordId = idValue(value); next(); } catch (err) { next(err); } });
app.get('/api/clientes', route(async (req, res) => {
  const q = text(req.query.q, 'Pesquisa');
  res.json(q ? await all('SELECT * FROM clientes WHERE nome LIKE ? OR telefone LIKE ? OR email LIKE ? ORDER BY nome', Array(3).fill(`%${q}%`)) : await all('SELECT * FROM clientes ORDER BY nome'));
}));
app.post('/api/clientes', route(async (req, res) => {
  const r = await run('INSERT INTO clientes (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)', customer(req.body));
  res.status(201).json(await get('SELECT * FROM clientes WHERE id=?', [r.id]));
}));
app.put('/api/clientes/:id', route(async (req, res) => {
  const r = await run('UPDATE clientes SET nome=?, telefone=?, email=?, endereco=? WHERE id=?', [...customer(req.body), req.recordId]);
  if (!r.changes) throw error('Cliente não encontrado.', 404);
  res.json(await get('SELECT * FROM clientes WHERE id=?', [req.recordId]));
}));
app.delete('/api/clientes/:id', route(async (req, res) => {
  const r = await run('DELETE FROM clientes WHERE id=?', [req.recordId]);
  if (!r.changes) throw error('Cliente não encontrado.', 404);
  res.json({ mensagem: 'Cliente excluído com sucesso.' });
}));
app.get('/api/produtos', route(async (req, res) => {
  const q = text(req.query.q, 'Pesquisa');
  res.json(q ? await all('SELECT * FROM produtos WHERE nome LIKE ? OR descricao LIKE ? ORDER BY nome', [`%${q}%`, `%${q}%`]) : await all('SELECT * FROM produtos ORDER BY nome'));
}));
app.post('/api/produtos', route(async (req, res) => {
  const r = await run('INSERT INTO produtos (nome, descricao, preco, ativo) VALUES (?, ?, ?, ?)', product(req.body));
  res.status(201).json(await get('SELECT * FROM produtos WHERE id=?', [r.id]));
}));
app.put('/api/produtos/:id', route(async (req, res) => {
  const r = await run('UPDATE produtos SET nome=?, descricao=?, preco=?, ativo=? WHERE id=?', [...product(req.body), req.recordId]);
  if (!r.changes) throw error('Produto não encontrado.', 404);
  res.json(await get('SELECT * FROM produtos WHERE id=?', [req.recordId]));
}));
app.delete('/api/produtos/:id', route(async (req, res) => {
  res.json(await transaction(async q => {
    if (!await q.get('SELECT id FROM produtos WHERE id=?', [req.recordId])) throw error('Produto não encontrado.', 404);
    const linked = await q.get('SELECT id FROM itens_pedido WHERE produto_id=? LIMIT 1', [req.recordId]);
    await q.run(linked ? 'UPDATE produtos SET ativo=0 WHERE id=?' : 'DELETE FROM produtos WHERE id=?', [req.recordId]);
    return { mensagem: linked ? 'Produto inativado porque possui pedidos vinculados.' : 'Produto excluído com sucesso.' };
  }));
}));
async function orderItems(q, body) {
  const clienteId = idValue(body.cliente_id);
  if (!await q.get('SELECT id FROM clientes WHERE id=?', [clienteId])) throw error('Cliente não encontrado.');
  if (!Array.isArray(body.itens) || !body.itens.length || body.itens.length > 100) throw error('Informe de 1 a 100 itens.');
  const merged = new Map();
  for (const item of body.itens) {
    if (!item || typeof item !== 'object') throw error('Item inválido.');
    const productId = idValue(item.produto_id), quantity = Number(item.quantidade);
    const totalQty = (merged.get(productId) || 0) + quantity;
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || totalQty > 100000) throw error('Quantidade inválida (1 a 100000).');
    merged.set(productId, totalQty);
  }
  let cents = 0;
  const items = [];
  for (const [produtoId, quantity] of merged) {
    const produto = await q.get('SELECT * FROM produtos WHERE id=?', [produtoId]);
    if (!produto || !produto.ativo) throw error('Produto inválido ou inativo.');
    const unit = Math.round(produto.preco * 100), line = unit * quantity;
    cents += line;
    if (!Number.isSafeInteger(cents)) throw error('Valor total excede o limite.');
    items.push([produtoId, quantity, unit / 100, line / 100]);
  }
  return { clienteId, total: cents / 100, items, observacao: text(body.observacao, 'Observação', 1000) };
}
async function insertItems(q, orderId, items) {
  for (const item of items) await q.run('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?)', [orderId, ...item]);
}
const orderSelect = 'SELECT p.*, c.nome AS cliente FROM pedidos p JOIN clientes c ON c.id=p.cliente_id';
async function withItems(pedido) {
  pedido.itens = await all('SELECT i.*, pr.nome AS produto FROM itens_pedido i JOIN produtos pr ON pr.id=i.produto_id WHERE i.pedido_id=? ORDER BY i.id', [pedido.id]);
  return pedido;
}
app.get('/api/pedidos', route(async (req, res) => {
  const orders = await all(`${orderSelect} ORDER BY p.data_pedido DESC, p.id DESC`);
  res.json(await Promise.all(orders.map(withItems)));
}));
app.get('/api/pedidos/:id', route(async (req, res) => {
  const order = await get(`${orderSelect} WHERE p.id=?`, [req.recordId]);
  if (!order) throw error('Pedido não encontrado.', 404);
  res.json(await withItems(order));
}));
app.post('/api/pedidos', route(async (req, res) => {
  const order = await transaction(async q => {
    const data = await orderItems(q, req.body);
    const r = await q.run('INSERT INTO pedidos (cliente_id, status, total, observacao) VALUES (?, ?, ?, ?)', [data.clienteId, 'ABERTO', data.total, data.observacao]);
    await insertItems(q, r.id, data.items);
    return q.get('SELECT * FROM pedidos WHERE id=?', [r.id]);
  });
  res.status(201).json(order);
}));
app.put('/api/pedidos/:id', route(async (req, res) => {
  const order = await transaction(async q => {
    const old = await q.get('SELECT * FROM pedidos WHERE id=?', [req.recordId]);
    if (!old) throw error('Pedido não encontrado.', 404);
    let status = old.status;
    if (req.body.status != null) {
      status = text(req.body.status, 'Status').toUpperCase();
      if (!['ABERTO', 'EM_PREPARO', 'CONCLUIDO', 'CANCELADO'].includes(status)) throw error('Status inválido.');
    }
    if (req.body.itens != null || req.body.cliente_id != null) {
      if (['CONCLUIDO', 'CANCELADO'].includes(old.status)) throw error('Só é possível editar itens de pedidos abertos ou em preparo.', 409);
      const data = await orderItems(q, req.body);
      await q.run('UPDATE pedidos SET cliente_id=?, total=?, observacao=?, status=? WHERE id=?', [data.clienteId, data.total, data.observacao, status, old.id]);
      await q.run('DELETE FROM itens_pedido WHERE pedido_id=?', [old.id]);
      await insertItems(q, old.id, data.items);
    } else {
      if (req.body.status == null && req.body.observacao == null) throw error('Informe status, observação ou os itens do pedido.');
      const note = req.body.observacao == null ? old.observacao : text(req.body.observacao, 'Observação', 1000);
      await q.run('UPDATE pedidos SET status=?, observacao=? WHERE id=?', [status, note, old.id]);
    }
    return q.get('SELECT * FROM pedidos WHERE id=?', [old.id]);
  });
  res.json(order);
}));
app.delete('/api/pedidos/:id', route(async (req, res) => {
  const r = await run('DELETE FROM pedidos WHERE id=?', [req.recordId]);
  if (!r.changes) throw error('Pedido não encontrado.', 404);
  res.json({ mensagem: 'Pedido excluído com sucesso.' });
}));
// Timestamps SQLite são UTC; os dias operacionais seguem Brasília (UTC-3).
app.get('/api/dashboard', route(async (req, res) => {
  const c = await get('SELECT COUNT(*) AS total FROM clientes'), p = await get('SELECT COUNT(*) AS total FROM produtos WHERE ativo=1');
  const today = await get("SELECT COUNT(*) AS total, COALESCE(SUM(total),0) AS valor FROM pedidos WHERE date(data_pedido,'-3 hours')=date('now','-3 hours') AND status <> 'CANCELADO'");
  const revenue = await get("SELECT COALESCE(SUM(total),0) AS valor FROM pedidos WHERE status='CONCLUIDO'");
  res.json({ clientes: c.total, produtos: p.total, pedidos_hoje: today.total, vendas_hoje: Number(today.valor.toFixed(2)), faturamento_total: Number(revenue.valor.toFixed(2)) });
}));
function dateFilter(value) {
  const result = text(value, 'Data', 10);
  if (result && (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(`${result}T00:00:00Z`)) || new Date(`${result}T00:00:00Z`).toISOString().slice(0,10) !== result)) throw error('Data inválida. Use AAAA-MM-DD.');
  return result;
}
app.get('/api/relatorios/vendas', route(async (req, res) => {
  const inicio = dateFilter(req.query.inicio), fim = dateFilter(req.query.fim);
  if (inicio && fim && inicio > fim) throw error('A data inicial não pode ser posterior à data final.');
  const where = ["p.status <> 'CANCELADO'"], params = [];
  if (inicio) { where.push("date(p.data_pedido,'-3 hours') >= ?"); params.push(inicio); }
  if (fim) { where.push("date(p.data_pedido,'-3 hours') <= ?"); params.push(fim); }
  const vendas = await all(`${orderSelect} WHERE ${where.join(' AND ')} ORDER BY p.data_pedido DESC, p.id DESC`, params);
  res.json({ resumo: { quantidade: vendas.length, total: vendas.reduce((sum, v) => sum + Math.round(v.total * 100), 0) / 100 }, vendas });
}));
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
  let status = err.status || 500, message = err.message;
  if (err.code === 'SQLITE_CONSTRAINT') { status = 409; message = 'Registro possui vínculos ou viola uma regra do banco de dados.'; }
  if (status >= 500) { console.error(err); message = 'Não foi possível concluir a operação.'; }
  if (err.type === 'entity.parse.failed') message = 'JSON inválido.';
  res.status(status).json({ erro: message });
});
async function start() {
  await ready;
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, '0.0.0.0', () => console.log(`InovaPan API na porta ${port}`));
  const shutdown = () => server.close(() => db.close(() => process.exit(0)));
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
  return server;
}
if (require.main === module) start().catch(err => { console.error(err); process.exit(1); });
module.exports = { app, start };
