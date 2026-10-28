let produtosCache = [];
let editandoProduto = null;
async function carregarProdutos() {
  try {
    const q = pesquisaProduto.value.trim();
    produtosCache = await api(`/produtos${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    contadorProdutos.textContent = `${produtosCache.length} produto(s)`;
    listaProdutos.innerHTML = produtosCache.map(p => `<tr><td>${esc(p.nome)}</td><td>${esc(p.descricao || '-')}</td><td>${moeda(p.preco)}</td><td>${p.ativo ? 'Ativo' : 'Inativo'}</td><td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" onclick="editarProduto(${p.id})">Editar</button> <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto(${p.id})">Excluir</button></td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted">Nenhum produto cadastrado.</td></tr>';
  } catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
}
function editarProduto(id) { const p=produtosCache.find(x=>x.id===id); if(!p)return; editandoProduto=id; tituloModalProduto.textContent='Editar produto'; nomeProduto.value=p.nome; descricaoProduto.value=p.descricao||''; precoProduto.value=p.preco; ativoProduto.checked=!!p.ativo; bootstrap.Modal.getOrCreateInstance(modalProduto).show(); }
async function excluirProduto(id){ if(!confirm('Deseja excluir/inativar este produto?'))return; try{ const r=await api(`/produtos/${id}`,{method:'DELETE'}); await carregarProdutos(); alerta('mensagemPagina',r.mensagem);}catch(e){alerta('mensagemPagina',e.message,'danger');}}
document.addEventListener('DOMContentLoaded',()=>{ carregarProdutos(); pesquisaProduto.addEventListener('input',carregarProdutos); modalProduto.addEventListener('hidden.bs.modal',()=>{editandoProduto=null; formProduto.reset(); ativoProduto.checked=true; tituloModalProduto.textContent='Novo produto';}); formProduto.addEventListener('submit',async e=>{e.preventDefault(); const payload={nome:nomeProduto.value,descricao:descricaoProduto.value,preco:Number(precoProduto.value),ativo:ativoProduto.checked}; try{await api(editandoProduto?`/produtos/${editandoProduto}`:'/produtos',{method:editandoProduto?'PUT':'POST',body:JSON.stringify(payload)}); bootstrap.Modal.getInstance(modalProduto).hide(); await carregarProdutos(); alerta('mensagemPagina','Produto salvo com sucesso.');}catch(err){alerta('mensagemProduto',err.message,'danger');}});});
