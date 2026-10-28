const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const net = require('node:net');
const sqlite3 = require('sqlite3');
let child, base, dir, env, token, cliente, bolo, pao, pedido;
let logs = '';
async function start() {
  child = spawn(process.execPath, ['server.js'], { cwd:path.join(__dirname,'..'), env, stdio:['ignore','pipe','pipe'] });
  child.stdout.on('data', d => { logs += d; }); child.stderr.on('data', d => { logs += d; });
  for (let i=0;i<150;i++) {
    if (child.exitCode != null) throw new Error(logs);
    try { if ((await fetch(base+'/health')).ok) return; } catch (_) {}
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw new Error('API não iniciou: '+logs);
}
async function stop() { if (child && child.exitCode == null) { child.kill('SIGTERM'); await once(child,'exit'); } }
async function request(method, endpoint, body, customHeaders={}) {
  const response = await fetch(base+endpoint, { method, headers:{ ...(token?{Authorization:'Bearer '+token}:{}), ...(body===undefined?{}:{'Content-Type':'application/json'}), ...customHeaders }, ...(body===undefined?{}:{body:JSON.stringify(body)}) });
  return { status:response.status, data:await response.json(), headers:response.headers };
}
before(async()=>{
  dir = await mkdtemp(path.join(os.tmpdir(),'inovapan-test-'));
  const portServer = net.createServer(); await new Promise(r=>portServer.listen(0,'127.0.0.1',r));
  const port = portServer.address().port; await new Promise(r=>portServer.close(r));
  base = `http://127.0.0.1:${port}/api`;
  env = { ...process.env, PORT:String(port), DB_PATH:path.join(dir,'test.db'), ADMIN_USER:'teste', ADMIN_PASSWORD:'senha-apenas-para-testes', AUTH_SECRET:crypto.randomBytes(32).toString('hex'), CORS_ORIGINS:'http://localhost:5500' };
  await start();
});
after(async()=>{ await stop(); if (dir) await rm(dir,{recursive:true,force:true}); });
test('Saúde pública e proteção das operações',async()=>{
  assert.equal((await request('GET','/health')).data.status,'ok');
  assert.equal((await request('GET','/clientes')).status,401);
  assert.equal((await request('POST','/clientes',{nome:'Sem login',telefone:'1'})).status,401);
});
test('Login real e rejeição de token adulterado',async()=>{
  assert.equal((await request('POST','/auth/login',{usuario:'teste',senha:'errada'})).status,401);
  const result=await request('POST','/auth/login',{usuario:'teste',senha:env.ADMIN_PASSWORD});
  assert.equal(result.status,200); token=result.data.token;
  assert.equal((await request('GET','/clientes',undefined,{Authorization:'Bearer adulterado'})).status,401);
  const [payload]=token.split('.');
  assert.equal((await request('GET','/clientes',undefined,{Authorization:`Bearer ${payload}.invalida`})).status,401);
});
test('CORS aceita origem configurada e bloqueia origem externa',async()=>{
  const allowed=await request('GET','/clientes',undefined,{Origin:'http://localhost:5500'});
  assert.equal(allowed.headers.get('access-control-allow-origin'),'http://localhost:5500');
  assert.equal((await request('GET','/clientes',undefined,{Origin:'https://origem-invalida.example'})).status,403);
  const preflight=await fetch(base+'/clientes',{method:'OPTIONS',headers:{Origin:'http://localhost:5500','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
  assert.equal(preflight.status,204);
});
test('Clientes com cadastro consulta busca edição e validações',async()=>{
  assert.equal((await request('POST','/clientes',{nome:'Sem telefone'})).status,400);
  assert.equal((await request('POST','/clientes',{nome:'Nome',telefone:'123',email:'invalido'})).status,400);
  const result=await request('POST','/clientes',{nome:'Maria Silva',telefone:'89999990000',email:'maria@example.com',endereco:'Rua do teste'});
  assert.equal(result.status,201);cliente=result.data;
  assert.equal((await request('GET','/clientes?q=Maria')).data.length,1);
  assert.equal((await request('PUT',`/clientes/${cliente.id}`,{...cliente,endereco:'Rua atualizada'})).data.endereco,'Rua atualizada');
  assert.equal((await request('DELETE','/clientes/abc')).status,400);
  assert.equal((await request('DELETE','/clientes/99999')).status,404);
});
test('Produtos com valores e tipos validados',async()=>{
  for (const preco of [-1,'',null,true,1.234]) assert.equal((await request('POST','/produtos',{nome:'Inválido',preco})).status,400);
  const b=await request('POST','/produtos',{nome:'Bolo de Chocolate',preco:25,ativo:true});
  const p=await request('POST','/produtos',{nome:'Pão Francês',preco:1,ativo:true});
  assert.equal(b.status,201); assert.equal(p.status,201); bolo=b.data; pao=p.data;
  assert.equal((await request('GET','/produtos?q=Pão')).data.length,1);
});
test('Pedido calcula R$35 no servidor e ignora valores enviados pela UI',async()=>{
  const r=await request('POST','/pedidos',{cliente_id:cliente.id,total:0,itens:[{produto_id:bolo.id,quantidade:1,valor_unitario:0},{produto_id:pao.id,quantidade:10}]});
  assert.equal(r.status,201);assert.equal(r.data.total,35);pedido=r.data;
  assert.equal((await request('GET',`/pedidos/${pedido.id}`)).data.itens.length,2);
});
test('Edição de itens e cliente recalcula para R$40',async()=>{
  const r=await request('PUT',`/pedidos/${pedido.id}`,{cliente_id:cliente.id,observacao:'Retirada no balcão',itens:[{produto_id:bolo.id,quantidade:1},{produto_id:pao.id,quantidade:15}]});
  assert.equal(r.status,200);assert.equal(r.data.total,40);
  assert.equal((await request('GET',`/pedidos/${pedido.id}`)).data.itens.find(i=>i.produto_id===pao.id).quantidade,15);
});
test('Falhas em criação e edição não deixam registros parciais',async()=>{
  const bad={cliente_id:cliente.id,itens:[{produto_id:bolo.id,quantidade:1},{produto_id:99999,quantidade:2}]};
  assert.equal((await request('POST','/pedidos',bad)).status,400);
  assert.equal((await request('PUT',`/pedidos/${pedido.id}`,bad)).status,400);
  const current=(await request('GET',`/pedidos/${pedido.id}`)).data;
  assert.equal(current.total,40);assert.equal(current.itens.length,2);
  assert.equal((await request('GET','/pedidos')).data.length,1);
});
test('Oito pedidos simultâneos e uma falha mantêm as transações isoladas',async()=>{
  const valid={cliente_id:cliente.id,itens:[{produto_id:pao.id,quantidade:1}]};
  const results=await Promise.all([...Array.from({length:8},()=>request('POST','/pedidos',valid)),request('POST','/pedidos',{...valid,itens:[{produto_id:pao.id,quantidade:-1}]})]);
  assert.deepEqual(results.map(r=>r.status),[201,201,201,201,201,201,201,201,400]);
  assert.equal((await request('GET','/pedidos')).data.length,9);
  for (const r of results.slice(0,8)) { assert.equal(r.data.total,1);assert.equal((await request('DELETE',`/pedidos/${r.data.id}`)).status,200); }
});
test('Vínculos preservam cliente e inativam produto utilizado',async()=>{
  assert.equal((await request('DELETE',`/clientes/${cliente.id}`)).status,409);
  assert.equal((await request('DELETE',`/produtos/${bolo.id}`)).status,200);
  assert.equal((await request('GET','/produtos')).data.find(p=>p.id===bolo.id).ativo,0);
  assert.equal((await request('POST','/pedidos',{cliente_id:cliente.id,itens:[{produto_id:bolo.id,quantidade:1}]})).status,400);
  assert.equal((await request('PUT',`/produtos/${bolo.id}`,{...bolo,ativo:true})).status,200);
});
test('Status cancelado sai das vendas e pedido concluído bloqueia edição de itens',async()=>{
  assert.equal((await request('PUT',`/pedidos/${pedido.id}`,{status:'INVALIDO'})).status,400);
  await request('PUT',`/pedidos/${pedido.id}`,{status:'CANCELADO'});
  assert.equal((await request('GET','/relatorios/vendas')).data.resumo.total,0);
  await request('PUT',`/pedidos/${pedido.id}`,{status:'CONCLUIDO'});
  assert.equal((await request('PUT',`/pedidos/${pedido.id}`,{cliente_id:cliente.id,itens:[{produto_id:pao.id,quantidade:1}]})).status,409);
  assert.equal((await request('GET','/dashboard')).data.faturamento_total,40);
});
test('Relatório valida intervalo calendário e horário de Brasília',async()=>{
  assert.equal((await request('GET','/relatorios/vendas?inicio=2026-02-30')).status,400);
  assert.equal((await request('GET','/relatorios/vendas?inicio=2026-11-01&fim=2026-10-01')).status,400);
  const extra=(await request('POST','/pedidos',{cliente_id:cliente.id,itens:[{produto_id:pao.id,quantidade:1}]})).data;
  const connection=new sqlite3.Database(env.DB_PATH);
  await new Promise((resolve,reject)=>connection.run("UPDATE pedidos SET data_pedido='2026-01-02 01:30:00' WHERE id=?",[extra.id],e=>e?reject(e):resolve()));
  await new Promise(r=>connection.close(r));
  const previous=(await request('GET','/relatorios/vendas?inicio=2026-01-01&fim=2026-01-01')).data;
  assert.ok(previous.vendas.some(p=>p.id===extra.id));
  const next=(await request('GET','/relatorios/vendas?inicio=2026-01-02&fim=2026-01-02')).data;
  assert.ok(!next.vendas.some(p=>p.id===extra.id));
  await request('DELETE',`/pedidos/${extra.id}`);
  assert.deepEqual((await request('GET','/relatorios/vendas')).data.resumo,{quantidade:1,total:40});
});
test('Banco preserva dados após reinício do processo',async()=>{
  await stop();await start();
  assert.equal((await request('GET',`/pedidos/${pedido.id}`)).data.total,40);
  assert.equal((await request('GET','/clientes')).data[0].nome,'Maria Silva');
});
test('Exclusão em cascata permite remover cadastros sem vínculos',async()=>{
  assert.equal((await request('DELETE',`/pedidos/${pedido.id}`)).status,200);
  assert.equal((await request('DELETE',`/clientes/${cliente.id}`)).status,200);
  assert.equal((await request('DELETE',`/produtos/${bolo.id}`)).status,200);
  assert.equal((await request('GET','/pedidos')).data.length,0);
});
