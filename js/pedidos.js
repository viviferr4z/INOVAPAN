let clientes = [], produtos = [], itens = [], editandoPedido = null, pedidosCache = [];
async function carregarBase() {
  [clientes, produtos] = await Promise.all([api('/clientes'), api('/produtos')]);
  clientePedido.innerHTML = '<option value="">Selecione...</option>' + clientes.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  produtoPedido.innerHTML = '<option value="">Selecione...</option>' + produtos.filter(p => p.ativo).map(p => `<option value="${p.id}">${esc(p.nome)} - ${moeda(p.preco)}</option>`).join('');
}
function renderItens() {
  itensPedido.innerHTML = itens.map((i, idx) => `<tr><td>${esc(i.nome)}</td><td>${i.quantidade}</td><td>${moeda(i.preco)}</td><td>${moeda(i.preco * i.quantidade)}</td><td><button type="button" class="btn btn-sm btn-outline-danger" onclick="removerItem(${idx})">Remover</button></td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted">Adicione produtos ao pedido.</td></tr>';
  totalPedido.textContent = moeda(itens.reduce((s, i) => s + Math.round(i.preco * 100) * i.quantidade, 0) / 100);
}
function adicionarItem() {
  const id = Number(produtoPedido.value), qtd = Number(quantidadePedido.value), p = produtos.find(x => x.id === id);
  const existente = itens.find(x => x.produto_id === id);
  if (!p || !p.ativo || !Number.isInteger(qtd) || qtd <= 0 || (existente?.quantidade || 0) + qtd > 100000) return alerta('mensagemPedido', 'Selecione um produto e uma quantidade de 1 a 100000.', 'warning');
  if (existente) existente.quantidade += qtd;
  else itens.push({ produto_id: id, nome: p.nome, preco: Number(p.preco), quantidade: qtd });
  quantidadePedido.value = 1; renderItens();
}
function removerItem(i) { itens.splice(i, 1); renderItens(); }
async function carregarPedidos() {
  try {
    pedidosCache = await api('/pedidos');
    listaPedidos.innerHTML = pedidosCache.map(p => `<tr><td>#${p.id}</td><td>${esc(p.cliente)}</td><td>${dataHora(p.data_pedido)}</td><td>${esc(p.status.replace('_',' '))}</td><td>${moeda(p.total)}</td><td class="text-nowrap"><select aria-label="Status do pedido ${p.id}" class="form-select form-select-sm d-inline-block w-auto" onchange="alterarStatus(${p.id},this.value)">${['ABERTO','EM_PREPARO','CONCLUIDO','CANCELADO'].map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${s.replace('_',' ')}</option>`).join('')}</select> <button type="button" class="btn btn-sm btn-outline-primary" onclick="verPedido(${p.id})">Detalhes</button> ${['ABERTO','EM_PREPARO'].includes(p.status) ? `<button type="button" class="btn btn-sm btn-outline-primary" onclick="editarPedido(${p.id})">Editar</button>` : ''} <button type="button" class="btn btn-sm btn-outline-danger" onclick="excluirPedido(${p.id})">Excluir</button></td></tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted">Nenhum pedido registrado.</td></tr>';
  } catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
}
function verPedido(id) {
  const p = pedidosCache.find(x => x.id === id); if (!p) return;
  document.getElementById('detalhesTitulo').textContent = `Pedido #${p.id}`;
  document.getElementById('detalhesConteudo').innerHTML = `<p><strong>Cliente:</strong> ${esc(p.cliente)}<br><strong>Status:</strong> ${esc(p.status)}<br><strong>Observação:</strong> ${esc(p.observacao || '-')}</p><div class="table-responsive"><table class="table"><thead><tr><th>Produto</th><th>Qtd.</th><th>Unitário</th><th>Subtotal</th></tr></thead><tbody>${p.itens.map(i => `<tr><td>${esc(i.produto)}</td><td>${i.quantidade}</td><td>${moeda(i.valor_unitario)}</td><td>${moeda(i.valor_total)}</td></tr>`).join('')}</tbody></table></div><p class="fw-bold text-end">Total: ${moeda(p.total)}</p>`;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalhes')).show();
}
async function editarPedido(id) {
  try {
    await carregarBase();
    const p = await api(`/pedidos/${id}`);
    editandoPedido = id;
    clientePedido.value = p.cliente_id; observacaoPedido.value = p.observacao || '';
    itens = p.itens.map(i => ({ produto_id: i.produto_id, nome: i.produto, quantidade: i.quantidade, preco: Number(produtos.find(x => x.id === i.produto_id)?.preco ?? i.valor_unitario) }));
    tituloModalPedido.textContent = `Editar pedido #${id}`; salvarPedido.textContent = 'Salvar alterações';
    renderItens();
    alerta('mensagemPedido', 'Ao salvar, o pedido será recalculado com os preços atuais. Remova produtos inativos.', 'info');
    bootstrap.Modal.getOrCreateInstance(modalPedido).show();
  } catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
}
async function alterarStatus(id, status) {
  try { await api(`/pedidos/${id}`, { method:'PUT', body:JSON.stringify({ status }) }); await carregarPedidos(); }
  catch (e) { alerta('mensagemPagina', e.message, 'danger'); await carregarPedidos(); }
}
async function excluirPedido(id) {
  if (!confirm('Deseja excluir este pedido?')) return;
  try { await api(`/pedidos/${id}`, { method:'DELETE' }); await carregarPedidos(); alerta('mensagemPagina', 'Pedido excluído.'); }
  catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
}
document.addEventListener('DOMContentLoaded', async () => {
  try { await carregarBase(); await carregarPedidos(); renderItens(); } catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
  adicionarProduto.addEventListener('click', adicionarItem);
  document.getElementById('novoPedido').addEventListener('click', async () => {
    editandoPedido = null; itens = []; formPedido.reset();
    tituloModalPedido.textContent = 'Novo pedido'; salvarPedido.textContent = 'Registrar pedido';
    document.getElementById('mensagemPedido').replaceChildren();
    try { await carregarBase(); renderItens(); bootstrap.Modal.getOrCreateInstance(modalPedido).show(); }
    catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
  });
  formPedido.addEventListener('submit', async e => {
    e.preventDefault();
    if (!clientePedido.value || !itens.length) return alerta('mensagemPedido', 'Selecione o cliente e adicione pelo menos um item.', 'warning');
    salvarPedido.disabled = true;
    try {
      await api(editandoPedido ? `/pedidos/${editandoPedido}` : '/pedidos', { method: editandoPedido ? 'PUT' : 'POST', body: JSON.stringify({ cliente_id:Number(clientePedido.value), observacao:observacaoPedido.value, itens:itens.map(i => ({ produto_id:i.produto_id, quantidade:i.quantidade })) }) });
      bootstrap.Modal.getInstance(modalPedido).hide(); await carregarPedidos(); alerta('mensagemPagina', 'Pedido salvo com sucesso.');
    } catch (err) { alerta('mensagemPedido', err.message, 'danger'); }
    finally { salvarPedido.disabled = false; }
  });
});
