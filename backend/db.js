const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'inovapan.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);
db.configure('busyTimeout', 10000);
function queries(connection) {
  return {
    all: (sql, params = []) => new Promise((resolve, reject) => connection.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))),
    get: (sql, params = []) => new Promise((resolve, reject) => connection.get(sql, params, (err, row) => err ? reject(err) : resolve(row))),
    run: (sql, params = []) => new Promise((resolve, reject) => connection.run(sql, params, function (err) {
      err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
    }))
  };
}
const ready = new Promise((resolve, reject) => db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL,
    telefone TEXT NOT NULL, email TEXT, endereco TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, descricao TEXT,
    preco REAL NOT NULL CHECK (preco >= 0), ativo INTEGER NOT NULL DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, cliente_id INTEGER NOT NULL,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'ABERTO', total REAL NOT NULL DEFAULT 0,
    observacao TEXT, FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );
  CREATE TABLE IF NOT EXISTS itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT, pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL, quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_unitario REAL NOT NULL CHECK (valor_unitario >= 0),
    valor_total REAL NOT NULL CHECK (valor_total >= 0),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
  );
  CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_itens_pedido ON itens_pedido(pedido_id);
  CREATE INDEX IF NOT EXISTS idx_itens_produto ON itens_pedido(produto_id);
`, err => err ? reject(err) : resolve()));
// Serializa as escritas transacionais antes de ocupar threads do sqlite3.
// Sem a fila, vários BEGIN bloqueados podem impedir o COMMIT de obter uma thread.
let transactionTail = Promise.resolve();
async function transaction(operation) {
  let release;
  const previous = transactionTail;
  transactionTail = new Promise(resolve => { release = resolve; });
  await previous;
  try { return await isolatedTransaction(operation); }
  finally { release(); }
}
// A conexão própria impede escritas de outras rotas dentro de BEGIN/COMMIT.
async function isolatedTransaction(operation) {
  await ready;
  const connection = new sqlite3.Database(dbPath);
  connection.configure('busyTimeout', 10000);
  const q = queries(connection);
  try {
    await q.run('PRAGMA foreign_keys = ON');
    await q.run('BEGIN IMMEDIATE');
    const result = await operation(q);
    await q.run('COMMIT');
    return result;
  } catch (err) {
    await q.run('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await new Promise(resolve => connection.close(resolve));
  }
}
module.exports = { db, dbPath, ready, transaction, ...queries(db) };
